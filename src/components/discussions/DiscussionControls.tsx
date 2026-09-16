import { validOptionalSourceLink } from '@/utils/source-link';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { LinkToggle, SourceLinkFields } from './SourceLink';

export function DiscussionTextInput({value,onChange,label,placeholder,rows=3}:{value:string;onChange:(value:string)=>void;label:string;placeholder?:string;rows?:number}) {
  const [linkOpen,setLinkOpen]=useState(false),[title,setTitle]=useState(''),[url,setUrl]=useState('');
  return <div className="space-y-2"><label className="block text-sm font-medium">{label}<textarea aria-label={label} className="mt-2 w-full rounded-xl border bg-white p-3 text-base text-slate-900" rows={rows} maxLength={10000} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>
    <LinkToggle open={linkOpen} onClick={()=>setLinkOpen(!linkOpen)}/>
    {linkOpen&&<div><SourceLinkFields title={title} url={url} onTitleChange={setTitle} onUrlChange={setUrl}/><Button type="button" size="sm" variant="secondary" disabled={!title.trim()||!validOptionalSourceLink(title,url)} onClick={()=>{const name=title.trim().replace(/[[\]\\]/g,'');onChange(value+(value?'\n':'')+'['+name+']('+encodeURI(url.trim()).replace(/[()]/g,c=>c==='('?'%28':'%29')+')');setTitle('');setUrl('');setLinkOpen(false);}}>Insert link</Button></div>}
  </div>;
}

export function DiscussionVote({score,value,disabled,onVote,allowDownvote=false,upvoteTitle='Upvote',announceScore=false}:{score:number;value:number;disabled?:boolean;onVote:(value:number)=>Promise<unknown>|void;allowDownvote?:boolean;upvoteTitle?:string;announceScore?:boolean}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const vote=async(next:number)=>{if(busy)return;setBusy(true);setError('');try{await onVote(next);}catch{setError('Could not update your vote. Try again.');}finally{setBusy(false);}};
  return <span className={allowDownvote?"inline-flex flex-col items-center gap-1":"inline-flex flex-wrap items-center gap-1"}><button type="button" disabled={disabled||busy} aria-label={(value===1?'Remove upvote':'Upvote')+(announceScore?`: ${score}`:'')} aria-pressed={value===1} title={upvoteTitle} className={'min-h-11 min-w-11 rounded-lg border px-3 '+(value===1?'active bg-blue-50 text-blue-800':'')} onClick={()=>void vote(value===1?0:1)}>↑</button><strong aria-live="polite" className="px-1">{score}</strong>{allowDownvote&&<button type="button" aria-label={value===-1?'Remove downvote':'Downvote'} aria-pressed={value===-1} disabled={disabled||busy} className={"min-h-11 min-w-11 rounded-lg border "+(value===-1?"active-down":"")} onClick={()=>void vote(value===-1?0:-1)}>↓</button>}{error&&<small role="alert" className="text-red-700">{error}</small>}</span>;
}

export function DiscussionModeration({actions,disabled}:{actions:Array<{label:string;run:()=>Promise<unknown>|void;confirm?:string}>;disabled?:boolean}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const run=async(action:typeof actions[number])=>{if(busy||(action.confirm&&!window.confirm(action.confirm)))return;setBusy(true);setError('');try{await action.run();}catch{setError('Could not update this post. Try again.');}finally{setBusy(false);}};
  return <span><details className="relative"><summary className="inline-flex min-h-11 cursor-pointer items-center px-2 text-sm text-slate-600">Moderate ▾</summary><div className="flex flex-wrap gap-2 rounded-lg border bg-white p-2">{actions.map(action=><button type="button" key={action.label} disabled={disabled||busy} className="min-h-11 rounded px-3 text-sm capitalize hover:bg-slate-50" onClick={()=>void run(action)}>{action.label}</button>)}</div></details>{error&&<small role="alert" className="text-red-700">{error}</small>}</span>;
}

export function SimpleDiscussionComposer({storageKey,onSubmit,onCancel,submitLabel='Post',label='Your contribution',placeholder='Build on this idea…'}:{storageKey:string;onSubmit:(content:string)=>Promise<unknown>;onCancel:()=>void;submitLabel?:string;label?:string;placeholder?:string}) {
  const [content,setContent]=useState(()=>{try{return localStorage.getItem(storageKey)||'';}catch{return '';}}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const update=(value:string)=>{setContent(value);try{localStorage.setItem(storageKey,value);}catch{setError('Draft could not be saved on this device. Keep this page open.');}};
  return <form className="space-y-3 rounded-xl border bg-slate-50 p-3" onSubmit={e=>{e.preventDefault();if(busy||!content.trim())return;setBusy(true);setError('');void onSubmit(content.trim()).then(()=>{try{localStorage.removeItem(storageKey);}catch{/* Server save succeeded. */}setContent('');onCancel();}).catch(()=>setError('Could not post. Your draft is still here; try again.')).finally(()=>setBusy(false));}}><DiscussionTextInput value={content} onChange={update} label={label} placeholder={placeholder}/><div className="flex gap-2"><Button type="submit" disabled={busy||!content.trim()}>{submitLabel}</Button><Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Cancel</Button></div>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}</form>;
}
