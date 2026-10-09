import {test} from 'node:test';import assert from 'node:assert/strict';
import {assessYoung,assessDriver,scenes,ending,publicationEvent} from './young-content.js';
import {assignedEpisodes,requireEpisode,AP_CLASS_ID} from './episode-catalog.js';
import {episodeAction} from './episodes.js';
const strong=['voice','clarify','test','mix','power','assess','bridge','check','preserve','revisit'];
test('all 59049 paths legal, bounded, complete; every choice has two reactions',()=>{let count=0;const walk=choices=>{const result=assessYoung(choices);assert(result.total>=0&&result.total<=100);assert(result.scores.every(n=>n>=0&&n<=25));if(choices.length===10){assert(result.complete);assert(result.ending.paragraphs.length);count++;return;}for(const choice of scenes[choices.length].choices){assert.equal(choice.reactions.length,2);walk([...choices,choice.id]);}};walk([]);assert.equal(count,59049);assert.throws(()=>assessYoung(['invented']));assert.throws(()=>assessYoung([...strong,'extra']));});
test('contrasting publication strategies earn full points; weak reasoning does not',()=>{for(const publication of ['preserve','adapt','negotiate']){const choices=strong.slice();choices[8]=publication;assert.equal(assessYoung(choices).total,100);}assert(assessYoung(scenes.map(s=>s.choices[2].id)).total<50);assert.notEqual(ending(strong).title,ending(strong.map((id,i)=>i===8?'adapt':id)).title);});
test('release uses Friday 08 Shanghai, class isolation and teacher preview',()=>{assert.equal(assignedEpisodes(AP_CLASS_ID,false,Date.parse('2026-10-08T23:59:59Z')).length,0);assert.equal(assignedEpisodes(AP_CLASS_ID,false,Date.parse('2026-10-09T00:00:00Z')).length,1);assert.equal(assignedEpisodes(AP_CLASS_ID,true,0).length,1);assert.equal(assignedEpisodes('foreign',true).length,0);assert.throws(()=>requireEpisode(AP_CLASS_ID,'own-english',99,true));});
function fixture(){const rows=new Map();let aiCreates=0;const db={getDocument:async(_d,c,id)=>{if(c==='classes')return {teacherId:'teacher'};if(rows.has(id))return rows.get(id);throw Object.assign(Error('missing'),{code:404});},createDocument:async(_d,_c,id,data)=>{if(rows.has(id))throw Object.assign(Error('exists'),{code:409});rows.set(id,{$id:id,...data});if(data.kind==='ai')aiCreates++;return rows.get(id);},updateDocument:async(_d,_c,id,data)=>{rows.set(id,{...rows.get(id),...data});return rows.get(id);},listDocuments:async()=>({documents:[],total:0})};const context={db,databaseId:'test',userId:'student',profile:{role:'student'},memberClassIds:new Set([AP_CLASS_ID])};const body={classId:AP_CLASS_ID,episode:'own-english',version:1,attempt:{attemptId:'00000000-1111-2222-3333-444444444444',choices:strong,driverAttempts:[[1,0,1,2]]}};return {rows,db,context,body,aiCreates:()=>aiCreates};}
test('server rejects foreign membership, malformed IDs, versions and choice sequences',async()=>{const f=fixture();for(const body of [{...f.body,version:99},{...f.body,classId:'other'},{...f.body,attempt:{...f.body.attempt,choices:['bad']}}])await assert.rejects(episodeAction({...f.context,body:{...body,action:'saveEpisode'}}));});
test('duplicate and shorter retries preserve immutable completion; divergent device is rejected',async()=>{const f=fixture();const body={...f.body,action:'saveEpisode'};await episodeAction({...f.context,body});const size=f.rows.size;await episodeAction({...f.context,body});assert.equal(f.rows.size,size);await episodeAction({...f.context,body:{...body,attempt:{...body.attempt,choices:strong.slice(0,2),driverAttempts:[]}}});assert([...f.rows.values()].some(r=>r.kind==='result'&&JSON.parse(r.dataJson).choices.length===10));await assert.rejects(episodeAction({...f.context,body:{...body,attempt:{...body.attempt,choices:['reach'],driverAttempts:[]}}}),/another device/);});
test('AI duplicate cache isolates revisions, returns original question, and preserves failure',async()=>{const f=fixture(),oldFetch=global.fetch,oldKey=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='test-only';let calls=0;global.fetch=async()=>{calls++;return {ok:true,json:async()=>({choices:[{message:{content:'Card A supports this interpretation.'}}]})};};try{const body={...f.body,action:'episodeAI',mode:'question',text:'What does the card mean?'};await episodeAction({...f.context,body});const cached=await episodeAction({...f.context,body:{...body,text:'A different question'}});assert.equal(calls,1);assert.equal(cached.text,body.text);for(const text of ['Draft one','Draft two','Draft two'])await episodeAction({...f.context,body:{...body,mode:'feedback',text}});assert.equal(calls,3);assert.equal(f.aiCreates(),3);}finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;}});

