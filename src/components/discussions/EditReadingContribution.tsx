import {useState} from 'react';
import {DiscussionTextInput} from './DiscussionControls';
import {Button} from '@/components/common/Button';
import type {ReadingDiscussionPost} from '@/services/reading-discussion.service';
export function EditReadingContribution({post,busy,onSave,onCancel}:{post:ReadingDiscussionPost;busy:boolean;onSave:(fields:Record<string,unknown>)=>Promise<void>;onCancel:()=>void}){
 const [expectedUpdatedAt]=useState(post.updatedAt||post.createdAt);
 const [content,setContent]=useState(post.content),[quotation,setQuotation]=useState(post.quotation),[paragraph,setParagraph]=useState(post.paragraph?.toString()||''),[error,setError]=useState('');
 return <form className="space-y-3 rounded-xl bg-slate-50 p-3" onSubmit={e=>{e.preventDefault();setError('');void onSave({content,quotation,paragraph,expectedUpdatedAt}).then(onCancel).catch(cause=>setError(cause instanceof Error?cause.message:'Could not save. Your edit is still here.'));}}>
 <DiscussionTextInput label="Edit contribution" value={content} onChange={setContent}/>
 <label className="block text-sm">Quotation<textarea className="mt-1 w-full rounded border p-2" maxLength={3000} value={quotation} onChange={e=>setQuotation(e.target.value)}/></label>
 <label className="block text-sm">Paragraph number<input className="ml-2 w-24 rounded border p-2" type="number" min={1} max={10000} value={paragraph} onChange={e=>setParagraph(e.target.value)}/></label>
 {error&&<p role="alert" className="text-red-700">{error}</p>}
 <div className="flex gap-2"><Button type="submit" disabled={busy||!content.trim()}>Save changes</Button><Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>Cancel</Button></div>
 </form>;
}
