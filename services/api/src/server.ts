import {denialValidationReport,activeDocumentationRisk} from './denial-risk.js';
import {correctnessReport} from './policy-correctness.js';
import {tracer,context,trace,propagation,SpanStatusCode,closeTelemetry} from './telemetry.js';
import {worklist} from './worklist.js';
import {initGovernance,center,propose,transition,suspendPolicy,internalReviewContext,internalReview} from './policy-governance.js';
import {initPolicyEvidence,policyEvidence} from './policy-intelligence.js';
import express from 'express';
import {report,metrics,registry,requestDuration} from './reporting.js';
import {z} from 'zod';
import {authorizationEvent,operational,escalate,decide} from './workflow.js';
import {assess,updateVitals,rules} from './review.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes} from 'node:crypto';
import {config} from './config.js';
import {initDb,pool} from './db.js';
import {login,verifyToken,serviceStatus} from './adapters.js';
import {fixtureIds,makeFixture} from './fixtures.js';
import {getCase,listCases,intake,HttpError,type Actor} from './store.js';
const app=express();
app.disable('x-powered-by');
app.use((req,res,next)=>{
 const requestId=randomUUID(),start=performance.now();res.setHeader('X-Request-Id',requestId);
 const span=tracer.startSpan('http.request',{},propagation.extract(context.active(),req.headers));span.setAttribute('request.id',requestId);
 res.on('finish',()=>{const route=String(req.route?.path||'unmatched');span.setAttributes({'http.request.method':req.method,'http.route':route,'http.response.status_code':res.statusCode});if(res.statusCode>=500)span.setStatus({code:SpanStatusCode.ERROR,message:'server_error'});span.end();requestDuration.observe({method:['GET','POST','DELETE'].includes(req.method)?req.method:'OTHER',route,status:String(Math.floor(res.statusCode/100))+'xx'},(performance.now()-start)/1000);});
 context.with(trace.setSpan(context.active(),span),next);
});
app.use((req,res,next)=>process.env.BENCHMARK_READ_ONLY==='true'&&req.method!=='GET'?res.status(403).json({error:'Isolated benchmark instance is read only'}):next());
app.use(express.json({limit:'256kb'}));
app.use((req,res,next)=>{
 res.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'"});
 if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`http://localhost:${config.port}`&&req.headers.origin!==`http://127.0.0.1:${config.port}`)return res.status(403).json({error:'Origin not allowed'});
 next();
});
const actor=(res:express.Response)=>res.locals.actor as Actor;
const allow=(roles:string[])=> (_req:express.Request,res:express.Response,next:express.NextFunction)=>roles.some(r=>actor(res).roles.includes(r))?next():next(new HttpError(403,'This role cannot perform that action'));
const failures=new Map<string,{count:number;until:number}>();
app.get('/metrics',async(_req,res)=>{res.type(registry.contentType).send(await metrics());});
app.get('/health',async(_req,res)=>{await pool.query('SELECT 1');res.json({ok:true,syntheticOnly:true});});
app.post('/api/session',async(req,res)=>{
 const ip=req.ip||'local',now=Date.now(),previous=failures.get(ip);
 if(previous&&previous.until>now&&previous.count>=10)throw new HttpError(429,'Too many login attempts; retry in one minute');
 if(typeof req.body?.username!=='string'||typeof req.body?.password!=='string')throw new HttpError(400,'Username and password required');
 try{
  const t=await login(req.body.username,req.body.password);const user=await verifyToken(t.access_token);
  failures.delete(ip);res.cookie('ur_session',t.access_token,{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',maxAge:Math.min(t.expires_in,900)*1000,path:'/'});res.json(user);
 }catch{failures.set(ip,{count:previous&&previous.until>now?previous.count+1:1,until:now+60000});throw new HttpError(401,'Sign-in failed');}
});
app.delete('/api/session',(_req,res)=>{res.clearCookie('ur_session',{path:'/'});res.json({ok:true});});
app.use('/api',async(req,res,next)=>{
 const bearer=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):undefined;
 const cookie=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('ur_session='))?.slice(11);
 try{res.locals.actor=await verifyToken(bearer||decodeURIComponent(cookie||''));if(!['reviewer','advisor','admin'].some(r=>actor(res).roles.includes(r)))return next(new HttpError(403,'No utilization review role assigned'));next();}catch{next(new HttpError(401,'Sign in to continue'));}
});
app.get('/api/me',(_req,res)=>res.json(actor(res)));
app.get('/api/services',async(_req,res)=>res.json(await serviceStatus()));
app.get('/api/fixtures',(_req,res)=>res.json(fixtureIds));
app.get('/api/fixtures/:id',(req,res)=>{if(!fixtureIds.includes(String(req.params.id)))throw new HttpError(404,'Fixture not found');res.json(makeFixture(String(req.params.id)));});
app.post('/api/intake',allow(['admin','reviewer']),async(req,res)=>{
 const key=req.headers['idempotency-key'];if(typeof key!=='string'||!key.length||key.length>128)throw new HttpError(400,'Idempotency-Key header required (max 128 characters)');
 const result=await intake(req.body,key,actor(res));res.status(result.duplicate?200:201).json(result);
});
app.get('/api/cases',async(_req,res)=>res.json((await listCases()).map(operational)));
app.get('/api/cases/:id',async(req,res)=>res.json(operational(await getCase(String(req.params.id)))));
app.get('/api/cases/:id/audit',async(req,res)=>{await getCase(String(req.params.id));res.json((await pool.query('SELECT * FROM audit WHERE case_id=$1 ORDER BY sequence',[String(req.params.id)])).rows);});
app.get('/api/encounter-worklist',async(req,res)=>res.json(await worklist(req.query)));
app.get('/api/operational-alerts',async(_req,res)=>{const services=await serviceStatus();const alerts=Object.entries(services).filter(([,v])=>v!=='ready').map(([service])=>({service,severity:'warning',message:'Dependency unavailable; review workflow may be degraded'}));res.json({checkedAt:new Date().toISOString(),services,alerts,externalNotificationsSent:false});});
app.get('/api/policy-center',async(_req,res)=>res.json(await center(actor(res))));
app.post('/api/policy-changes',async(req,res)=>res.json(await propose(req.body,actor(res))));
app.post('/api/policy-changes/:id/actions',async(req,res)=>res.json(await transition(String(req.params.id),req.body,actor(res))));
app.post('/api/policy-suspension',async(req,res)=>res.json(await suspendPolicy(req.body,actor(res))));
app.get('/api/cases/:id/authorization-review',async(req,res)=>res.json(await internalReviewContext(String(req.params.id))));
app.post('/api/cases/:id/authorization-review',async(req,res)=>res.json(await internalReview(String(req.params.id),req.body,actor(res))));
app.get('/api/denial-validation',allow(['admin','advisor']),(_req,res)=>res.json(denialValidationReport()));
app.get('/api/cases/:id/denial-risk-review',async(req,res)=>res.json(activeDocumentationRisk((await internalReviewContext(String(req.params.id))).evaluation)));
app.get('/api/policy-validation',allow(['admin','advisor']),(_req,res)=>res.json(correctnessReport()));
app.get('/api/policy-evidence',async(_req,res)=>res.json(await policyEvidence()));
app.get('/api/rules',(_req,res)=>res.json(rules));
app.post('/api/cases/:id/reviews',allow(['reviewer','advisor','admin']),async(req,res)=>{
 const input=z.object({kind:z.enum(['initial','continued-stay'])}).strict().parse(req.body);
 res.json(await assess(String(req.params.id),actor(res),input.kind));
});
app.post('/api/cases/:id/synthetic-vitals',allow(['reviewer','admin']),async(req,res)=>res.json(await updateVitals(String(req.params.id),req.body,actor(res))));
app.post('/api/cases/:id/authorization',allow(['reviewer','admin']),async(req,res)=>res.json(await authorizationEvent(String(req.params.id),req.body,actor(res))));
app.post('/api/cases/:id/escalations',allow(['reviewer','admin']),async(req,res)=>res.json(await escalate(String(req.params.id),req.body,actor(res))));
app.post('/api/cases/:id/decisions',allow(['advisor','admin']),async(req,res)=>res.json(await decide(String(req.params.id),req.body,actor(res))));
app.get('/api/audit',async(_req,res)=>res.json((await pool.query('SELECT * FROM audit ORDER BY sequence DESC LIMIT 250')).rows));
app.get('/api/reports',async(_req,res)=>res.json(await report()));
app.get('/api/openapi.json',(_req,res)=>res.sendFile(path.resolve('docs/openapi.json')));
app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../dist')));
app.get('/',(_req,res)=>res.sendFile(path.resolve('dist/index.html')));
app.use((err:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
 const status=err instanceof z.ZodError?422:err.status||502;if(status>=500)console.error(err.message);res.status(status).json({error:status>=500?'A dependency failed. No success is claimed; retry after checking service health.':err.message});
});
await initDb();
await initPolicyEvidence();
await initGovernance();
const server=app.listen(config.port,process.env.BIND_HOST||'127.0.0.1',()=>console.log(`Synthetic UR demo listening on http://localhost:${config.port}`));
async function shutdown(){server.close();await pool.end();await closeTelemetry();process.exit(0);}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
