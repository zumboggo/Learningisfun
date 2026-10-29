import {readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const dates=['2026-11-02','2026-11-05','2026-11-09','2026-11-12'];
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline=s=>escape(s).replace(/!\[([^\]]*)\]\((images\/\d+\.png)\)/g,'<img src="$2" alt="$1" loading="lazy">').replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
const style='body{background:#f5f0e6;color:#242a2c;font:20px/1.75 Georgia,serif;margin:0}main{max-width:800px;padding:48px 24px;margin:auto}h1{font-size:2.15em;line-height:1.15}h2{font-size:1.3em;margin-top:2.4em}img{display:block;width:100%;height:auto;border-radius:6px}a{color:#276967}nav,.meta{font:15px/1.6 system-ui}p:has(>em:only-child){font-size:15px;color:#5d6465}nav a{margin-right:18px}@media print{body{background:white;font-size:12pt}main{padding:0}img{max-height:17cm;object-fit:contain}h2{break-after:avoid}nav{display:none}}';
const manifest=[];
for(let n=1;n<=4;n++){
 const markdown=await readFile(path.join(root,`part-${n}.md`),'utf8');
 const title=markdown.split('\n')[0].replace(/^# /,'');
 const body=markdown.slice(markdown.indexOf('\n')+1).trim();
 const images=[...body.matchAll(/!\[[^\]]*\]\((images\/\d+\.png)\)/g)].map(m=>m[1]);
 if(images.length!==4||new Set(images).size!==4)throw Error(`Part ${n} needs four distinct images`);
 for(const image of images){const info=await stat(path.join(root,image));if(info.size>5*1024*1024)throw Error('Image too large');}
 const prose=body.split('## Sources')[0].replace(/!\[[^\]]*\]\([^)]+\)/g,'').replace(/^\*.*illustration\.\*$/gm,'').replace(/\[\d+(?:, \d+)*\]/g,'');
 const wordCount=prose.trim().split(/\s+/).length;
 if(wordCount<1500||wordCount>2000)throw Error(`Reading length ${n}: ${wordCount}`);
 if(/What idea here deserves|Where do you stand|Discussion questions|For discussion/i.test(body))throw Error('Unrequested prompts');
 const paragraphs=body.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
 const html=paragraphs.map(p=>p.startsWith('## ')?`<h2>${inline(p.slice(3))}</h2>`:`<p>${inline(p)}</p>`).join('\n');
 await writeFile(path.join(root,`part-${n}.html`),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${style}</style><main><nav><a href="index.html">Series overview</a></nav><p class="meta">Ethics and Leadership · ${dates[n-1]} · About 20 minutes</p><h1>${escape(title)}</h1>${html}</main></html>`);
 manifest.push({part:n,id:`china-ethics-2026-part-${n}`,title,voice:n===1?'A':'B',date:dates[n-1],wordCount,images,paragraphCount:paragraphs.length,file:`part-${n}.md`});
}
await writeFile(path.join(root,'manifest.json'),JSON.stringify({series:'History of Ethics in China',classId:'e24ec8d9-21d7-4c32-a30e-08655c2f4e65',timezone:'Asia/Shanghai',readingEstimate:'About 20 minutes at 80–95 words per minute, allowing time for illustrations and unfamiliar concepts.',parts:manifest},null,2)+'\n');
await writeFile(path.join(root,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>History of Ethics in China</title><style>${style}</style><main><p class="meta">Ethics and Leadership · November 2–12, 2026</p><h1>History of Ethics in China</h1><p>Four illustrated readings about character, compassion, freedom, and power. Each takes about twenty minutes at a thoughtful classroom reading pace.</p>${manifest.map(p=>`<article><h2><a href="part-${p.part}.html">${escape(p.title)}</a></h2><p class="meta">${p.date} · Voice ${p.voice} · ${p.wordCount.toLocaleString()} words · Four illustrations</p><a href="part-${p.part}.html"><img src="${p.images[0]}" alt="Illustration for part ${p.part}"></a></article>`).join('')}</main></html>`);
console.log(JSON.stringify(manifest.map(({part,wordCount,paragraphCount,date})=>({part,wordCount,paragraphCount,date})),null,2));
