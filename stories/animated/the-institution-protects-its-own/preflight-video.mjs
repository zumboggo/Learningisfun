import fs from 'node:fs/promises';import os from 'node:os';
const token=(await fs.readFile(os.homedir()+'/.claude/replicate-token','utf8')).trim();
const model=await fetch('https://api.replicate.com/v1/models/prunaai/p-video-2-pro',{headers:{Authorization:'Bearer '+token}});if(!model.ok)throw Error('Model read '+model.status);
const m=await model.json();await fs.writeFile(new URL('model-preflight.json',import.meta.url),JSON.stringify({name:m.name,owner:m.owner,latest_version:m.latest_version},null,2));
const page=await fetch('https://replicate.com/prunaai/p-video-2-pro');if(!page.ok)throw Error('Pricing read '+page.status);await fs.writeFile('/tmp/institution-model-page.html',await page.text());
console.log(JSON.stringify({version:m.latest_version.id,input:m.latest_version.openapi_schema.components.schemas.Input},null,2));
