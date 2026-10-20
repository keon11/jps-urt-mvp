#!/usr/bin/env python3
"""Verify the actual official Postgres entrypoint against an isolated empty tmpfs."""
import subprocess,time,pathlib,json,datetime
root=pathlib.Path(__file__).resolve().parent.parent
name='ur-mvp-clean-init-smoke'
container=None
try:
 container=subprocess.check_output(['docker','run','-d','--rm','--name',name,'--network','none','--tmpfs','/var/lib/postgresql/data:rw,size=256m','-e','POSTGRES_USER=ur','-e','POSTGRES_PASSWORD=synthetic-local-only','-v',str(root/'infra/init.sql')+':/docker-entrypoint-initdb.d/init.sql:ro','postgres:16.10'],text=True).strip()
 deadline=time.monotonic()+90
 while True:
  result=subprocess.run(['docker','logs',container],capture_output=True,text=True)
  if 'PostgreSQL init process complete' in result.stdout:break
  if time.monotonic()>deadline:raise RuntimeError('Clean initialization timed out: '+result.stdout[-1500:]+result.stderr[-1500:])
  time.sleep(1)
 databases=subprocess.check_output(['docker','exec',container,'psql','-U','ur','-d','postgres','-Atc',"SELECT datname FROM pg_database WHERE datname IN ('ur','medplum') ORDER BY datname"],text=True).strip().splitlines()
 role=subprocess.check_output(['docker','exec',container,'psql','-U','ur','-d','postgres','-Atc',"SELECT rolname FROM pg_roles WHERE rolname='medplum'"],text=True).strip()
 assert databases==['medplum','ur'] and role=='medplum',(databases,role)
 report={'passed':True,'databases':databases,'medplumRoleCreated':True,'isolatedEmptyDataDirectory':True,'at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 (root/'artifacts/clean-init-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
finally:
 if container:subprocess.run(['docker','stop',container],check=True,stdout=subprocess.DEVNULL)
