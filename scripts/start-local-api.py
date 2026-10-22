"""Keep the local demo API independent of a verification shell's lifetime.
No credentials are printed, and networking/bind policy remains application config.
"""
from pathlib import Path
import subprocess,os
root=Path(__file__).resolve().parent.parent
log=root/'.runtime/phase6-api.log';log.parent.mkdir(exist_ok=True)
env=os.environ.copy();env['TRACE_SAMPLE_RATE']='1'
with log.open('ab') as output:
 child=subprocess.Popen(['npm','start'],cwd=root,env=env,stdin=subprocess.DEVNULL,stdout=output,stderr=subprocess.STDOUT,start_new_session=True)
print('Started independent local API process',child.pid,'with private runtime log; readiness must be checked separately.')
