import { useEffect, useState } from 'react';
import type { Class } from '@/types';
import { db } from '@/db/schema';
import { executeLearningContent } from '@/services/learning-content.service';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

type Banner = {fileId: string; x: number; y: number};
function parseBanner(value?: string): Banner | null {
  try { return JSON.parse(value || 'null'); } catch { return null; }
}
function useBannerUrl(cls: Class) {
  const [image, setImage] = useState({key:'',url:''});
  const key = `${cls.$id}:${cls.bannerJson || ''}`;
  useEffect(() => {
    let active = true;
    if (parseBanner(cls.bannerJson)) executeLearningContent<{url:string}>({action:'readClassBanner',classId:cls.$id})
      .then(result => { if(active) setImage({key,url:result.url}); }).catch(()=>{});
    return () => { active = false; };
  }, [cls.$id, cls.bannerJson, key]);
  return image.key === key ? image.url : '';
}
export function ClassBanner({cls, editable=false, mini=false}: {cls:Class; editable?:boolean; mini?:boolean}) {
  const [editing,setEditing]=useState(false);
  const banner=parseBanner(cls.bannerJson);
  const url=useBannerUrl(cls);
  if(mini) return banner ? <div className="h-6 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">{url && <img src={url} alt="" className="h-full w-full object-cover" style={{objectPosition:`${banner.x}% ${banner.y}%`}} />}</div> : null;
  return <>
    {(banner || editable) && <div className="space-y-2">
      {banner && <div className="aspect-[4/1] overflow-hidden rounded-2xl bg-gray-100">{url && <img src={url} alt={`${cls.courseName} class banner`} className="h-full w-full object-cover" style={{objectPosition:`${banner.x}% ${banner.y}%`}} />}</div>}
      {editable && <Button variant="secondary" size="sm" onClick={()=>setEditing(true)}>{banner ? 'Edit banner' : 'Add banner'}</Button>}
    </div>}
    {editing && <BannerEditor cls={cls} initialUrl={url} onClose={()=>setEditing(false)} />}
  </>;
}
async function prepareImage(file:File):Promise<string> {
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type) || file.size>20*1024*1024) throw new Error('Choose a JPEG, PNG, WebP or GIF under 20 MB.');
  const bitmap=await createImageBitmap(file);
  try {
    const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Could not prepare this image.');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const source=canvas.toDataURL('image/jpeg',0.82);
    if(source.length>1500000)throw new Error('This image is too detailed. Please choose a smaller image.');
    return source;
  } finally {bitmap.close();}
}
function BannerEditor({cls,initialUrl,onClose}:{cls:Class;initialUrl:string;onClose:()=>void}) {
  const banner=parseBanner(cls.bannerJson);
  const [source,setSource]=useState('');
  const [x,setX]=useState(banner?.x??50),[y,setY]=useState(banner?.y??50);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const preview=source||initialUrl;
  async function save(remove=false) {
    setBusy(true);setError('');
    try {
      const result=await executeLearningContent<{bannerJson:string}>({action:'saveClassBanner',classId:cls.$id,x,y,remove,...(source?{source}:{})});
      await db.classes.update(cls.$id,{bannerJson:result.bannerJson});onClose();
    } catch(cause) {setError(cause instanceof Error?cause.message:'Could not save banner. Try again.');}
    finally {setBusy(false);}
  }
  return <Modal open title="Class banner" panelClassName="sm:max-w-2xl" onClose={()=>{if(!busy)onClose();}}>
    <div className="space-y-4">
      <label className="block text-sm font-medium">Upload image<input className="mt-2 block w-full" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={async event=>{
        const file=event.target.files?.[0];event.target.value='';if(!file)return;
        setBusy(true);setError('');try{setSource(await prepareImage(file));setX(50);setY(50);}catch(cause){setError(cause instanceof Error?cause.message:'Could not open image.');}finally{setBusy(false);}
      }}/></label>
      <p className="text-sm text-gray-500">Choose an image up to 20 MB. Use the sliders to reposition the crop.</p>
      {preview && <>
        <div className="aspect-[4/1] overflow-hidden rounded-xl bg-gray-100"><img src={preview} alt="Banner crop preview" className="h-full w-full object-cover" style={{objectPosition:`${x}% ${y}%`}} /></div>
        <label className="block text-sm">Horizontal position<input className="block w-full" type="range" min="0" max="100" value={x} disabled={busy} onChange={event=>setX(Number(event.target.value))}/></label>
        <label className="block text-sm">Vertical position<input className="block w-full" type="range" min="0" max="100" value={y} disabled={busy} onChange={event=>setY(Number(event.target.value))}/></label>
      </>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {banner && <Button variant="secondary" disabled={busy} onClick={()=>void save(true)}>Remove banner</Button>}
        <Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button loading={busy} disabled={!preview||busy} onClick={()=>void save()}>Save banner</Button>
      </div>
    </div>
  </Modal>;
}
