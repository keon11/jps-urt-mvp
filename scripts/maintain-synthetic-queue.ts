/** Explicit operator-only maintenance on the isolated synthetic benchmark database. */
import {isolatedContext,closeOriginal}from './reliability-context.js';import{writeFile}from'node:fs/promises';
const c=await isolatedContext();if(!/^ur_issue2_\d+$/.test(c.dbname))throw Error('Only isolated synthetic benchmark DB allowed');
const sql="SELECT relpages,relallvisible,reltuples,pg_relation_size(oid) AS bytes FROM pg_class WHERE oid='cases'::regclass";
const before=(await c.db.query(sql)).rows;const start=performance.now();await c.db.query('VACUUM (ANALYZE) cases');const seconds=(performance.now()-start)/1000;const after=(await c.db.query(sql)).rows;
await writeFile('artifacts/issue-5/maintenance.json',JSON.stringify({scope:'Explicit ordinary VACUUM/ANALYZE on isolated synthetic fixture only; no forced planner setting, production DDL, workflow/action mutation or extra engine',before,after,seconds,completed:true},null,2)+'\n');console.log('Synthetic isolated maintenance completed in',seconds,'seconds.');await c.db.end();await closeOriginal();
