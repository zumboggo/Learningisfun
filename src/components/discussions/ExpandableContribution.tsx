import { useState } from 'react';
import { Markdown } from '@/components/common/Markdown';

import { contributionPreview } from '@/utils/contribution-preview';

export function ExpandableContribution({content,present=false,quote=false}:{content:string;present?:boolean;quote?:boolean}) {
  const [expanded,setExpanded]=useState(false);
  const preview=contributionPreview(content);
  const shown=present||expanded?content:preview;
  return <div>{quote?<div className="whitespace-pre-wrap">{shown}</div>:<Markdown content={shown} className={present?'text-2xl leading-relaxed':'text-sm leading-relaxed'}/>}
    {!present&&preview!==content&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)} className="min-h-11 text-sm font-medium text-blue-700 hover:underline">{expanded?'Show less':'Read more'}</button>}
  </div>;
}
