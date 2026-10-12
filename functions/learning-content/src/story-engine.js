/** Story 1: deliberately small, data-only language shared by browser and server. */
export const STORY_VERSION=1;
const id='[a-zA-Z][a-zA-Z0-9_-]*';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const value=s=>s==='true'?true:s==='false'?false:Number(s);
export function compileStory(source,assets={}) {
 const errors=[], nodes=[], variables={}, labels={}; let choice=null;
 const error=(line,message)=>errors.push({line,message});
 const add=(n,line)=>{nodes.push({...n,line});return nodes.at(-1);};
 if(typeof source!=='string'||source.length>150000)return {errors:[{line:1,message:'Script must be at most 150,000 characters.'}]};
 const lines=source.replace(/\r/g,'').split('\n');
 if(lines[0]?.trim()!=='story 1')error(1,'Begin with story 1');
 for(let index=1;index<lines.length;index++){
  const line=index+1,s=lines[index].trim(); if(!s||s.startsWith('#'))continue;let m;
  if(s.startsWith('option ')){
   m=s.match(new RegExp(`^option (${id}) "(.+)" -> (${id})(?: ; (.+))?$`));
   if(!m||!choice){error(line,'Use option id "Text" -> label ; variable += 1 after a choice');continue;}
   const changes=[];for(const raw of (m[4]||'').split(',').filter(Boolean)){const op=raw.trim().match(new RegExp(`^(${id}) (=|\\+=|-=) (true|false|-?\\d+)$`));if(!op)error(line,'Invalid variable update');else changes.push({variable:op[1],op:op[2],value:value(op[3])});}
   choice.options.push({id:m[1],text:m[2],target:m[3],changes,line});continue;
  }
  choice=null;
  if((m=s.match(new RegExp(`^variable (${id}) = (true|false|-?\\d+)(?: range (-?\\d+) (-?\\d+))? (visible|hidden)$`)))){
   if(own(variables,m[1]))error(line,'Duplicate variable');variables[m[1]]={initial:value(m[2]),min:m[3]===undefined?0:Number(m[3]),max:m[4]===undefined?100:Number(m[4]),visible:m[5]==='visible'};
   const v=variables[m[1]];if(typeof v.initial==='number'&&(!m[3]||v.min>v.max||v.initial<v.min||v.initial>v.max))error(line,'Numeric variables require a valid range containing the initial value');continue;
  }
  if((m=s.match(new RegExp(`^label (${id})$`)))){if(own(labels,m[1]))error(line,'Duplicate label');labels[m[1]]=nodes.length;add({type:'label',id:m[1]},line);continue;}
  if((m=s.match(new RegExp(`^scene (${id})$`)))){if(!assets.backgrounds?.[m[1]])error(line,'Unknown background '+m[1]);add({type:'scene',asset:m[1]},line);continue;}
  if((m=s.match(new RegExp(`^show (${id})(?: (${id}))?(?: (left|center|right))?$`)))){if(!assets.characters?.[m[1]])error(line,'Unknown character '+m[1]);else if(m[2]&&!assets.characters[m[1]].expressions?.[m[2]])error(line,'Unknown expression '+m[2]);add({type:'show',actor:m[1],expression:m[2]||'neutral',position:m[3]||'center'},line);continue;}
  if((m=s.match(new RegExp(`^move (${id}) (enter|exit|left|center|right|turn|nod|shake|bounce|recoil)$`)))){if(!assets.characters?.[m[1]])error(line,'Unknown character');add({type:'move',actor:m[1],action:m[2]},line);continue;}
  if((m=s.match(/^effect (fade|closeup|shake|magic)$/))){add({type:'effect',action:m[1]},line);continue;}
  if((m=s.match(new RegExp(`^choice (${id})$`)))){choice=add({type:'choice',id:m[1],options:[]},line);continue;}
  if((m=s.match(new RegExp(`^goto (${id})$`)))){add({type:'goto',target:m[1]},line);continue;}
  if((m=s.match(new RegExp(`^if (${id}) (==|!=|>=|<=|>|<) (true|false|-?\\d+) -> (${id}) else (${id})$`)))){add({type:'if',variable:m[1],op:m[2],value:value(m[3]),target:m[4],otherwise:m[5]},line);continue;}
  if((m=s.match(new RegExp(`^chance (${id}) (\\d+) -> (${id}) else (${id})$`)))){if(+m[2]>100)error(line,'Chance must be 0–100');add({type:'chance',id:m[1],percent:+m[2],target:m[3],otherwise:m[4]},line);continue;}
  if(s==='end'){add({type:'end'},line);continue;}
  if((m=s.match(new RegExp(`^(I|${id}): (.+)$`)))){if(m[1]!=='I'&&!assets.characters?.[m[1]])error(line,'Unknown speaker');add({type:'say',actor:m[1],text:m[2]},line);continue;}
  error(line,'Unknown command');
 }
 if(Object.keys(variables).length>4)error(1,'Use at most four variables');
 const ids=new Set();for(const n of nodes){if(n.id&&n.type!=='label'){if(ids.has(n.id))error(n.line,'Choice/chance IDs must be unique');ids.add(n.id);}
  if(n.type==='choice'&&(n.options.length<2||n.options.length>6))error(n.line,'A choice needs 2–6 options');
  const options=n.options||[];if(new Set(options.map(o=>o.id)).size!==options.length)error(n.line,'Duplicate option ID');
  for(const target of [n.target,n.otherwise,...options.map(o=>o.target)].filter(Boolean))if(!own(labels,target))error(n.line,'Missing label '+target);
  for(const change of [...options.flatMap(o=>o.changes),...(n.type==='if'?[n]:[])]){const v=variables[change.variable];if(!v)error(n.line,'Unknown variable '+change.variable);else if(typeof v.initial!==typeof change.value||typeof v.initial==='boolean'&&!['=','==','!='].includes(change.op))error(n.line,'Variable type does not match operation');}
 }
 const edges=i=>{const n=nodes[i];return n.type==='end'?[]:n.type==='choice'?n.options.map(o=>labels[o.target]):['if','chance'].includes(n.type)?[labels[n.target],labels[n.otherwise]]:n.type==='goto'?[labels[n.target]]:[i+1];};
 if(!errors.length){const reached=new Set(),active=new Set();const visit=i=>{if(i>=nodes.length){error(lines.length,'A path falls off the script without end');return;}if(active.has(i)){error(nodes[i].line,'Loops are not supported; reconnect branches farther ahead');return;}if(reached.has(i))return;reached.add(i);active.add(i);edges(i).forEach(visit);active.delete(i);};if(nodes.length)visit(0);else error(1,'Add a story');nodes.forEach((n,i)=>{if(!reached.has(i))error(n.line,'Unreachable content');});}
 return {errors,story:errors.length?undefined:{version:1,nodes,labels,variables}};
}
export function initialStoryState(story,seed=1){return {cursor:0,variables:Object.fromEntries(Object.entries(story.variables).map(([k,v])=>[k,v.initial])),stage:{background:null,actors:{}},history:[],events:[],seed:seed>>>0,ended:false};}
export function settleStory(story,state){const s=structuredClone(state);s.cues=[];let steps=0;while(!s.ended&&steps++<10000){const n=story.nodes[s.cursor];if(!n)throw Error('Invalid story position');if(['say','choice'].includes(n.type))return s;
 if(n.type==='end'){s.ended=true;return s;}
 if(['scene','show','move','effect'].includes(n.type))s.cues.push(n);
 if(n.type==='scene'){s.stage={background:n.asset,actors:{}};}
 if(n.type==='show'){for(const [id,a] of Object.entries(s.stage.actors))if(id!==n.actor&&a.position===n.position){delete s.stage.actors[id];s.cues.push({type:'move',actor:id,action:'exit'});}s.stage.actors[n.actor]={expression:n.expression,position:n.position,facing:1};}
 if(n.type==='move'){const a=s.stage.actors[n.actor];if(n.action==='exit')delete s.stage.actors[n.actor];else if(a){if(['left','center','right'].includes(n.action))a.position=n.action;if(n.action==='turn')a.facing*=-1;}}
 if(n.type==='goto'){s.cursor=story.labels[n.target];continue;}
 if(n.type==='if'){const a=s.variables[n.variable],b=n.value;const yes=n.op==='=='?a===b:n.op==='!='?a!==b:n.op==='>'?a>b:n.op==='<'?a<b:n.op==='>='?a>=b:a<=b;s.cursor=story.labels[yes?n.target:n.otherwise];continue;}
 if(n.type==='chance'){let x=s.seed;for(const c of n.id)x=Math.imul(x^c.charCodeAt(0),16777619)>>>0;const yes=x%100<n.percent;s.events.push({id:n.id,yes});s.cursor=story.labels[yes?n.target:n.otherwise];continue;}
 s.cursor++;}if(steps>=10000)throw Error('Story exceeded step limit');return s;}
