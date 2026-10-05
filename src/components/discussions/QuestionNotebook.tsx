import { useState } from 'react';
import { Button } from '@/components/common/Button';
import type { ReadingDiscussion } from '@/services/reading-discussion.service';

type Mutate=(action:string,fields:Record<string,unknown>)=>Promise<void>;
export function QuestionNotebook({data,storageKey,busy,mutate}:{data:ReadingDiscussion;storageKey:string;busy:boolean;mutate:Mutate}) {
  const blank=()=>({draftId:crypto.randomUUID(),content:'',expectedUpdatedAt:undefined as string|undefined});
  const [editing,setEditing]=useState<{draftId:string;content:string;expectedUpdatedAt?:string}>(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'null')||blank();}catch{return blank();}});
  const [chosen,setChosen]=useState<string[]>([]),[localError,setLocalError]=useState('');
  const saveLocal=(next:typeof editing)=>{setEditing(next);try{localStorage.setItem(storageKey,JSON.stringify(next));setLocalError('');}catch{setLocalError('Local recovery is unavailable. Keep this page open until your draft is saved.');}};
  const notebook=data.notebook||[],spaces=data.remainingSpaces||0;
  const editingSelected=Boolean(editing.content.trim()&&notebook.some(d=>d.draftId===editing.draftId&&chosen.includes(d.id)));
  const saveNew=()=>mutate('saveReadingQuestionDraft',{draftId:crypto.randomUUID(),content:editing.content}).then(()=>saveLocal(blank()));
  const edit=(draft:typeof notebook[number])=>{
    // Keep unsaved writing recoverable instead of silently replacing it.
    if(editing.content.trim()&&editing.draftId!==draft.draftId){setLocalError('Save your current draft before opening another.');return;}
    saveLocal({draftId:draft.draftId,content:draft.content,expectedUpdatedAt:draft.updatedAt});
  };
  return <section aria-label="Private question notebook" className="my-3 space-y-3 rounded-2xl border border-purple-200 bg-purple-50/40 p-4">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">Your private question notebook</h3><span>{data.publishedCount||0} of 3 questions published</span></div>
    <p className="text-sm text-slate-600">Draft as many questions as you like. Only the questions you publish are shared with your teacher and classmates. Hidden questions still count toward your three published questions.</p>
    <form className="space-y-2" onSubmit={e=>{e.preventDefault();void mutate('saveReadingQuestionDraft',editing).then(()=>{saveLocal(blank());}).catch(()=>{});}}>
      <label className="block text-sm font-medium">Draft question<textarea aria-label="Draft question" className="mt-1 w-full rounded-lg border bg-white p-3" rows={3} maxLength={10000} value={editing.content} onChange={e=>saveLocal({...editing,content:e.target.value})}/></label>
      <Button type="submit" disabled={busy||!editing.content.trim()}>Save private draft</Button>{editing.expectedUpdatedAt&&<Button type="button" variant="secondary" disabled={busy||!editing.content.trim()} onClick={()=>void saveNew().catch(()=>{})}>Save as a new draft</Button>}<span className="ml-3 text-xs text-slate-500">Saved drafts follow your account across devices. Unsaved writing stays on this device.</span>
    </form>
    {localError&&<p role="alert" className="text-sm text-red-700">{localError}</p>}
    <p className="text-sm font-medium">Could this question deepen our understanding, and can we investigate it using the text?</p>
    <div className="space-y-2">{notebook.map(draft=><div className="rounded-lg border bg-white p-3" key={draft.id}>
      <label className="flex gap-3"><input type="checkbox" aria-label={`Select ${draft.content}`} checked={chosen.includes(draft.id)} disabled={busy||(!chosen.includes(draft.id)&&chosen.length>=spaces)} onChange={e=>setChosen(current=>e.target.checked?[...current,draft.id]:current.filter(id=>id!==draft.id))}/><span className="whitespace-pre-wrap">{draft.content}</span></label>
      <div className="mt-2 flex gap-2"><Button size="sm" variant="secondary" disabled={busy} onClick={()=>edit(draft)}>Edit draft</Button><Button size="sm" variant="secondary" disabled={busy} onClick={()=>void mutate('deleteReadingQuestionDraft',{draftId:draft.id}).then(()=>setChosen(current=>current.filter(id=>id!==draft.id))).catch(()=>{})}>Delete draft</Button></div>
    </div>)}</div>
    <Button disabled={busy||!chosen.length||chosen.length>spaces||editingSelected} onClick={()=>void mutate('publishReadingQuestions',{draftIds:chosen}).then(()=>setChosen([])).catch(()=>{})}>Publish selected questions ({chosen.length})</Button>
    {editingSelected&&<p className="text-sm">Save your wording changes before publishing this draft.</p>}
    {!spaces&&<p className="text-sm text-slate-600">You can keep drafting and replying. Withdraw an unanswered question to make room for a replacement; questions with replies remain editable.</p>}
  </section>;
}
