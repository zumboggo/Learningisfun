import {useEffect,useState} from 'react';
import {animatedCall} from '@/services/animated-stories';
type Sharing={enabled:boolean;shareId:string};
export default function EpisodePublicSharing({versionId}:{versionId:string}){return <SharingControl key={versionId} versionId={versionId}/>;}
function SharingControl({versionId}:{versionId:string}){
 const [sharing,setSharing]=useState<Sharing|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;void animatedCall('readEpisodePublicSharing',{versionId}).then((s:Sharing)=>{if(active)setSharing(s);}).catch(e=>{if(active)setMessage(String(e));});return()=>{active=false;};},[versionId]);
 const url=sharing?new URL(import.meta.env.BASE_URL+'#/game/public/'+sharing.shareId,window.location.origin).href:'';
 const copy=async()=>{try{await navigator.clipboard.writeText(url);setMessage('Public link copied.');}catch{setMessage('Select the link above and copy it manually.');}};
 const toggle=async()=>{if(!sharing)return;setBusy(true);setMessage('');try{setSharing(await animatedCall('setEpisodePublicSharing',{versionId,enabled:!sharing.enabled}));}catch(e){setMessage(String(e));}finally{setBusy(false);}};
 return <section aria-label="Public episode sharing" className="mt-4 space-y-2 rounded-lg border border-teal-200 bg-white p-3 text-sm"><p className="font-semibold">{sharing?.enabled?'Public · anyone with the link can play':'Public sharing'}</p><p>No account required. Guest plays do not count toward class scores. Sharing applies to this published version.</p><button className="min-h-11 rounded border px-3 py-2" disabled={!sharing||busy} onClick={()=>void toggle()}>{sharing?.enabled?'Turn off public link':'Make public'}</button>{sharing?.enabled&&<><label className="block">Public episode link<input className="mt-1 w-full rounded border p-2" readOnly value={url} onFocus={e=>e.target.select()}/></label><div className="flex flex-wrap gap-3"><button className="min-h-11 rounded bg-teal-900 px-3 py-2 text-white" onClick={()=>void copy()}>Copy public link</button><a className="p-2 underline" href={url} target="_blank" rel="noreferrer">Open public episode</a></div></>}{message&&<p role="status">{message}</p>}</section>;
}
