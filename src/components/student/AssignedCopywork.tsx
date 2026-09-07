import { useEffect, useState } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
import { Markdown } from '@/components/common/Markdown';

interface AssignedWork {id:string;classId:string;className:string;week:string;date:string;title:string;url:string;content:string;paragraphs:number}
export function AssignedCopywork({classId}:{classId?:string}) {
  const [items,setItems]=useState<AssignedWork[]>([]),[error,setError]=useState('');
  useEffect(()=>{let active=true;const refresh=()=>void executeLearningContent<{copywork:AssignedWork[]}>({action:'readPlanningMaterials',classId}).then(result=>{if(active){setItems(result.copywork);setError('');}}).catch(()=>{if(active)setError('Assigned copywork could not refresh.');});refresh();window.addEventListener('focus',refresh);return()=>{active=false;window.removeEventListener('focus',refresh);};},[classId]);
  if(!items.length&&!error)return null;
  const weeks=[...new Set(items.map(item=>item.week))].sort().reverse();
  return <section id="assigned-copywork" className="my-3 rounded-xl border border-violet-200 bg-violet-50 p-4"><h2 className="font-semibold text-violet-950">Assigned copywork</h2>{error&&<p role="status" className="text-sm">{error}</p>}{weeks.map((week,index)=><details key={week} open={index===0}><summary className="mt-3 cursor-pointer text-sm font-semibold">Week of {week}</summary>{items.filter(item=>item.week===week).map(item=><article key={item.id} className="mt-2 rounded-lg bg-white p-3 text-sm"><p className="text-xs text-slate-500">{item.className} · {item.paragraphs} paragraphs · Due {item.date}</p><h3 className="mt-1 font-semibold">{item.url?<a href={item.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{item.title} ↗</a>:item.title}</h3>{item.content&&<Markdown content={item.content}/>}</article>)}</details>)}</section>;
}