test('driver threshold, retries and server completion cannot be bypassed',async()=>{
 assert.equal(assessDriver([[0,0,0,2]]).passed,false);
 assert.equal(assessDriver([[1,0,0,2]]).passed,true);
 assert.equal(assessDriver([[1,0,1,2]]).score,4);
 assert.equal(assessDriver([[0,0,0,2],[1,0,1,2]]).passed,true);
 assert.throws(()=>assessDriver([[1,0,1,2],[0,0,0,0]]));
 const f=fixture(),body={...f.body,action:'saveEpisode',attempt:{...f.body.attempt,driverAttempts:[]}};
 await episodeAction({...f.context,body});assert(![...f.rows.values()].some(r=>r.kind==='result'));
 await assert.rejects(episodeAction({...f.context,body:{...body,action:'episodeAI',mode:'feedback',text:'Test paragraph'}}),/Finish the story/);
 await episodeAction({...f.context,body:{...body,attempt:{...body.attempt,driverAttempts:[[0,0,0,2]]}}});assert(![...f.rows.values()].some(r=>r.kind==='result'));
 await episodeAction({...f.context,body:{...body,attempt:{...body.attempt,driverAttempts:[[0,0,0,2],[1,0,0,2]]}}});assert([...f.rows.values()].some(r=>r.kind==='result'));
 await assert.rejects(episodeAction({...f.context,body:{...body,attempt:{...body.attempt,driverAttempts:[[1,0,1,2]]}}}),/another device/);
});
test('early iframe initialization waits for SugarCube startup and late initialization also resumes',async()=>{
 const {readFile}=await import('node:fs/promises'),{runInNewContext}=await import('node:vm');
 const script=await readFile(new URL('../../../stories/own-english/story.js',import.meta.url),'utf8');
 for(const early of [true,false]){const handlers={},events={},played=[],sent=[],parent={postMessage:m=>sent.push(m)},window={addEventListener:(n,fn)=>handlers[n]=fn};const setup={assess:assessYoung,assessDriver};const context={setup,Config:{navigation:{},history:{},saves:{},ui:{},passages:{}},window,parent,location:{origin:'https://class.test'},document:{},Macro:{add:()=>{}},Engine:{play:p=>played.push(p)},State:{passage:'Start'},$ :()=>({on:()=>{},one:(n,fn)=>events[n]=fn})};runInNewContext(script,context);
 const initialize=()=>handlers.message({origin:'https://class.test',source:parent,data:{protocol:'episode-v1',episode:'own-english',version:3,type:'init',channel:'test',choices:[],driverAttempts:[]}});
 if(early){initialize();assert.equal(played.length,0);events[':storyready']();}else{events[':storyready']();initialize();}
 assert.deepEqual(played,['Decision1']);assert(sent.some(m=>m.type==='started'));
 }
});
test('v2 writing scores are trusted, cached, privately restored and used for rankings',async()=>{
 const f=fixture(),oldFetch=global.fetch,oldKey=process.env.OPENROUTER_API_KEY;
 process.env.OPENROUTER_API_KEY='test-only';let calls=0;
 const get=f.db.getDocument;f.db.getDocument=async(d,c,id)=>c==='users'?{role:'student',name:'Approved nickname',nicknameModerationStatus:'visible'}:get(d,c,id);
 f.db.listDocuments=async(_d,c,queries)=>{if(c==='class_members')return {documents:[{role:'student'}]};const equal=queries.map(q=>JSON.parse(q)).filter(q=>q.method==='equal');return {documents:[...f.rows.values()].filter(row=>equal.every(q=>q.values.includes(row[q.attribute])))};};
 global.fetch=async(_url,options)=>{calls++;const sent=JSON.parse(options.body);assert.match(sent.messages[0].content,/each 0–20/);assert.match(sent.messages[0].content,/Fictional episode evidence/);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({criteria:['understanding','task','reasoning'].map(key=>({key,points:15,reason:'Specific relevant support.'})),strength:'Fair representation.',nextSteps:['Explain the qualification.'],revisionQuestion:'What would change your claim?',total:999})}}]})};};
 try{const body={...f.body,version:2,action:'episodeAI',mode:'feedback',text:'A supported response',attempt:{...f.body.attempt,assessment:{total:100}}};
 const result=await episodeAction({...f.context,body});assert.equal(result.assessment.total,85);assert.equal(result.assessment.writingPoints,45);
 await episodeAction({...f.context,body});assert.equal(calls,1);
 const restored=await episodeAction({...f.context,body:{classId:AP_CLASS_ID,action:'readEpisodes'}});assert.equal(restored.writing[0].assessment.total,85);assert(restored.episodes.some(e=>e.version===1));assert(restored.episodes.some(e=>e.version===2));
 const board=await episodeAction({...f.context,body:{...body,action:'episodeBoard'}});assert.equal(board.leaderboard[0].score,85);
 const teacher={...f.context,userId:'teacher',profile:{role:'teacher'}};await episodeAction({...teacher,body:{...body,text:'Preview only'}});const boardAgain=await episodeAction({...f.context,body:{...body,action:'episodeBoard'}});assert.equal(boardAgain.leaderboard.length,1);
 global.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:'{"total":100}'}}]})});await assert.rejects(episodeAction({...f.context,body:{...body,text:'Invalid model response'}}),/Feedback unavailable/);const failed=[...f.rows.values()].filter(r=>r.kind==='ai').map(r=>JSON.parse(r.dataJson)).find(r=>r.text==='Invalid model response');assert.equal(failed.state,'failed');assert.equal(failed.assessment,undefined);
 }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;}
});

