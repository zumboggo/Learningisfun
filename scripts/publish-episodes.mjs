import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {deployEpisodeBackend} from './deploy-episode-backend.mjs';
const run=(command,args)=>execFileSync(command,args,{stdio:'inherit'}),git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const check=process.argv.includes('--check'),skipChecks=process.argv.includes('--verified');
if(skipChecks&&!check)throw new Error('--verified is for read-only planning; publication always runs checks');
if(!check){if(git('status','--porcelain'))throw new Error('Commit the task changes first; this command never stages unrelated work');run('git',['fetch','origin','master']);run('git',['merge','--no-edit','origin/master']);}
if(!skipChecks){run('npm',['test']);run('npm',['run','build']);}
const walk=dir=>readdirSync(dir,{withFileTypes:true}).filter(e=>!['node_modules','.git'].includes(e.name)&&!e.name.startsWith('.env')).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
const fingerprint=createHash('sha256');for(const path of walk('functions/learning-content').sort())fingerprint.update(path).update(readFileSync(path));const backendSha=fingerprint.digest('hex'),stateFile='.episode-publish-state.json',state=existsSync(stateFile)?JSON.parse(readFileSync(stateFile)):{};
const changed=!!git('diff','--name-only','origin/master','--','functions/learning-content'),needsBackend=changed&&state.backendSha!==backendSha;
if(check){console.log('Read-only publication plan: backend '+(needsBackend?'deployment required':'unchanged or already verified')+'; push committed HEAD to master; verify deployed episode files.');process.exit(0);}
if(needsBackend){const deploymentId=await deployEpisodeBackend();writeFileSync(stateFile,JSON.stringify({backendSha,deploymentId},null,2)+'\n');}
run('git',['push','origin','HEAD:master']);const head=git('rev-parse','HEAD');console.log('Published',head,'· waiting for Pages');
const deadline=Date.now()+600000;let ready=false;while(Date.now()<deadline){const data=JSON.parse(execFileSync('curl',['-fsSL','--max-time','30','https://api.github.com/repos/zumboggo/Learningisfun/actions/runs?branch=master&per_page=10'],{encoding:'utf8'}));const workflow=data.workflow_runs.find(r=>r.head_sha===head&&r.name==='Deploy to GitHub Pages');if(workflow?.status==='completed'){if(workflow.conclusion!=='success')throw new Error('Pages failed: '+workflow.html_url);console.log('Pages succeeded:',workflow.html_url);ready=true;break;}await new Promise(r=>setTimeout(r,10000));}if(!ready)throw new Error('Pages not confirmed in ten minutes. Inspect the existing run; do not create duplicate releases.');run('npm',['run','episode:verify']);
