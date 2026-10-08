import { useState, useRef, type ClipboardEvent } from 'react';
import { imageFileMarkdown } from '@/services/reading-image.service';
import { Markdown } from '@/components/common/Markdown';
import { htmlToMarkdown } from '@/utils/rich-text';

type EditorProps = {
  value:string; onChange:(value:string)=>void; rows?:number; placeholder?:string;
  autoFocus?:boolean; preview?:boolean; maxLength?:number; images?:boolean;
  baseUrl?:string; disabled?:boolean; onBusyChange?:(busy:boolean)=>void;
};
export function MarkdownPasteEditor({ value, onChange, rows=10, placeholder, autoFocus=false, preview=true, maxLength, images=false, baseUrl, disabled=false, onBusyChange }: EditorProps) {
  const [imageError,setImageError]=useState(''), [adding,setAdding]=useState(false);
  const fileInput=useRef<HTMLInputElement>(null), ref=useRef<HTMLTextAreaElement>(null);
  const limit=(next:string)=>maxLength?next.slice(0,maxLength):next;
  const replaceSelection=(before:string,after=before,sample='text')=>{
    const input=ref.current,start=input?.selectionStart??value.length,end=input?.selectionEnd??value.length;
    const selected=value.slice(start,end)||sample;
    onChange(limit(`${value.slice(0,start)}${before}${selected}${after}${value.slice(end)}`));
    requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(start+before.length,start+before.length+selected.length);});
  };
  const addPicture=async(file:File)=>{
    const input=ref.current,start=input?.selectionStart??value.length,end=input?.selectionEnd??value.length;
    setImageError('');setAdding(true);onBusyChange?.(true);
    try{
      const markdown=await imageFileMarkdown(file);
      onChange(`${value.slice(0,start)} ${markdown} ${value.slice(end)}`);
      requestAnimationFrame(()=>{input?.focus();input?.setSelectionRange(start+markdown.length+2,start+markdown.length+2);});
    }catch(error){setImageError(error instanceof Error?error.message:'Could not add picture.');}
    finally{setAdding(false);onBusyChange?.(false);}
  };
  const paste=(event:ClipboardEvent<HTMLTextAreaElement>)=>{
    const html=event.clipboardData.getData('text/html');
    if(!html){
      const picture=images?[...event.clipboardData.files].find(file=>file.type.startsWith('image/')):undefined;
      if(picture){event.preventDefault();void addPicture(picture);}return;
    }
    const markdown=htmlToMarkdown(html,baseUrl,images);if(!markdown)return;
    event.preventDefault();const input=event.currentTarget,start=input.selectionStart,end=input.selectionEnd;
    const next=limit(`${value.slice(0,start)}${markdown}${value.slice(end)}`);onChange(next);
    requestAnimationFrame(()=>{const cursor=Math.min(next.length,start+markdown.length);input.focus();input.setSelectionRange(cursor,cursor);});
  };
  return <fieldset disabled={disabled||adding} className="min-w-0 space-y-2">
    <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 bg-gray-50 p-2">
      <Tool label="B" className="font-bold" onClick={()=>replaceSelection('**','**','bold text')}/>
      <Tool label="I" className="italic" onClick={()=>replaceSelection('*','*','italic text')}/>
      <Tool label="Heading" onClick={()=>replaceSelection('## ','','Heading')}/>
      <Tool label="• List" onClick={()=>replaceSelection('- ','','List item')}/>
      <Tool label="Quote" onClick={()=>replaceSelection('> ','','Quoted text')}/>
      <Tool label="Link" onClick={()=>replaceSelection('[','](https://)','link text')}/>
      {images&&<Tool label="Add picture" onClick={()=>fileInput.current?.click()}/>}
    </div>
    {images&&<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Upload picture" className="hidden" onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void addPicture(file);}}/>}
    <textarea ref={ref} aria-label="Text content" autoFocus={autoFocus} rows={rows} maxLength={maxLength} className="w-full rounded-b-lg border px-3 py-3 font-mono text-sm leading-6" placeholder={placeholder} value={value} onChange={event=>onChange(event.target.value)} onPaste={paste}/>
    <p className="text-xs text-gray-500">Paste from a webpage or document to keep headings, bold, italics, lists, links, quotes, and tables where possible. {images&&'Pictures are copied into app storage when you save. Keep the source URL above for relative image links. You can also upload or paste a picture at the cursor.'}</p>
    {adding&&<p role="status" className="text-sm text-gray-500">Adding picture…</p>}
    {imageError&&<p role="alert" className="text-sm text-red-700">{imageError}</p>}
    {preview&&<div className="rounded-lg border bg-white p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Preview</p><Markdown content={value||'*Nothing pasted yet.*'} className="text-base text-gray-800"/></div>}
  </fieldset>;
}
function Tool({label,onClick,className=''}:{label:string;onClick:()=>void;className?:string}){
  return <button type="button" className={`rounded border bg-white px-2.5 py-1 text-xs hover:bg-gray-100 disabled:opacity-50 ${className}`} onClick={onClick}>{label}</button>;
}
