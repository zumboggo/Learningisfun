import {lookup} from 'node:dns/promises';
import {request} from 'node:https';
import {isPublicIPv4} from './reading-images.js';
// Pin the validated IP; never pass credentials or fetch private network addresses.
export async function sourcePassage(source,redirects=0){
 const u=new URL(source);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||redirects>3)throw Error('Use a public HTTPS source.');
 const addresses=await lookup(u.hostname,{all:true,family:4});if(!addresses.length||addresses.some(a=>!isPublicIPv4(a.address)))throw Error('Source address is not public.');
 return new Promise((resolve,reject)=>{const req=request(u,{lookup:(_host,options,cb)=>options.all?cb(null,[addresses[0]]):cb(null,addresses[0].address,4),headers:{'User-Agent':'LearningIsFun-Research/1.0',Accept:'text/html,text/plain'}},res=>{
  if([301,302,303,307,308].includes(res.statusCode)){res.resume();if(!res.headers.location)return reject(Error('Missing redirect'));sourcePassage(new URL(res.headers.location,u).href,redirects+1).then(resolve,reject);return;}
  if(res.statusCode!==200||!/^text\/(html|plain)/i.test(res.headers['content-type']||'')){res.resume();return reject(Error('Source is unavailable as text.'));}
  let size=0;const chunks=[];res.on('data',c=>{size+=c.length;if(size>1500000)res.destroy(Error('Source is too large.'));else chunks.push(c)});res.on('error',reject);res.on('end',()=>{const content=Buffer.concat(chunks).toString('utf8').replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;|&#34;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();resolve(content.slice(0,8000));});
 });const deadline=setTimeout(()=>req.destroy(Error('Source retrieval timed out.')),12000);req.on('close',()=>clearTimeout(deadline));req.on('error',reject);req.end();});
}
