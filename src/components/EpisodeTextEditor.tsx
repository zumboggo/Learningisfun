import {useEffect,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import {executeLearningContent} from '@/services/learning-content.service';
import {connectEpisodeText,type TextField,type TextPatches} from '@/services/episode-text-dom';
interface SavedText {revision:number;patches:TextPatches}
export default function EpisodeTextEditor({iframeRef,frameKey,classId,episode,version,preview}:{iframeRef:RefObject<HTMLIFrameElement|null>;frameKey:string|number;classId:string;episode:string;version:number;preview:boolean}){
 const [saved,setSaved]=useState<SavedText>({revision:0,patches:{}}),[ready,setReady]=useState(false),[editing,setEditing]=useState(false),[fields,setFields]=useState<TextField[]>([]),[selected,setSelected]=useState<TextField|null>(null),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const patches=useRef<TextPatches>({}),editMode=useRef(false),controller=useRef<ReturnType<typeof connectEpisodeText>|null>(null),panel=useRef<HTMLElement>(null);
 const selectedRef=useRef<TextField|null>(null);
 useLayoutEffect(()=>{editMode.current=editing;selectedRef.current=selected;},[editing,selected]);
 const payload={classId,episode,version};
 const cacheKey='episode-text:'+classId+':'+episode+':'+version;
 useEffect(()=>{let active=true;void executeLearningContent<SavedText>({action:'readEpisodeText',classId,episode,version}).then(result=>{if(active){setSaved(result);setReady(true);}}).catch(()=>{if(active){let cached=false;try{const stored=JSON.parse(localStorage.getItem(cacheKey)||'null');if(stored&&Number.isSafeInteger(stored.revision)&&stored.patches&&typeof stored.patches==='object'){setSaved(stored);cached=true;}}catch{/* Local storage may be unavailable. */}setMessage(cached?'Using the last saved text on this device. Reconnect and reload before editing.':'Saved text could not be loaded. Showing the original episode. Reconnect and reload before editing.');}});return()=>{active=false;};},[classId,episode,version,cacheKey]);
 useEffect(()=>{if(ready)try{localStorage.setItem(cacheKey,JSON.stringify(saved));}catch{/* Play remains available when storage is full. */}},[ready,saved,cacheKey]);
 useEffect(()=>{patches.current=saved.patches;controller.current?.refresh();},[saved]);
 useEffect(()=>{
  const frame=iframeRef.current;let doc:Document|null=null;
  const choose=(field:TextField)=>{setSelected(field);setDraft(field.text);panel.current?.scrollIntoView({block:'nearest'});};
  const click=(event:MouseEvent)=>{
   if(!editMode.current)return;
   event.preventDefault();event.stopImmediatePropagation();
   if(selectedRef.current)return;
   const target=event.target as Element;
   const field=controller.current?.fields().find(f=>f.node.parentElement===target)||controller.current?.fields().find(f=>target.contains(f.node));
   if(field)choose(field);
  };
  const attach=()=>{controller.current?.disconnect();doc?.removeEventListener('click',click,true);try{doc=frame?.contentDocument||null;if(doc?.body){controller.current=connectEpisodeText(doc,()=>patches.current,setFields);doc.addEventListener('click',click,true);}}catch{setMessage('This story cannot be edited in this browser.');}};
  attach();frame?.addEventListener('load',attach);
  return()=>{controller.current?.disconnect();doc?.removeEventListener('click',click,true);frame?.removeEventListener('load',attach);};
 },[iframeRef,frameKey]);
 async function save(text:string){
  if(!selected||busy)return;setBusy(true);setMessage('Saving…');
  try{const result=await executeLearningContent<SavedText>({action:'saveEpisodeText',...payload,revision:saved.revision,key:selected.key,original:selected.original,text});setSaved(result);setSelected(null);setMessage('Saved for this class. Students see the change when they open the episode.');}
  catch(e){setMessage(e instanceof Error?e.message:'Could not save. Your edit is still here.');}
  finally{setBusy(false);}
 }
 async function reload(){setBusy(true);try{setSaved(await executeLearningContent<SavedText>({action:'readEpisodeText',...payload}));setReady(true);setMessage('Saved text reloaded. Your draft is still here.');}catch{setMessage('Could not reload saved text. Try again when connected.');}finally{setBusy(false);}}
 if(!preview)return message?<p role="status" className="my-2 text-sm">{message.replace(" Reconnect and reload before editing.","")}</p>:null;
 return <section ref={panel} aria-label="Episode text editor" className="sticky top-0 z-20 my-3 rounded-xl border border-teal-300 bg-white p-3 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold">Teacher preview · Text changes apply to this class</p><button disabled={!ready||busy||!!selected} aria-pressed={editing} className="rounded bg-teal-900 px-4 py-2 text-white disabled:opacity-50" onClick={()=>setEditing(v=>!v)}>{editing?'Done editing · resume play':'Edit text'}</button></div>
  {editing&&<><p className="my-2 text-sm">Click story text to edit it, or choose it below. Finish editing to follow choices to another page. Links, scores, and story logic stay the same.</p><label className="block text-sm">Text on this page<select aria-label="Text on this page" disabled={busy||!!selected} value="" onChange={e=>{const field=fields.find(f=>f.key===e.target.value);if(field){setSelected(field);setDraft(field.text);}}} className="mt-1 block w-full rounded border p-2"><option value="">Choose visible text…</option>{fields.map(f=><option key={f.key} value={f.key}>{f.text.trim().slice(0,120)}</option>)}</select></label></>}
  {editing&&selected&&<div className="mt-3"><label htmlFor="episode-text-draft" className="text-sm font-semibold">Edit selected text</label><textarea id="episode-text-draft" autoFocus disabled={busy} value={draft} onChange={e=>setDraft(e.target.value)} maxLength={8000} rows={4} className="block max-h-48 w-full rounded border p-2"/><div className="mt-2 flex flex-wrap gap-2"><button disabled={busy||!draft.trim()} onClick={()=>void save(draft)} className="rounded bg-teal-900 px-4 py-2 text-white disabled:opacity-50">{busy?'Saving…':'Save for this class'}</button><button disabled={busy} className="rounded border px-3 py-2" onClick={()=>setSelected(null)}>Cancel</button><button disabled={busy} className="rounded border px-3 py-2" onClick={()=>setDraft(selected.original)}>Restore original wording</button></div><p className="mt-1 text-xs">Restoring puts the original in the box; press Save to publish it.</p></div>}
  {message&&<p role="status" className="mt-2 text-sm">{message}</p>}{(!ready||message.includes('elsewhere'))&&<button disabled={busy} onClick={()=>void reload()} className="mt-2 rounded border px-3 py-2">Reload saved text</button>}
 </section>;
}
