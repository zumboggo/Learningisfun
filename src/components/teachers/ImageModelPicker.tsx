import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {executeLearningContent as call} from '@/services/learning-content.service';
export type ImageChoice={modelId:string;expectedBilling:'personal'|'shared';price:number;enabled:boolean};
type Catalog={billing:'personal'|'shared';ceiling:number;available:boolean;models:{id:string;label:string;price:number;enabled:boolean}[]};
export default function ImageModelPicker({onChange,count=1}:{onChange:(choice:ImageChoice)=>void;count?:number}){
 const [catalog,setCatalog]=useState<Catalog>(),[selected,setSelected]=useState('schnell'),[error,setError]=useState('');
 useEffect(()=>{void call<Catalog>({action:'readImageModels'}).then(setCatalog).catch(e=>setError(e.message));},[]);
 const model=catalog?.models.find(m=>m.id===selected);
 useEffect(()=>{if(model&&catalog)onChange({modelId:model.id,price:model.price,enabled:model.enabled,expectedBilling:catalog.billing});},[model,catalog,onChange]);
 return <div className="space-y-2"><label>Image quality<select aria-label="Image quality" value={selected} disabled={!catalog} onChange={e=>setSelected(e.target.value)}>{catalog?.models.map(m=><option key={m.id} value={m.id}>{m.label} · ${m.price.toFixed(3)}{!m.enabled?' · unavailable':''}</option>)}</select></label>{model&&catalog&&<><p>{count} image{count===1?'':'s'} · ${model.price.toFixed(3)} each · ${(model.price*count).toFixed(3)} total · {catalog.billing==='personal'?'your personal Replicate account':'included AI allowance'}</p>{!model.enabled&&<p role="status">This model needs an available connection, verified pricing, and a sufficient image ceiling.</p>}<p className="text-sm">Ceiling: ${catalog.ceiling.toFixed(3)} per request. <Link to="/settings">Manage AI & billing</Link>. Regeneration is a new paid request.</p></>}{error&&<p role="alert">{error}</p>}</div>;
}
