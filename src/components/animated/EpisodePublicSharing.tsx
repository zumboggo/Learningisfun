import {useEffect,useState} from 'react';
import {animatedCall} from '@/services/animated-stories';
type Sharing={enabled:boolean;shareId:string};
export default function EpisodePublicSharing({versionId}:{versionId:string}){return <SharingControl key={versionId} versionId={versionId}/>;}
function SharingControl({versionId}:{versionId:string}){
 const [sharing,setSharing]=useState<Sharing|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[manualCopy,setManualCopy]=useState(false);
 useEffect(()=>{let active=true;void animatedCall('readEpisodePublicSharing',{versionId}).then((s:Sharing)=>{if(active)setSharing(s);}).catch(e=>{if(active)setMessage(String(e));});return()=>{active=false;};},[versionId]);
 const url=sharing?new URL(import.meta.env.BASE_URL+'#/game/public/'+sharing.shareId,window.location.origin).href:'';
 const copy=async()=>{try{await navigator.clipboard.writeText(url);setManualCopy(false);setMessage('Copied');}catch{setManualCopy(true);setMessage('Copy the link below.');}};
 const toggle=async()=>{if(!sharing)return;setBusy(true);setMessage('');setManualCopy(false);try{setSharing(await animatedCall('setEpisodePublicSharing',{versionId,enabled:!sharing.enabled}));}catch(e){setMessage(String(e));}finally{setBusy(false);}};
 return <div aria-label="Public episode sharing" className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
  <button type="button" className={`inline-flex min-h-8 items-center rounded-md border px-2.5 font-medium disabled:opacity-50 ${sharing?.enabled?'border-teal-200 bg-teal-50 text-teal-800':'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`} disabled={!sharing||busy} aria-label={sharing?.enabled?'Turn off public link':'Make public'} aria-pressed={sharing?.enabled===true} title={sharing?.enabled?'Public — click to turn off sharing':'Allow anyone with the link to play'} onClick={()=>void toggle()}>{sharing?.enabled?'Public':'Make public'}</button>
  {sharing?.enabled&&<button type="button" aria-label="Copy public link" title="Copy public link" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-teal-800 hover:bg-teal-50" onClick={()=>void copy()}><svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/></svg></button>}
  {message&&<span role="status" className="text-gray-600">{message}</span>}
  {manualCopy&&sharing?.enabled&&<input aria-label="Public episode link" className="w-full rounded border p-2" readOnly value={url} onFocus={e=>e.target.select()}/>}
 </div>;
}
