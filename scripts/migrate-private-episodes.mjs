import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {homedir} from 'node:os';
import {loadEnvFile} from 'node:process';
import {createHash} from 'node:crypto';
import {rolldown} from 'rolldown';
import {Client,Databases,Storage} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
import {episodes,archivedEpisodes} from '../functions/learning-content/src/episode-catalog.js';
import {journalStories} from '../functions/learning-content/src/journal-stories.js';
import {readRecord,writeRecord} from '../functions/learning-content/src/teacher-workspace.js';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(client),storage=new Storage(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const directory=join(homedir(),'.config/learningisfun/backups/private-episodes');await mkdir(directory,{recursive:true,mode:0o700});
const list=[...new Map([...episodes,...archivedEpisodes,{id:'teaching-stone',version:1,entry:'stories/teaching-stone/v1/index.html'}].map(e=>[e.id+':'+e.version,e])).values()];
for(const episode of list){
 const original=await readFile('public/'+episode.entry,'utf8');let html=original,logic='export const content = null;';
 if(episode.id!=='teaching-stone'){
  const source=episode.id==='own-english'?`import * as content from ${JSON.stringify(resolve('functions/learning-content/src/'+(episode.version>=4?'young-content.js':episode.version===3?'young-content-v3.js':'young-content-v2.js')))};export {content};`:`import {journalContent} from ${JSON.stringify(resolve('functions/learning-content/src/journal-engine.js'))};export const content=journalContent(${JSON.stringify(journalStories.find(s=>s.id===episode.id&&s.version===episode.version))});`;
  const bundle=await rolldown({input:'private:entry',plugins:[{name:'private-entry',resolveId(id){if(id==='private:entry')return id},load(id){if(id==='private:entry')return source}}]});const result=await bundle.generate({format:'es'});logic=result.output[0].code;await bundle.close();
 }
 // Preserve original bytes in the backup; replace image references only in the private playback envelope.
 const assets={};for(const file of await readdir(dirname('public/'+episode.entry))){if(!/\.(webp|png|jpg|mp3)$/.test(file))continue;const bytes=await readFile(join(dirname('public/'+episode.entry),file));assets[file]=`data:${file.endsWith('.mp3')?'audio/mpeg':'image/'+(file.endsWith('.jpg')?'jpeg':file.split('.').at(-1))};base64,${bytes.toString('base64')}`;}
 html=html.replace('url("${id}-pixel.webp")','url("${window.PRIVATE_EPISODE_ASSETS[id+\'-pixel.webp\']}")');
 html=html.replaceAll("s.background+'.webp'","window.PRIVATE_EPISODE_ASSETS[s.background+'.webp']").replaceAll("'+id+'.webp", "'+window.PRIVATE_EPISODE_ASSETS[id+'.webp']+'");
 for(const [file,url]of Object.entries(assets))html=html.replaceAll(file,url);
 html=html.replace('<head>','<head><script>window.PRIVATE_EPISODE_ASSETS='+JSON.stringify(assets).replaceAll('<','\\u003c')+'</script>');
 html=html.replaceAll('One optional question, in your own words. An AI interpretation, not the author’s words. Requires a connection.','Write an optional question for your teacher. Requires a connection to submit.').replaceAll('Ask the reading companion','Send a question to my teacher').replaceAll('AI companion','teacher question form').replaceAll('live AI feedback','teacher review').replaceAll('The combined episode total remains pending until writing is assessed. Revision is welcome; your highest assessed revision counts. This is an AI-assisted episode score, not a posted course grade.','The story is complete. New writing is saved for teacher review without an automatic score. Previous assessments remain in your history.').replaceAll('Choices contribute 40 points. Your final writing contributes up to 60: attention to ideas (20), answering the prompt (20), and supported independent thinking (20).','The earlier assessment used choice and writing points.').replaceAll('The AI uses the essay cards and Young’s first-person faculty statement, not an invented corpus of other writings.','Use the essay cards and Young’s first-person faculty statement to check your interpretation.');
 const payload={html,logic,entry:episode.entry,audio:assets['egypt-loop-v1.mp3']||null};const raw=JSON.stringify(payload),fileId=createHash('sha256').update(raw).digest('hex').slice(0,36);
 await writeFile(join(directory,episode.id+'-'+episode.version+'.original.html'),original,{mode:0o600});await writeFile(join(directory,fileId+'.json'),raw,{mode:0o600});
 try{await storage.createFile({bucketId:'animated-episodes',fileId,file:InputFile.fromBuffer(Buffer.from(raw),'private-episode.json'),permissions:[]})}catch(e){if(e.code!==409)throw e;}
 const key='private-episode:'+episode.id+':'+episode.version,current=await readRecord(db,databaseId,'system',key);if(current.value?.fileId!==fileId)await writeRecord(db,databaseId,'system',key,{fileId,sha256:createHash('sha256').update(original).digest('hex')},current.revision);
 
 const verify=await storage.getFileDownload({bucketId:'animated-episodes',fileId});if((verify?.html?JSON.stringify(verify):Buffer.from(verify).toString('utf8'))!==raw)throw Error('Private copy verification failed');console.log('Private copy verified:',episode.id,episode.version);
}

// Preserve the existing owner-only preview links after removing their static packages.
const previews=JSON.parse(await readFile('public/stories/animated/previews.json','utf8'));
for(const preview of previews){
 const raw=await readFile('public/'+preview.package),fileId=createHash('sha256').update(raw).digest('hex').slice(0,36);
 await writeFile(join(directory,preview.id+'.episode.json'),raw,{mode:0o600});
 await writeFile(join(directory,preview.id+'.episode.zip'),await readFile('public/'+preview.zip),{mode:0o600});
 try{await storage.createFile({bucketId:'animated-episodes',fileId,file:InputFile.fromBuffer(raw,'episode.json'),permissions:[]})}catch(e){if(e.code!==409)throw e;}
 const key='private-preview:'+preview.id,current=await readRecord(db,databaseId,'system',key);
 if(current.value?.fileId!==fileId)await writeRecord(db,databaseId,'system',key,{fileId},current.revision);
 const copy=await storage.getFileDownload({bucketId:'animated-episodes',fileId});
 if(JSON.stringify(copy?.format?copy:JSON.parse(Buffer.from(copy).toString()))!==JSON.stringify(JSON.parse(raw)))throw Error('Preview verification failed');
 console.log('Private preview verified:',preview.id);
}
