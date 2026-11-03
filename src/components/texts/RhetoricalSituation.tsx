import {useId, useState} from 'react';
import {executeLearningContent} from '@/services/learning-content.service';
export {isApLanguageCourse} from '../../../functions/learning-content/src/rhetorical-fields.js';

const fields=[
  ['writer','Writer / speaker','Who is communicating? What role, perspective, or credibility matters here?'],
  ['audience','Audience','Who is the intended audience? What do they value, believe, know, or expect?'],
  ['purpose','Purpose','What does the writer want this audience to think, feel, or do?'],
  ['exigence','Exigence','What specific event, problem, or need prompted this text? Why speak now?'],
  ['context','Context','What broader historical, social, cultural, or immediate circumstances shape this text?'],
  ['message','Message','What central idea or claim does the writer communicate? How is it different from the intended effect?'],
] as const;
type Responses=Record<typeof fields[number][0],string>;
type Practice={responses:Responses;updatedAt:string|null};
const empty=()=>Object.fromEntries(fields.map(([key])=>[key,''])) as Responses;

export function RhetoricalSituation({textId,classId}:{textId:string;classId:string}) {
  const id=useId();
  const [open,setOpen]=useState(false),[loaded,setLoaded]=useState(false),[loading,setLoading]=useState(false);
  const [responses,setResponses]=useState<Responses>(empty),[saved,setSaved]=useState<Responses>(empty);
  const [saving,setSaving]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
  const dirty=JSON.stringify(responses)!==JSON.stringify(saved);
  const count=fields.filter(([key])=>responses[key].trim()).length;
  async function load(){
    setLoading(true);setError('');
    try{const data=await executeLearningContent<Practice>({action:'readRhetoricalSituation',textId,classId});setResponses(data.responses);setSaved(data.responses);setLoaded(true);setStatus(data.updatedAt?'Saved responses loaded.':'');}
    catch(e){setError(e instanceof Error?e.message:'Could not load your practice.');}
    finally{setLoading(false);}
  }
  async function save(){
    const snapshot={...responses};setSaving(true);setError('');setStatus('');
    try{const data=await executeLearningContent<Practice>({action:'saveRhetoricalSituation',textId,classId,responses:snapshot});setSaved(data.responses);setStatus('Practice saved.');}
    catch(e){setError(e instanceof Error?e.message:'Could not save. Your responses are still here; try again.');}
    finally{setSaving(false);}
  }
  return <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60">
    <button type="button" aria-expanded={open} aria-controls={id} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-indigo-950 focus-visible:outline-2 focus-visible:outline-indigo-700" onClick={()=>{setOpen(!open);if(!open&&!loaded&&!loading)void load();}}>
      <span>Rhetorical Situation</span><span className="text-sm font-normal">{loaded?`${count}/6 explored · `:''}{open?'Hide':'Explore'} <span aria-hidden="true">{open?'▴':'▾'}</span></span>
    </button>
    <div id={id} hidden={!open} className="space-y-4 border-t border-indigo-100 p-4">
      <p className="text-sm text-slate-700">Practise the six AP Language elements. Support your thinking with a detail or short quotation. If the text does not establish something, explain what you can infer and what remains uncertain.</p>
      {loading&&<p role="status">Loading your practice…</p>}
      {error&&<p role="alert" className="text-sm text-red-800">{error} {!loaded&&!loading&&<button type="button" className="underline" onClick={()=>void load()}>Try again</button>}</p>}
      {loaded&&<form className="space-y-4" onSubmit={e=>{e.preventDefault();void save();}}>
        <div className="grid gap-4 md:grid-cols-2">{fields.map(([key,label,prompt])=><div key={key} className="space-y-1"><label htmlFor={`${id}-${key}`} className="block font-semibold text-slate-900">{label}</label><p id={`${id}-${key}-hint`} className="text-sm text-slate-600">{prompt}</p><textarea id={`${id}-${key}`} aria-describedby={`${id}-${key}-hint`} rows={3} maxLength={3000} className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-base focus:border-indigo-600 focus:outline-indigo-600" value={responses[key]} onChange={e=>{setResponses(current=>({...current,[key]:e.target.value}));setStatus('');}}/></div>)}</div>
        <div className="flex flex-wrap items-center gap-3"><button disabled={saving||!dirty} className="min-h-11 rounded-xl bg-indigo-800 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving?'Saving…':'Save practice'}</button><p role="status" className="text-sm text-slate-700">{dirty?'Unsaved changes':status}</p></div>
        <p className="text-xs text-slate-600">Private practice for your account and this class text. Save before leaving; you can return and revise. This is not a graded submission.</p>
      </form>}
    </div>
  </section>;
}
