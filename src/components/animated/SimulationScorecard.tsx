import type {StoryPackage,StoryState} from '../../../functions/learning-content/src/story-engine.js';
export type SimulationResult={title?:string;outcome?:string;scoringNote?:string;separate?:{label:string;value:number;maximum:number}[];total:number;maximum:number;categories:{variable:string;label:string;description:string;value:number;maximum:number}[]};
// Optional presentation only: server-replayed story variables remain authoritative.
// Invalid/imported metadata must never produce a misleading total or change quiz scoring.
export function simulationResult(pack:StoryPackage,story:any,state:StoryState):SimulationResult|null{
 const categories=pack.simulationScore?.categories;
 if(pack.simulationScore?.outcomes){
  const config=pack.simulationScore;
  if(!state.ended||!Array.isArray(config.outcomes)||!Array.isArray(categories)||!categories.length||categories.length>4||categories.some(c=>!c||typeof c.variable!=='string'||typeof c.label!=='string'||typeof c.description!=='string'||!Number.isFinite(c.maximum)||Number(c.maximum)<=0))return null;
  const outcome=config.outcomes.find(o=>o&&o.choice&&typeof o.label==='string'&&state.history.some(h=>h.choice?.id===o.choice.id&&h.choice.selected===o.choice.option)&&Object.entries(o.minimums||{}).every(([key,min])=>typeof min==='number'&&Number.isFinite(min)&&typeof state.variables[key]==='number'&&Number(state.variables[key])>=min));
  if(!outcome||!Array.isArray(outcome.points)||outcome.points.length!==categories.length||outcome.points.some((p,i)=>!Number.isFinite(p)||p<0||p>Number(categories[i].maximum)))return null;
  const separate=(Array.isArray(config.separateVariables)?config.separateVariables:[]).slice(0,4).flatMap(c=>{if(!c||typeof c.variable!=='string')return [];const definition=story.variables[c.variable],value=state.variables[c.variable];return typeof c.label==='string'&&definition&&typeof value==='number'&&Number.isFinite(value)?[{label:c.label,value,maximum:definition.max}]:[];});
  return {title:typeof config.title==='string'?config.title:undefined,outcome:outcome.label,scoringNote:typeof config.scoringNote==='string'?config.scoringNote:undefined,separate,total:outcome.points.reduce((a,b)=>a+b,0),maximum:categories.reduce((sum,c)=>sum+Number(c.maximum),0),categories:categories.map((c,i)=>({...c,value:outcome.points[i],maximum:Number(c.maximum)}))};
 }
 if(!Array.isArray(categories)||!categories.length||categories.length>4||new Set(categories.map(c=>c.variable)).size!==categories.length)return null;
 const rows=[];
 for(const c of categories){const definition=story.variables[c.variable],value=state.variables[c.variable];
  if(typeof c.label!=='string'||typeof c.description!=='string'||!definition||typeof definition.initial!=='number'||definition.min!==0||!Number.isFinite(definition.max)||definition.max<=0||typeof value!=='number'||!Number.isFinite(value)||value<0||value>definition.max)return null;
  rows.push({...c,value,maximum:definition.max});
 }
 return {total:rows.reduce((sum,c)=>sum+c.value,0),maximum:rows.reduce((sum,c)=>sum+c.maximum,0),categories:rows};
}
export default function SimulationScorecard({result,previous,complete,onReplay}:{result:SimulationResult;previous:SimulationResult|null;complete:boolean;onReplay?:()=>void}){
 return <section className="simulation-scorecard" aria-label="Simulation score">
 <div className="simulation-score-heading"><h2>{result.title||(complete?'Your decision score':'Decision score so far')}</h2><strong>{result.total} / {result.maximum}</strong></div>
 {result.outcome?<><p>{result.outcome}</p>{result.separate?.map(c=><p key={c.label}>{c.label}: {c.value} / {c.maximum} · shown separately from the score.</p>)}</>:<p>Equal weight for each point across the priorities. The scale’s category maxima may not all be attainable together.</p>}
 <div className="simulation-score-grid">{result.categories.map(c=><div key={c.variable}><b>{c.label}</b><span>{c.value} / {c.maximum}</span><meter aria-label={c.label} value={c.value} min={0} max={c.maximum}/><small>{c.description}</small></div>)}</div>
 {complete&&<><p className="simulation-score-message"><strong>Your score measures success under the game’s stated priorities, not an objective measure of moral goodness.</strong></p><p>{result.scoringNote||'These are debatable estimates of your recommendations—not lives counted, historical measurements, or your grade. A higher total can conceal a cost in one category.'}</p><p>Which category should count most? Would changing its weight change your choices? What interest is missing?</p>
 {previous&&<div aria-label="Replay comparison"><h3>Compared with your previous completed route</h3><p>Total: {previous.total} → {result.total} ({result.total-previous.total>=0?'+':''}{result.total-previous.total})</p><ul>{result.categories.map(c=>{const old=previous.categories.find(p=>p.variable===c.variable)?.value??0;return <li key={c.variable}>{c.label}: {old} → {c.value}</li>;})}</ul><p>This comparison lasts while this player stays open.</p></div>}
 {onReplay&&<button onClick={onReplay}>Replay for a different balance</button>}<p>The knowledge check below is scored separately out of 100.</p></>}
 </section>;
}
