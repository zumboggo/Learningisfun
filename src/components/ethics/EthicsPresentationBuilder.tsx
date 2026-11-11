import {useEffect, useRef, useState} from 'react';
import {Modal} from '@/components/common/Modal';
import {Button} from '@/components/common/Button';
import {CopyButton} from '@/components/common/CopyButton';
import {downloadBlob} from '@/services/qti-export';
import {executeLearningContent} from '@/services/learning-content.service';
import {activities, voices, questions, emptyDraft, updateChoice, choiceComplete, buildPresentationPrompt, type PresentationDraft} from '@/services/ethics-presentation';
const headings = ['What interesting ethical question do you want classmates to think about?', 'What tool, principle, or practical skill could help classmates think through this question?', 'What situation would you like classmates to explore?', 'How would you like classmates to practise?', 'What kind of voice do you want your presentation to have?'];
const hints = ['Choose a decision classmates can recognize. Connect it to specific material from our current unit; recent material is encouraged.', 'For example: checking who is affected, testing whether a rule is fair, or disagreeing respectfully.', 'Use a recognizable everyday situation, clearly identified fiction, or a historical or news example you can verify.', 'Choose one activity that classmates can try in about three minutes.', 'Choose as many as you like. Two or three usually give the clearest direction. Every presentation should be clear, specific, accessible, and useful.'];
type Suggestion = {text: string; why: string};
export function EthicsPresentationBuilder({classId, userId}: {classId: string; userId: string}) {
 const storageKey = `ethics-presentation:v1:${userId}:${classId}`;
 const [draft, setDraft] = useState<PresentationDraft>(() => {
  try {const saved=JSON.parse(localStorage.getItem(storageKey)||'null'); if(saved?.choices?.length===4&&saved.choices.every((c:unknown)=>!!c&&typeof c==='object'&&'text' in c&&'reason' in c&&'assisted' in c&&'stale' in c&&typeof c.text==='string'&&typeof c.reason==='string'&&typeof c.assisted==='boolean'&&typeof c.stale==='boolean')&&Array.isArray(saved.voices)&&saved.voices.every((v:unknown)=>typeof v==='string')&&saved.custom?.length===2&&saved.custom.every((v:unknown)=>typeof v==='string'))return saved;}catch{/* A fresh draft remains available if storage is blocked. */}
  return emptyDraft();
 });
 const [open,setOpen]=useState(false), [step,setStep]=useState(0), [busy,setBusy]=useState(false), [error,setError]=useState(''), [storageError,setStorageError]=useState(false);
 const [options,setOptions]=useState<Suggestion[]>([]), [prompt,setPrompt]=useState('');
 const request = useRef(0), heading = useRef<HTMLHeadingElement>(null);
 // Report browser storage failures so students know to export before leaving.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(draft));setStorageError(false);}catch{setStorageError(true);}},[draft,storageKey]);
 useEffect(()=>{if(open)heading.current?.focus();},[step,open]);
 useEffect(()=>()=>{request.current++;},[]);
 function change(index:number,text:string,assisted?:boolean) {request.current++;setBusy(false);setOptions([]);setError('');setDraft(d=>updateChoice(d,index,text,assisted));}
 function go(next:number) {request.current++;setBusy(false);setOptions([]);setError('');setStep(next);}
 async function suggest() {
  const id=++request.current;setBusy(true);setError('');setOptions([]);
  try {const result=await executeLearningContent<{options:Suggestion[]}>({action:'ethicsPresentationSuggestions',classId,step:['','tool','situation','activity'][step],question:draft.choices[0].text,tool:draft.choices[1].text,situation:draft.choices[2].text});if(id===request.current)setOptions(result.options);}
  catch(cause){if(id===request.current)setError((cause instanceof Error?cause.message:'Suggestions are unavailable.')+' You can still write your own answer.');}
  finally{if(id===request.current)setBusy(false);}
 }
 const choice=draft.choices[step];
 const valid=step===4||Boolean(choice&&choiceComplete(choice));
 return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-amber-950">Ethics in Practice</h2><p className="text-sm text-amber-900">Your question. Your choices. A useful ten-minute presentation.</p></div><Button onClick={()=>setOpen(true)}>Build my presentation prompt</Button></div>
  <Modal open={open} onClose={()=>setOpen(false)} title="Ethics presentation builder" panelClassName="sm:max-w-2xl">
   <div className="space-y-5">
    {storageError&&<p role="status" className="text-sm text-amber-800">This browser cannot save your progress. Keep this page open and download your prompt before leaving.</p>}
    {step<5?<>
     <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Step {step+1} of 5 · {['Question','Tool','Situation','Activity','Voice'][step]}</p>
     <h3 ref={heading} tabIndex={-1} className="text-xl font-bold outline-none" id="ethics-step-heading">{headings[step]}</h3>
     <p className="text-sm text-gray-600">{hints[step]}</p>
     {step===0&&<details><summary className="cursor-pointer font-medium text-blue-700">Explore the question menu</summary><div className="mt-3 grid gap-2">{questions.map(q=><button key={q} onClick={()=>change(0,q,false)} className="rounded-lg border p-3 text-left text-sm hover:bg-amber-50">{q}</button>)}</div></details>}
     {step===3&&<div className="grid gap-2 sm:grid-cols-2">{activities.map(a=><button key={a} aria-pressed={choice.text===a} className={`rounded-xl border p-3 text-left text-sm ${choice.text===a?'border-amber-600 bg-amber-50':'hover:bg-gray-50'}`} onClick={()=>change(3,a,false)}>{a}</button>)}</div>}
     {step<4&&<>
      <textarea aria-labelledby="ethics-step-heading" maxLength={1500} rows={4} className="w-full rounded-xl border p-3" placeholder={step===0?'For example: When does being a good friend mean saying no?':'Write your answer here, or request ideas below.'} value={choice.text} onChange={e=>change(step,e.target.value)}/>
      {choice.stale&&<div className="rounded-lg bg-amber-50 p-3 text-sm"><p>An earlier choice changed. Check that this answer and your reason still fit.</p><Button variant="secondary" size="sm" onClick={()=>setDraft(d=>({...d,choices:d.choices.map((c,i)=>i===step?{...c,stale:false}:c)}))}>I checked: this still fits</Button></div>}
      {step>0&&<Button variant="secondary" loading={busy} disabled={busy||!draft.choices.slice(0,step).every(choiceComplete)} onClick={()=>void suggest()}>Suggest three {step===1?'ideas':step===2?'situations':'activities'}</Button>}
      {busy&&<p role="status" className="text-sm text-gray-600">Finding three options for your choices…</p>}
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
      {options.length>0&&<div className="space-y-2"><p className="text-sm font-medium">Choose one, then explain why it fits. You can edit your choice.</p>{options.map((o,i)=><button key={i} className="block w-full rounded-xl border p-4 text-left hover:border-amber-600 hover:bg-amber-50" onClick={()=>change(step,o.text,true)}><strong className="block text-sm">{o.text}</strong><span className="mt-1 block text-sm text-gray-600">{o.why}</span></button>)}</div>}
      {choice.assisted&&<div className="rounded-xl bg-blue-50 p-4"><label htmlFor="ethics-choice-reason" className="block font-semibold">Why does this fit your question?</label><p className="my-2 text-sm text-gray-600">Asking for help carries no automatic grade penalty. Explain your choice briefly in your own words.</p><label htmlFor="ethics-choice-reason" className="text-sm">This could help because…</label><textarea id="ethics-choice-reason" rows={2} maxLength={800} className="mt-1 w-full rounded-lg border bg-white p-2" value={choice.reason} onChange={e=>setDraft(d=>({...d,choices:d.choices.map((c,i)=>i===step?{...c,reason:e.target.value}:c)}))}/></div>}
     </>}
     {step===4&&<><div className="flex flex-wrap gap-2">{voices.map(v=><button key={v} aria-pressed={draft.voices.includes(v)} onClick={()=>setDraft(d=>({...d,voices:d.voices.includes(v)?d.voices.filter(x=>x!==v):[...d.voices,v]}))} className={`rounded-full border px-4 py-2 text-sm ${draft.voices.includes(v)?'border-amber-600 bg-amber-100 text-amber-950':'hover:bg-gray-50'}`}>{v}</button>)}</div>{draft.custom.map((v,i)=><label key={i} className="block text-sm">{i===0?'Another voice idea…':'One more…'}<input maxLength={100} className="mt-1 w-full rounded-lg border p-3" value={v} onChange={e=>setDraft(d=>({...d,custom:d.custom.map((x,j)=>i===j?e.target.value:x)}))}/></label>)}</>}
     <div className="flex justify-between border-t pt-4"><Button variant="secondary" disabled={step===0} onClick={()=>go(step-1)}>Back</Button><Button disabled={!valid||busy} onClick={()=>{if(step===4){const incomplete=draft.choices.findIndex(c=>!choiceComplete(c));if(incomplete!==-1){go(incomplete);return;}setPrompt(buildPresentationPrompt(draft));}go(step+1);}}>{step===4?'Generate my prompt':'Continue'}</Button></div>
    </>:<>
     <h3 ref={heading} tabIndex={-1} className="text-xl font-bold outline-none">Your presentation prompt</h3>
     <p className="text-sm text-gray-600">Copy this into whichever AI tool you choose. You can edit it here before copying or downloading. Returning to the questions and generating again replaces these preview edits.</p>
     <textarea aria-label="Editable presentation prompt" rows={14} className="w-full rounded-xl border p-3 text-sm" value={prompt} onChange={e=>setPrompt(e.target.value)}/>
     <div className="flex flex-wrap gap-2"><CopyButton text={prompt} label="Copy prompt" size="md"/><Button disabled={!prompt.trim()} onClick={()=>downloadBlob(new Blob([prompt],{type:'text/plain;charset=utf-8'}),'ethics-presentation-prompt.txt')}>Download .txt</Button><Button variant="ghost" onClick={()=>go(4)}>Back to my choices</Button></div>
     <div className="rounded-xl bg-amber-50 p-4 text-sm"><strong>Before presenting</strong><ul className="mt-2 list-disc space-y-2 pl-5"><li>Complete <strong>Class Connection</strong> yourself: name a specific current-unit Episode moment, passage, or discussion; explain its idea and how it connects. Use your own wording, without AI. Recent material is encouraged.</li><li>Verify accuracy and revise the draft. Save a meaningful before-and-after revision and explain why it helped.</li><li>Rehearse nine minutes plus a one-minute buffer. The timer stops everyone at ten minutes, including practice and questions.</li></ul></div>
     <p className="text-sm text-gray-600">Present November 12. Submit your deck with notes and your own named reflection together by November 13, 2026, 11:59 p.m. China time. Each partner submits both. Your prompt and AI transcript are not required.</p>
    </>}
   </div>
  </Modal>
 </section>;
}
