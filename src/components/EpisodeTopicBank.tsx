import {useId,useState,type ReactNode} from 'react';
export interface TopicEntry {id:string;topic:string;order:number;content:ReactNode}
export function EpisodeTopicBank({entries}:{entries:TopicEntry[]}) {
 const topics=[...new Set(entries.map(e=>e.topic))];
 return <section aria-label="Episode topics" className="space-y-3">{topics.map(topic=><Topic key={topic} title={topic} entries={entries.filter(e=>e.topic===topic).sort((a,b)=>a.order-b.order)}/>)}</section>;
}
function Topic({title,entries}:{title:string;entries:TopicEntry[]}) {
 const [open,setOpen]=useState(false),id=useId();
 return <section className="overflow-hidden rounded-2xl border border-orange-300"><h2><button type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)} className="flex min-h-16 w-full items-center justify-between gap-4 bg-orange-50 p-5 text-left font-bold text-orange-950"><span>{title}{' '}<span className="ml-3 text-sm font-normal">{entries.length} {entries.length===1?'episode':'episodes'}</span></span><span aria-hidden="true">{open?'−':'+'}</span></button></h2><div id={id} hidden={!open} className="grid gap-3 p-4 sm:grid-cols-2">{entries.map(e=><div key={e.id}>{e.content}</div>)}</div></section>;
}
