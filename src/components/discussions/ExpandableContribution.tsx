import { useId,useState } from 'react';
import { Markdown } from '@/components/common/Markdown';

import { contributionPreview } from '@/utils/contribution-preview';

export function ExpandableContribution({content,present=false,quote=false,compact=false}:{content:string;present?:boolean;quote?:boolean;compact?:boolean}) {
  const contentId=useId();
  const [expanded,setExpanded]=useState(false);
  const preview=contributionPreview(content);
  const shown=present||expanded?content:preview;
  if(compact&&!present)return <div className="writing-answer-preview">
    <div id={contentId} className={expanded?'writing-answer-full':'writing-answer-excerpt'}><Markdown content={content} className="text-sm leading-relaxed"/></div>
    <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={()=>setExpanded(!expanded)} className="writing-read-more">{expanded?'Show less':'Read More'}</button>
  </div>;
  return <div>{quote?<div className="whitespace-pre-wrap">{shown}</div>:<Markdown content={shown} className={present?'text-2xl leading-relaxed':'text-sm leading-relaxed'}/>}
    {!present&&preview!==content&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)} className="min-h-11 text-sm font-medium text-blue-700 hover:underline">{expanded?'Show less':'Read more'}</button>}
  </div>;
}
