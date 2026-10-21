import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const pkg=JSON.parse(await fs.readFile('package.json','utf8'));const list=[];
for(const [name,version] of Object.entries({...pkg.dependencies,...pkg.devDependencies})){
 const dir='node_modules/'+name;const p=JSON.parse(await fs.readFile(dir+'/package.json','utf8'));const licenseFile=(await fs.readdir(dir)).find(f=>/^licen[cs]e(?:\.|$)/i.test(f));
 list.push({name,installed:p.version,pinned:version,license:p.license||'SEE PACKAGE',engines:p.engines||null,scope:name in pkg.dependencies?'runtime':'development',...(licenseFile?{licenseFile:licenseFile,licenseSha256:createHash('sha256').update(await fs.readFile(dir+'/'+licenseFile)).digest('hex')}:{})});
}
await fs.writeFile('docs/dependency-licenses.json',JSON.stringify(list,null,2)+'\n');console.log('Recorded installed versions, declared licenses and available license-file hashes for',list.length,'direct dependencies. Transitive and container legal review remains a production requirement.');
