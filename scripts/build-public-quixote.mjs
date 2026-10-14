import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createCharacter} from '../functions/learning-content/src/character-builder.js';
import {validatePackage} from '../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../functions/learning-content/src/animated-episodes.js';
const root=new URL('../',import.meta.url),check=process.argv.includes('--check');
const read=p=>readFile(new URL(p,root));
const catalog=JSON.parse(await read('stories/public-quixote/catalog.json'));
const teacher=createCharacter({id:'Teacher',name:'My English teacher',version:1,finish:'polished',palette:{skin:'#a57558',hair:'#39322c',shirt:'#587583',trim:'#c1b99f'},appearance:{age:'adult',hair:'swept',face:'round',eyes:'gentle',glasses:'round',outfit:'cardigan'},provenance:'An anonymous fictional English teacher, built from generic vector components. Not a depiction of a particular person or institution.'});
for(const [i,entry] of catalog.entries()){
 if(!entry.available)continue;
 const pack=JSON.parse(await read(`public/stories/animated/${entry.id}/episode.json`));
 pack.title=entry.title;pack.description=entry.summary+' '+entry.chapters+'. Public edition.';
 pack.script=await readFile(new URL(`stories/public-quixote/${entry.id}.story`,root),'utf8');
 delete pack.assets.characters.Hepting;
 if(/\bTeacher\b/.test(pack.script))pack.assets.characters.Teacher=teacher;
 delete pack.assets.backgrounds.classroom;
 if(/scene reflection/.test(pack.script))pack.assets.backgrounds.reflection=pack.assets.backgrounds.journal;
 const detail=pack.sources.filter(s=>/^(Original adaptation:|Source event sequence:|Fixed events:|Fixed sequence:|The chapter-6 catalogue|All dialogue|Only “|Non-graphic treatment:|Visual staging:|Visuals are theatrical:)/.test(s));
 pack.sources=[
 `Miguel de Cervantes, Don Quixote, ${entry.chapters.replace(' · ', ', ')}. John Ormsby translation (1885), public domain. https://www.gutenberg.org/files/996/996-h/996-h.htm#ch${[1,2,4,6][i]}`,
 ...detail.map(s=>s.replace(/classroom/gi,'public framing').replace(/Student/g,'Player').replace(/student/g,'player')),
 'The airport gift shop, magical book, visiting helper and anonymous English teacher are invented framing. You remain yourself, not Sancho Panza. Local choices change your responses and observations; the main events from the novel retain their source outcomes.',
 'Illustrations and costumes are theatrical interpretations, not documentary reconstructions. The English teacher uses an anonymous fictional design. No real-person likeness is intended.',
 'Four knowledge questions, with review and retry. Three correct completes the knowledge check. Story choices receive no moral score. Progress is not submitted as class grades.'
 ];
 const text=JSON.stringify(pack,null,2)+'\n';
 if(/hepting|\bdavid\b|\bcdis\b|lifeplus|instructure|CORE_VOCAB|\/Users\//i.test(text))throw Error('Identifying reference: '+entry.id);
 const result=validatePackage(pack);if(result.errors.length)throw Error(JSON.stringify(result.errors));
 if(packageBytes(pack)>5000000)throw Error('Package too large');
 const out=new URL(`public/stories/public-quixote/${entry.id}/`,root);await mkdir(out,{recursive:true});
 if(check){if(await readFile(new URL('episode.json',out),'utf8')!==text)throw Error('Stale public episode: '+entry.id);}else await writeFile(new URL('episode.json',out),text);
 console.log(entry.id,packageBytes(pack),'bytes; validated');
}
const art={
 'courtyard.webp':'a-knight-needs-a-witness/assets/courtyard.webp',
 'inn.webp':'the-castle-that-served-supper/assets/inn-moonlight-v1.webp',
 'road.webp':'the-promise-left-behind/assets/la-mancha-road-v1.webp',
 'library.webp':'the-door-that-disappeared/assets/library-v1.webp',
 'journal.webp':'a-knight-needs-a-witness/assets/journal.webp',
 'passage.webp':'a-knight-needs-a-witness/assets/page-passage-v1.webp'
};
await mkdir(new URL('public/stories/public-quixote/art/',root),{recursive:true});
for(const [name,path]of Object.entries(art)){
 const source=new URL('public/stories/animated/'+path,root),target=new URL('public/stories/public-quixote/art/'+name,root);
 if(check){if(!(await readFile(source)).equals(await readFile(target)))throw Error('Stale art: '+name);}else await copyFile(source,target);
}
