/** Shared finite performances. Timings are milliseconds; no character-specific timers. */
export const ACTING_PROFILES:Record<string,{prepare:number;rise:number;hold:number;recover:number;anticipation:number;weight:number;headLead:number}>={
 explain:{prepare:160,rise:420,hold:360,recover:650,anticipation:.06,weight:1.8,headLead:60},
 reassure:{prepare:220,rise:520,hold:420,recover:760,anticipation:.03,weight:1.2,headLead:90},
 question:{prepare:150,rise:360,hold:480,recover:620,anticipation:.08,weight:-1,headLead:110},
 insist:{prepare:210,rise:220,hold:250,recover:550,anticipation:.12,weight:2.8,headLead:30},
 hesitant:{prepare:360,rise:580,hold:230,recover:800,anticipation:.1,weight:-1.7,headLead:160},
 nod:{prepare:100,rise:240,hold:80,recover:400,anticipation:.08,weight:.3,headLead:0},
 'shake-head':{prepare:120,rise:250,hold:350,recover:420,anticipation:.03,weight:-.5,headLead:0},
 shrug:{prepare:200,rise:340,hold:320,recover:660,anticipation:.09,weight:-1,headLead:100},
 laugh:{prepare:180,rise:360,hold:620,recover:720,anticipation:.04,weight:-2,headLead:70},
 sigh:{prepare:380,rise:560,hold:160,recover:850,anticipation:.04,weight:1,headLead:140},
 disappointed:{prepare:300,rise:650,hold:500,recover:950,anticipation:.02,weight:-1.2,headLead:180},
 'cross-arms':{prepare:180,rise:620,hold:350,recover:650,anticipation:.06,weight:-1.5,headLead:100},
};
const standard={prepare:180,rise:470,hold:500,recover:750,anticipation:.08,weight:0,headLead:0};
const smooth=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
export function performanceDuration(cue:string){const p=ACTING_PROFILES[cue]||standard;return p.prepare+p.rise+p.hold+p.recover+Math.max(180,p.headLead+130);}
export function performanceEnvelope(cue:string,ms:number){const p=ACTING_PROFILES[cue]||standard;
 if(ms<=0)return 0;
 if(ms<p.prepare)return -p.anticipation*smooth(ms/p.prepare);
 ms-=p.prepare;if(ms<p.rise)return -p.anticipation+(1+p.anticipation)*smooth(ms/p.rise);
 ms-=p.rise;if(ms<p.hold)return 1;
 return 1-smooth((ms-p.hold)/p.recover);
}
export function performancePose(cue:string,elapsed:number,from:Record<string,number>,rest:Record<string,number>,target:Record<string,number>,seed:number,classic=false){
 const p=classic?standard:ACTING_PROFILES[cue]||standard;
 const tempo=classic?1:.96+(seed%9)*.01,t=elapsed/tempo,entry=smooth(t/420),envelope=(ms:number)=>performanceEnvelope(classic?'':cue,Math.max(0,ms));
 const keys=new Set([...Object.keys(from),...Object.keys(rest),...Object.keys(target),'torso','head']);
 const pose:Record<string,number>={};
 for(const k of keys){const delay=classic?(k==='head'?95:k==='torso'?55:k.endsWith('Hand')?90:0):k==='head'?0:k==='torso'?p.headLead:k.endsWith('Hand')?p.headLead+80:p.headLead+35;
 const base=rest[k]||0;pose[k]=(from[k]||0)*(1-entry)+base*entry+((target[k]||0)-base)*envelope(t-delay);}
 const strength=envelope(t);pose.torso+=p.weight*strength;
 if(cue==='shake-head')pose.head=(from.head||0)*(1-entry)+(rest.head||0)*entry+Math.sin(t/180)*6*strength;
 if(cue==='laugh'){pose.torso-=Math.abs(Math.sin(t/145))*2.4*strength;pose.head-=Math.abs(Math.sin(t/145))*2*strength;}
 return pose;
}
