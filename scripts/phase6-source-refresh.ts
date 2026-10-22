// Source-only public discovery; no submission, contact or signed content.
import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import {load} from 'cheerio';import robotsParser from 'robots-parser';
const run=promisify(execFile),base='https://www.jpshealthnet.org',url=base+'/rfp/utilization-review-technology-and-optimization-partner-urt';
const result:any={at:new Date().toISOString(),url,submitted:false,signed:false,termsAccepted:false};
await mkdir('.runtime/phase6-official',{recursive:true});
try{
 const robots=(await run('curl',['--fail','--silent','--show-error','--proto','=https','--max-time','25',base+'/robots.txt'])).stdout;
 const rules=robotsParser(base+'/robots.txt',robots);if(rules.isAllowed(url,'HospitalURPolicyDemo')!==true)throw Error('Page not explicitly permitted by robots');
 const html=(await run('curl',['--fail','--silent','--show-error','--proto','=https','--max-time','25','--max-filesize','1000000',url])).stdout;const $=load(html);const urls=new Map<string,string>();
 $('a[href]').each((_,el)=>{const u=new URL($(el).attr('href')!,url);if(u.origin===base&&/\.(docx|xlsx|pdf)$/i.test(u.pathname))urls.set(u.href,$(el).text().trim());});
 const attachments=[];for(const [u,label] of urls){
  const entry:any={url:u,label,robotsPermitted:rules.isAllowed(u,'HospitalURPolicyDemo')===true};
  if(entry.robotsPermitted){
   const {stdout}=await run('curl',['--fail','--silent','--show-error','--proto','=https','--max-time','30','--max-filesize','10000000',u],{encoding:'buffer',maxBuffer:10000000});
   entry.sha256=createHash('sha256').update(stdout).digest('hex');entry.privatePath='.runtime/phase6-official/'+decodeURIComponent(new URL(u).pathname.split('/').at(-1)!);await writeFile(entry.privatePath,stdout);
  }
  attachments.push(entry);
 }
 Object.assign(result,{retrieved:true,pageSha256:createHash('sha256').update(html).digest('hex'),attachments,scope:'Current official public links/bytes; legal completeness and deadline confirmation remain owner responsibilities'});
}catch(error){Object.assign(result,{retrieved:false,blocker:(error as Error).message});}
await writeFile('artifacts/phase-6/official-source-refresh.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
