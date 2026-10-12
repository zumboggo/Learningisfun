// Authoring checks shared by the builder and template tests. Published rules remain versioned.
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const slug=/^[a-z][a-z0-9-]*$/;
const text=(s,name)=>check(typeof s==='string'&&!!s.trim(), 'Missing '+name);
export function validateEpisode(s){
 check(s.draft!==true&&!JSON.stringify(s).includes('AUTHOR:'),'Finish the authoring scaffold before building');
 check(slug.test(s.id)&&Number.isInteger(s.version)&&s.version>0,'Invalid episode ID/version');
 for(const k of ['title','description','unitId','edition','sourceUrl','boundary','checked','writingPrompt'])text(s[k],k);
 check(/^https:\/\//.test(s.sourceUrl),'Use a source URL');check(/^\d{4}-\d{2}-\d{2}$/.test(s.checked),'Use a checked date');
 check(s.externalWriting===true,'New World Lit episodes keep writing outside the game');
 check(Array.isArray(s.sources)&&s.sources.length>0,'Include source cards');
 const sources=new Set();for(const c of s.sources){for(const k of ['id','title','quote','note','url'])text(c[k],'source '+k);check(!sources.has(c.id),'Duplicate source card');sources.add(c.id);}
 check(Array.isArray(s.scenes)&&s.scenes.length>=2,'Include an encounter and its ending');
 const domains=[0,0,0,0],keys=new Set();let commitments=0;
 for(const scene of s.scenes){text(scene.title,'scene title');check(['question','checkpoint','commitment'].includes(scene.kind),'Unknown scene kind');if(scene.kind==='commitment')commitments++;
  check(scene.speaker==='journal'||s.presentation?.portraits[scene.speaker],'Missing speaker portrait/name');check(Array.isArray(scene.text)&&scene.text.length>0,'Missing scene paragraphs');scene.text.forEach(t=>text(t,'paragraph'));
  check(!scene.source||sources.has(scene.source),'Unresolved source card');check(Array.isArray(scene.choices)&&scene.choices.length>=2,'Offer more than one choice');
  for(const c of scene.choices){text(c.id,'choice ID');check(!keys.has(c.id),'Duplicate choice ID');keys.add(c.id);text(c.label,'choice label');text(c.response,'choice response');check(Array.isArray(c.points)&&c.points.length===4&&c.points.every(n=>Number.isInteger(n)&&n>=0&&n<=25),'Invalid checkpoint points');if(scene.kind!=='checkpoint')check(c.points.every(n=>n===0),'Curiosity/commitments cannot earn correctness points');}
  if(scene.kind==='checkpoint'){const active=[0,1,2,3].filter(i=>scene.choices.some(c=>c.points[i]>0));check(active.length===1,'One domain per checkpoint');const d=active[0];domains[d]++;check(scene.choices.filter(c=>c.points[d]===25).length>=2,'Provide two defensible interpretations');check(scene.choices.some(c=>c.points[d]<25),'Include a plausible weak interpretation');}
 }
 check(commitments>=1&&commitments<=3,'Use one to three commitments');check(domains.every(n=>n===1),'Assess all four notebook domains once');
 check(Array.isArray(s.driverQuestions)&&s.driverQuestions.length===4,'Exactly four return questions');for(const q of s.driverQuestions){text(q.prompt,'return question');text(q.note,'review note');check(q.options?.length>=2&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,'Invalid return answer');}
 const p=s.presentation;check(p&&/^stories\/[a-z0-9-]+\/v\d+\/$/.test(p.assetBase),'Versioned shared asset directory');check(p.portraitFrames===undefined||Number.isInteger(p.portraitFrames)&&p.portraitFrames>=1&&p.portraitFrames<=3,'Use one to three portrait frames');text(p.background,'background');text(p.backgroundDescription,'background description');check(Object.keys(p.portraits).length>0,'Include named portraits');
 for(const filename of [p.background,...Object.keys(p.portraits).map(n=>n+'.webp'),...(p.audio?[p.audio]:[])])check(/^[a-z0-9-]+\.(webp|mp3)$/.test(filename),'Unsafe asset path');
 return s;
}
export function validateAssignments(assignments,stories,units){
 const seen=new Set(),current=new Set(),versions=new Set();for(const s of stories){const k=s.id+':'+s.version;check(!versions.has(k),'Duplicate content version');versions.add(k);}
 for(const a of assignments){const s=stories.find(s=>s.id===a.episodeId&&s.version===a.version);check(s,'Unknown assigned episode/version');check(units[a.unitId]?.sections.some(c=>c.id===a.classId),'Assignment class not in verified unit');check(/^\d{4}-\d{2}-\d{2}$/.test(a.assignedDate)&&Number.isFinite(Date.parse(a.assignedDate)),'Invalid teaching date');check(!a.releaseAt||/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(a.releaseAt)&&Number.isFinite(Date.parse(a.releaseAt)),'Release timestamp must be UTC');check(!seen.has(a.assignmentId),'Duplicate assignment ID');seen.add(a.assignmentId);if(!a.archived){const k=a.classId+':'+a.episodeId;check(!current.has(k),'Only one current assignment per story/section');current.add(k);}}
}
