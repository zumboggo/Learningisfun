import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createCharacter} from '../functions/learning-content/src/character-builder.js';
import {validatePackage} from '../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../functions/learning-content/src/animated-episodes.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const classroom=(await read('public/stories/animated/everything-i-owned/episode.json')).assets.backgrounds.classroom;
for(const id of ['the-welcome-nobody-wanted','the-sheep-behind-our-house']){
 const dir='stories/animated/'+id,plan=await read(dir+'/episode-plan.json');
 const background={src:'data:image/webp;base64,'+(await readFile(dir+'/background-v1.webp')).toString('base64')};
 const pack={format:2,title:plan.title,description:plan.description,profile:'ethics',notice:'This episode blends real historical facts with imagined conversations. Artistic liberty is taken to provide an immersive narrative. Research the events in primary sources for the truest understanding of what happened.',context:plan.context,script:await readFile(dir+'/episode.story','utf8'),assets:{backgrounds:{classroom,square:background,yard:background},characters:{Hepting:await read('public/stories/animated/rigs/hepting-cartoon.json'),Kevin:await read('public/stories/animated/rigs/kevin-cartoon.json'),...Object.fromEntries((await read(dir+'/characters.json')).map(r=>[r.id,createCharacter(r)]))}},keepsake:{title:'My choices and reasons',description:'Use a specific choice when you discuss the two fixed questions and your selected third question. These choices are unscored.',downloadLabel:'Save my choices',filename:id+'-choices.txt',revealAt:'home',choices:plan.choices.map(([id,label])=>({id,label}))},quiz:await read(dir+'/quiz.json'),sources:await read(dir+'/sources.json')};
 const {errors}=validatePackage(pack);if(errors.length)throw Error(id+': '+JSON.stringify(errors,null,2));const bytes=packageBytes(JSON.parse(JSON.stringify(pack)));if(bytes>5000000)throw Error('Package exceeds 5 MB');
 const output='public/stories/animated/'+id;await mkdir(output,{recursive:true});
 const serialized=JSON.stringify(pack,null,2)+'\n';if(process.argv.includes('--check')){if(await readFile(output+'/episode.json','utf8')!==serialized)throw Error(id+' package stale');}else await writeFile(output+'/episode.json',serialized);
 if(await readFile(dir+'/teaching-guide.html','utf8').catch(()=>null)){const guide=await readFile(dir+'/teaching-guide.html','utf8');if(process.argv.includes('--check')){if(await readFile(output+'/teaching-guide.html','utf8')!==guide)throw Error('Guide stale');}else await writeFile(output+'/teaching-guide.html',guide);}
 console.log(id,bytes,'bytes');
}
