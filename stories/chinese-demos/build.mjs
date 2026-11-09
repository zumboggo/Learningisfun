import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createCharacter} from '../../functions/learning-content/src/character-builder.js';
import {validatePackage} from '../../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../../functions/learning-content/src/animated-episodes.js';
const root=new URL('../../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const image=async p=>({src:'data:image/webp;base64,'+(await readFile(new URL(p,root))).toString('base64')});
const character=(id,name,age,hair,outfit,shirt,hairColor,face='oval')=>createCharacter({id,name,finish:'polished',palette:{skin:'#e6b68f',hair:hairColor,shirt,trim:shirt},appearance:{age,hair,outfit,face,glasses:'none',facialHair:'none'},provenance:'Original workshop story character, reusable polished vector design; opening artwork by ImageGen, 2026-11-09.'});
const recipes={Alex:character('Alex','Alex · 艾力','adult','side-part','workshirt','#257572','#69452f'),Ning:character('Ning','Ning · 小宁','adult','bob','cardigan','#d6a139','#242329'),Chen:character('Chen','Mr Chen · 陈先生','elder','cropped','cardigan','#66796b','#8c8e8b')};
for(const [slug,title,description] of [
 ['today-youre-the-teacher',"Today, You’re the Teacher · 今天你是老师",'Ten minutes before a school welcome, a teacher needs a quiet student’s help. Discover what it means to wait for someone.'],
 ['a-message-from-tomorrow','A Message from Tomorrow · 来自明天的消息','A voice message sounds exactly like you. A borrowed bowl leads to a neighbor’s door. Who is trying to change tomorrow?']]){
 const teacher=slug.startsWith('today'),dir=new URL('public/stories/shared/chinese-demos/'+slug+'/',root);await mkdir(dir,{recursive:true});
 const audio=await read('stories/chinese-demos/'+slug+'.audio.json');
 const pack={format:2,title,description,profile:'chinese',assessmentMode:'none',taxiClips:false,notice:'An original invented story for learning Mandarin. Choose your responses and explore at your own pace. Pinyin, English phrase meanings, and Mandarin audio are optional. No quiz or grades.',script:await readFile(new URL('stories/chinese-demos/'+slug+'.story',root),'utf8'),assets:{backgrounds:teacher?{classroom:await image('public/stories/animated/backgrounds/manga-v1/classroom.webp')}:{corridor:await image('stories/chinese-demos/apartment.webp'),kitchen:await image('stories/chinese-demos/apartment.webp')},characters:teacher?{Alex:recipes.Alex,Kevin:await read('public/stories/animated/rigs/kevin-cartoon.json')}:{Ning:recipes.Ning,Chen:recipes.Chen}},quiz:[],chinese:{recordedLines:teacher?[]:['明天，别走那条路。','走左边。带上那个碗。','明天，别让她一个人等。'],lines:await read('stories/chinese-demos/'+slug+'.language.json'),audio,intro:{poster:'stories/shared/chinese-demos/'+slug+'.poster.jpg',video:'stories/shared/chinese-demos/'+slug+'.mp4',line:teacher?'我也有点怕。':'明天，别走那条路。',actor:teacher?'Alex':'Ning'}},sources:['Original story and dialogue authored for the November 2026 teacher workshop. Five unscored decisions, each with a distinct immediate response; branches rejoin.','Mandarin audio: Edge TTS, Yunxi for male characters and male narration; Xiaoxiao for Ning and her narration; rate -10%, default pitch and volume. No English audio.','Small objects, food, drawing and phone actions are narrated; the reusable stage shows faces, gaze and gestures. Opening art uses colored pencil (teacher) and cut-paper collage (mystery).']};
 const errors=validatePackage(pack).errors;if(errors.length)throw Error(slug+JSON.stringify(errors));
 const audioBytes=(await Promise.all([...new Set(Object.values(audio))].map(async p=>(await stat(new URL('public/'+p,root))).size))).reduce((a,b)=>a+b,0);
 if(packageBytes(pack)+audioBytes>5000000)throw Error('Package and audio exceed 5 MB');
 const text=JSON.stringify(pack,null,2)+'\n';const path=new URL('episode.json',dir);
 if(process.argv.includes('--check')){if(await readFile(path,'utf8')!==text)throw Error('Stale '+slug);}else await writeFile(path,text);
 console.log(slug,packageBytes(pack)+audioBytes,'bytes including cached speech');
}
