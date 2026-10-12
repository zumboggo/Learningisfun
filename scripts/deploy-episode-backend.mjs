import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {Client,Functions} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
export async function deployEpisodeBackend(){
 for(const key of ['APPWRITE_ENDPOINT','APPWRITE_PROJECT_ID','APPWRITE_API_KEY'])if(!process.env[key])throw new Error('Missing '+key+'; load the existing authorized setup environment');
 const functions=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
 const old=await functions.get({functionId:'learning-content'});if(old.entrypoint!=='src/main.js')throw new Error('Unexpected learning-content entrypoint');
 const directory=mkdtempSync(join(tmpdir(),'episode-deploy-')),archive=join(directory,'backend.tar.gz');
 let deployment;try{execFileSync('tar',['--exclude=node_modules','--exclude=.env*','-czf',archive,'-C','functions/learning-content','.']);deployment=await functions.createDeployment({functionId:'learning-content',code:InputFile.fromPath(archive),activate:true,entrypoint:old.entrypoint,commands:old.commands||'npm install'});}finally{rmSync(directory,{recursive:true,force:true});}
 console.log('Backend deployment created:',deployment.$id);const deadline=Date.now()+300000;
 while(Date.now()<deadline){const status=await functions.getDeployment({functionId:'learning-content',deploymentId:deployment.$id});if(status.status==='failed')throw new Error('Backend build failed; frontend was not published');if(status.status==='ready'){const active=await functions.get({functionId:'learning-content'});if(active.deploymentId!==deployment.$id)throw new Error('Backend built but is not active; verify before publishing');console.log('Backend ready and active:',deployment.$id);return deployment.$id;}await new Promise(r=>setTimeout(r,5000));}
 throw new Error('Backend activation not confirmed in five minutes; inspect this deployment rather than creating a duplicate: '+deployment.$id);
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname)await deployEpisodeBackend();
