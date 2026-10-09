import {useEffect, useRef, useState, type RefObject} from 'react';
import {EpisodeAudio} from '@/services/episode-audio';

export default function EpisodeSound({trackUrl, iframeRef, frameKey}:{trackUrl:string;iframeRef:RefObject<HTMLIFrameElement|null>;frameKey:number}) {
  const controller = useRef<EpisodeAudio|null>(null);
  const request = useRef(0);
  const [enabled,setEnabled] = useState(false), [loading,setLoading] = useState(false);
  const [volume,setVolume] = useState(30), [error,setError] = useState('');
  useEffect(() => {
    const audio = new EpisodeAudio(trackUrl);controller.current=audio;
    const mute = () => {++request.current;audio.mute();setEnabled(false);setLoading(false);};
    const visibility = () => {if(document.hidden)mute();};
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('pagehide',mute);
    return () => {++request.current;audio.dispose();controller.current=null;document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',mute);};
  },[trackUrl]);
  useEffect(() => {
    const iframe=iframeRef.current;let doc:Document|null=null;
    const click=(event:MouseEvent)=>{
      const target=event.target as Element|null;
      // Use DOM shape, not instanceof: iframe elements belong to a different realm.
      const control=target?.closest?.('button,summary,a[role="button"],a.link-internal');
      if(control&&!control.hasAttribute('disabled')&&control.getAttribute('aria-disabled')!=='true')controller.current?.click();
    };
    const attach=()=>{doc?.removeEventListener('click',click,true);try{doc=iframe?.contentDocument||null;doc?.addEventListener('click',click,true);}catch{doc=null;}};
    attach();iframe?.addEventListener('load',attach);
    return()=>{doc?.removeEventListener('click',click,true);iframe?.removeEventListener('load',attach);};
  },[iframeRef,frameKey]);
  const toggle=async()=>{
    const audio=controller.current;if(!audio)return;
    const id=++request.current;setError('');
    if(enabled||loading){audio.mute();setEnabled(false);setLoading(false);return;}
    setLoading(true);audio.setVolume(volume/100);
    try{const playing=await audio.enable();if(id===request.current)setEnabled(playing);}
    catch{if(id===request.current){audio.mute();setEnabled(false);setError('Sound unavailable. Keep playing silently, or try again when connected.');}}
    finally{if(id===request.current)setLoading(false);}
  };
  return <section aria-label="Episode sound" className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-stone-300 bg-stone-50 p-3 text-sm">
    <button type="button" aria-pressed={enabled} onClick={()=>void toggle()} className="min-h-11 rounded-lg border border-teal-800 px-4 py-2 font-semibold text-teal-950">{loading?'Cancel sound loading':enabled?'Sound on':'Sound off'}</button>
    <label className="flex items-center gap-2">Volume <input aria-label="Sound volume" type="range" min="0" max="100" value={volume} onChange={e=>{const value=Number(e.target.value);setVolume(value);controller.current?.setVolume(value/100);}} className="h-11 w-28"/></label>
    <span className="text-xs text-gray-600">Music and button sounds · off by default</span>
    {error&&<p role="status" className="w-full text-xs text-gray-700">{error}</p>}
  </section>;
}
