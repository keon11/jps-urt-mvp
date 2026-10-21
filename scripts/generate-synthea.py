"""Generate real Synthea output with pinned executable bytes; no clinical data input."""
from pathlib import Path
from hashlib import sha256
import subprocess
root=Path(__file__).resolve().parent.parent
runtime=root/'.runtime/synthea';runtime.mkdir(parents=True,exist_ok=True)
jar=runtime/'synthea-v4.0.0.jar'
url='https://github.com/synthetichealth/synthea/releases/download/v4.0.0/synthea-with-dependencies.jar'
expected='ed43c20ad40ba5c3bc724503a5af032715fe3c491620b766148e7c2361e6ecc1'
if not jar.exists():subprocess.run(['curl','--fail','--location','--proto','=https','--max-time','180','-o',str(jar),url],check=True)
assert sha256(jar.read_bytes()).hexdigest()==expected,'Synthea executable digest mismatch; do not run'
license=runtime/'LICENSE'
if not license.exists():subprocess.run(['curl','--fail','--silent','--proto','=https','--max-time','25','-o',str(license),'https://raw.githubusercontent.com/synthetichealth/synthea/v4.0.0/LICENSE'],check=True)
cmd=['java','-Xmx768m','-jar',str(jar),'-s','20261404054','-cs','20261404054','-p','12','-a','18-85','-r','20261020','-e','20261020','Texas','--exporter.baseDirectory=.runtime/synthea/output','--exporter.years_of_history=5','--exporter.fhir.export=true','--exporter.ccda.export=false','--exporter.csv.export=false','--generate.thread_pool_size=2']
subprocess.run(cmd,cwd=root,check=True)
subprocess.run(['npx','tsx','scripts/synthea-corpus.ts'],cwd=root,check=True)
