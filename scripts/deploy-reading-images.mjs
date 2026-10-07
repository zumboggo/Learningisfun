// Deploy existing reading functions without changing their environment or permissions.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
const functions=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
const record=join(tmpdir(),'learningisfun-reading-images-deployments.json');
if(process.argv.includes('--status')){
 for(const item of JSON.parse(readFileSync(record,'utf8'))){const deployed=await functions.getDeployment(item);console.log(item.functionId,deployed.status);if(deployed.status==='failed')process.exitCode=1;}
}else{
 const temp=mkdtempSync(join(tmpdir(),'reading-images-deploy-')),archive=join(temp,'code.tar.gz'),deployments=[];
 try{
  execFileSync('tar',['-czf',archive,'-C',resolve('functions/learning-content'),'.']);
  for(const functionId of ['learning-content','public-reading']){
   const current=await functions.get({functionId});
   const result=await functions.createDeployment({functionId,code:InputFile.fromPath(archive),activate:true,entrypoint:current.entrypoint,commands:current.commands});
   deployments.push({functionId,deploymentId:result.$id});writeFileSync(record,JSON.stringify(deployments));
   console.log(functionId,result.$id,result.status);
  }
 }finally{rmSync(temp,{recursive:true,force:true});}
}
