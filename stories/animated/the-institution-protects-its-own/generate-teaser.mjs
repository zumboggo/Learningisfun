import fs from 'node:fs/promises';import os from 'node:os';
const folder=new URL('./',import.meta.url),read=async n=>JSON.parse(await fs.readFile(new URL(n,folder),'utf8'));
const billing=await read('billing-2026-11-10.json');if(billing.maximumChargeUsd!==.06||billing.paidAttempts!==0)throw Error('Do not resubmit: reconcile the saved prediction first');
const model=await read('model-preflight.json');
const prompt='Animate the supplied layered cut-paper artwork, retaining its exact paper fibres, tactile edges, warm cream teal burgundy palette and single right hand with teal cardigan cuff. One continuous fixed shot. The hand gently lowers the burgundy folder cover over the assessment sheet until closed, rests on the closed cover for a brief hesitant moment, then withdraws to the right. The folder stays closed. No other people or hands appear. No camera movement. Do not add writing or numbers. Preserve the cut-paper medium throughout. Native audio: quiet paper rustling and a soft folder tap, faint room ambience. Absolutely no human speech, no words, no voices, no humming, no music. The mood is uncomfortable hesitation, not horror.';
const input={prompt,image:'data:image/png;base64,'+(await fs.readFile(new URL('teaser-reference.png',folder))).toString('base64'),duration:6,resolution:'480p',mode:'cost',prompt_upsampler:'off',aspect_ratio:'16:9',enable_safety_filter:true};
const token=(await fs.readFile(os.homedir()+'/.claude/replicate-token','utf8')).trim();
await fs.writeFile(new URL('billing-2026-11-10.json',folder),JSON.stringify({...billing,paidAttempts:1,submissionStarted:true},null,2)+'\n');
const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
const r=await fetch('https://api.replicate.com/v1/predictions',{method:'POST',headers,body:JSON.stringify({version:model.latest_version.id,input})});if(!r.ok)throw Error('Submission failed '+r.status+'; reconcile before retry');let result=await r.json();
const record={model:'prunaai/p-video-2-pro',version:model.latest_version.id,prompt,settings:{...input,image:undefined},maximumChargeUsd:.06,predictionId:result.id,status:result.status};
await fs.writeFile(new URL('media-provenance.json',folder),JSON.stringify(record,null,2)+'\n');console.log('Submitted single six-second clip; maximum $0.06.');
const deadline=Date.now()+600000;
while(!['succeeded','failed','canceled'].includes(result.status)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,5000));const poll=await fetch('https://api.replicate.com/v1/predictions/'+result.id,{headers});if(!poll.ok)throw Error('Poll failed; resume saved prediction');result=await poll.json();}
if(result.status!=='succeeded')throw Error('Prediction '+result.status+'; do not submit again');
const output=Array.isArray(result.output)?result.output[0]:result.output;const video=await fetch(output);if(!video.ok)throw Error('Download failed; resume saved output');const bytes=Buffer.from(await video.arrayBuffer());await fs.writeFile(new URL('teaser-native.mp4',folder),bytes);
await fs.writeFile(new URL('media-provenance.json',folder),JSON.stringify({...record,status:result.status,downloaded:true,bytes:bytes.length,metrics:result.metrics},null,2)+'\n');console.log('Native video saved:',bytes.length,'bytes');