test('v3 chance stays pinned across resume and scores judge reasoning rather than fortune',async()=>{
 const ids=new Map();for(let i=0;i<30;i++){const id='00000000-1111-2222-3333-'+String(i).padStart(12,'0');ids.set(publicationEvent(id),id);}assert.equal(ids.size,3);
 for(const [event,id] of ids){const a=assessYoung(strong,id);assert.equal(a.total,100);assert.deepEqual(a.ending,assessYoung(strong.slice(),id).ending);const negotiated=strong.map((v,i)=>i===8?'negotiate':v);assert.equal(assessYoung(negotiated,id).total,100);if(event===0)assert.match(ending(negotiated,id).paragraphs[0],/printer/);if(event===1)assert.match(ending(negotiated,id).paragraphs[0],/refuses/);if(event===2)assert.match(ending(negotiated,id).title,/negotiated/);}
 const f=fixture(),id=ids.get(0),body={...f.body,version:3,action:'saveEpisode',attempt:{...f.body.attempt,attemptId:id,ending:{title:'Forged success'}}};const result=await episodeAction({...f.context,body});assert.deepEqual(result.assessment.ending,ending(strong,id));assert.equal(result.assessment.total,100);assert.equal(requireEpisode(AP_CLASS_ID,'own-english',3,true).version,3);
});
