import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {assignedEpisodes,WORLD_LIT_CLASSES} from '../functions/learning-content/src/episode-catalog.js';
import {contentForEpisode} from '../functions/learning-content/src/episode-content.js';
const base=process.env.EPISODE_SITE_URL||'https://zumboggo.github.io/Learningisfun/';
const get=p=>execFileSync('curl',['-fsSL','--max-time','30','--retry','1',new URL(p,base).href],{maxBuffer:20*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex'),files=new Set(),episodes=new Map();
for(const cls of WORLD_LIT_CLASSES)for(const e of assignedEpisodes(cls.id,true))episodes.set(e.id+':'+e.version,e);
for(const e of episodes.values()){files.add(e.entry);const p=contentForEpisode(e.id,e.version).presentation;if(p)for(const f of [p.background,...Object.keys(p.portraits).map(n=>n+'.webp'),...(p.audio?[p.audio]:[])])files.add(p.assetBase+f);}
for(const path of files){if(sha(get(path))!==sha(readFileSync('public/'+path)))throw new Error('Live file does not match: '+path);console.log('Verified live:',path);}
const html=get('').toString(),src=html.match(/<script[^>]*src="([^"]+\.js)"/)?.[1];if(!src)throw new Error('Production app bundle missing');const bundle=get(src).toString();
for(const e of episodes.values())for(const marker of [e.id,e.classId,e.entry,e.releaseAt].filter(Boolean))if(!bundle.includes(marker))throw new Error('Production catalog is stale: '+marker);
console.log('Live episode files and production catalog match. This static check does not claim authenticated student saves; use backend access tests/live authorized verification separately.');
