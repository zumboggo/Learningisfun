import { useEffect, useState } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
import { functions } from '@/lib/appwrite';

async function resolveImage(source: string): Promise<string> {
  const match=/^reading-image:([\w-]+):(img_[a-f0-9]{10}_[a-f0-9]{20})$/.exec(source);
  if(!match) {
    if(/^https?:\/\//i.test(source) || /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/i.test(source))return source;
    throw new Error('Unsupported picture address.');
  }
  const body={action:'readReadingImage',textId:match[1],fileId:match[2]};
  try{return (await executeLearningContent<{url:string}>(body)).url;}
  catch {
    const response=await functions.createExecution('public-reading',JSON.stringify(body));
    const result=JSON.parse(response.responseBody||'{}');
    if(response.status==='failed'||response.responseStatusCode>=400||!result.url)throw new Error('Picture unavailable.');
    return result.url;
  }
}
export function ReadingImage({source,alt}:{source:string;alt:string}) {
  const [loaded,setLoaded]=useState<{source:string;url:string}|null>(null);
  const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;void resolveImage(source).then(url=>{if(active){setLoaded({source,url});setFailed(false);}}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[source,attempt]);
  if(failed)return <span className="my-3 block rounded-lg border bg-slate-50 p-3 text-sm">Picture unavailable: {alt || 'Article image'}. <button type="button" className="underline" onClick={()=>{setFailed(false);setAttempt(n=>n+1);}}>Retry</button></span>;
  if(loaded?.source!==source)return <span role="status" className="block py-4 text-sm text-slate-500">Loading picture…</span>;
  return <img src={loaded.url} alt={alt} loading="lazy" referrerPolicy="no-referrer" className="mx-auto my-4 h-auto max-h-[80vh] max-w-full rounded-lg object-contain" onError={()=>setFailed(true)}/>;
}