export function advanceStory(story,state,option){const s=structuredClone(state),n=story.nodes[s.cursor];if(s.ended)throw Error('Story already ended');if(n.type==='say'){if(option!==null)throw Error('Expected dialogue advance');s.history.push({actor:n.actor,text:n.text});s.cursor++;}else if(n.type==='choice'){const o=n.options.find(o=>o.id===option);if(!o)throw Error('Invalid choice');for(const c of o.changes){const v=story.variables[c.variable];s.variables[c.variable]=c.op==='='?c.value:c.op==='+='?s.variables[c.variable]+c.value:s.variables[c.variable]-c.value;if(typeof c.value==='number')s.variables[c.variable]=Math.max(v.min,Math.min(v.max,s.variables[c.variable]));}s.history.push({actor:'I',text:o.text});s.cursor=story.labels[o.target];}else throw Error('Settle the story before advancing');return settleStory(story,s);}
export function replayStory(story,steps,seed){if(!Array.isArray(steps)||steps.length>5000)throw Error('Invalid attempt');return steps.reduce((s,step)=>advanceStory(story,s,step),settleStory(story,initialStoryState(story,seed)));}
export function validatePackage(pack){const errors=[];if(pack?.format!==1||typeof pack.title!=='string'||!pack.title.trim())errors.push({line:1,message:'A title and package format 1 are required'});const result=compileStory(pack?.script,pack?.assets);errors.push(...result.errors);if(!Array.isArray(pack?.quiz)||pack.quiz.length!==4||pack.quiz.some(q=>!q.prompt||!Array.isArray(q.options)||q.options.length!==4||q.options.some(o=>typeof o!=='string'||!o.trim())||!Number.isInteger(q.answer)||q.answer<0||q.answer>3||!q.explanation))errors.push({line:1,message:'Add four questions, each with four answers, a correct answer and explanation'});return {...result,errors};}
export function quizScore(quiz,answers){if(!Array.isArray(answers)||answers.length!==4||answers.some(a=>!Number.isInteger(a)||a<0||a>3))throw Error('Answer all four questions');return answers.reduce((n,a,i)=>n+(a===quiz[i].answer?25:0),0);}
