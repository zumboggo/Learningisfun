// Published journal v1 rules. Scores depend only on explicit evidence checkpoints.
export const notebookDomains=['Evidence','Interpretation','Language & Form','Connections'];
export function journalContent(story){
 const assessYoung=(choices=[])=>{
  if(!Array.isArray(choices)||choices.length>story.scenes.length)throw new Error('Invalid journal route');
  const scores=[0,0,0,0];choices.forEach((id,i)=>{const c=story.scenes[i].choices.find(c=>c.id===id);if(!c)throw new Error('Invalid journal choice');c.points.forEach((p,j)=>scores[j]+=p);});
  const complete=choices.length===story.scenes.length;
  return {complete,scores,total:scores.reduce((a,b)=>a+b,0),indicators:scores,ending:complete?{title:'What I discovered; what I still wonder',paragraphs:[story.scenes.at(-1).choices.find(c=>c.id===choices.at(-1)).response,'My account can be accurate even when the knight disagrees. The journal keeps evidence, inference, and unanswered questions together.']}:null};
 };
 const assessDriver=(attempts=[])=>{
  if(!Array.isArray(attempts)||attempts.length>200)throw new Error('Invalid completion checks');
  let score=0,passed=false;for(const answers of attempts){if(passed)throw new Error('The return check is already complete');if(!Array.isArray(answers)||answers.length!==4||answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=story.driverQuestions[i].options.length))throw new Error('Answer all four journal questions');score=answers.filter((a,i)=>a===story.driverQuestions[i].answer).length;passed=score>=3;}
  return {passed,score};
 };
 return {...story,scenes:story.scenes,sourceNotes:story.sources,assignmentPrompt:'Record what you discovered and what remains uncertain.',rubric:notebookDomains.map(n=>n+': 25 points from its explicit checkpoint; 25 supported reasoning, 5 unsupported overclaim, 0 not yet demonstrated.'),assessYoung,assessDriver};
}
export function validateJournal(journal={},choices=[],sceneCount){
 if(!journal||typeof journal!=='object'||Array.isArray(journal)||Object.keys(journal).some(k=>!['question','reflection'].includes(k)))throw new Error('Invalid journal writing');
 for(const key of ['question','reflection'])if(journal[key]!==undefined&&(typeof journal[key]!=='string'||journal[key].length>1000))throw new Error('Keep each journal entry within 1000 characters');
 if(journal.question!==undefined&&!choices.length||journal.reflection!==undefined&&choices.length!==sceneCount)throw new Error('Journal entry outside its passage');
 return {...journal};
}
export function journalProgress(a,sceneCount){
 const j=validateJournal(a.journal,a.choices,sceneCount);
 return [...a.choices.map((id,i)=>JSON.stringify({id,...(i===0?{question:j.question||''}:{}),...(i===sceneCount-1?{reflection:j.reflection||''}:{})})),...(a.driverAttempts||[]).map(v=>JSON.stringify(v))];
}
