import {Modal} from '@/components/common/Modal';
import {CopyButton} from '@/components/common/CopyButton';
import {resourceTitle} from '@/services/planner-appearance';
import type {LessonSlot} from '@/services/unit-planning';

export function PlannerCardPreview({item,onClose,onEdit,onPlace}:{item:LessonSlot|null;onClose:()=>void;onEdit:()=>void;onPlace:()=>void}) {
 const text=item?[resourceTitle(item),item.content,item.url].filter(Boolean).join('\n\n'):'';
 return <Modal open={Boolean(item)} onClose={onClose} title="Planning card" panelClassName="sm:max-w-2xl">
   {item&&<div className="space-y-4">
     <p className="text-xs uppercase text-slate-500">{item.kind}</p>
     <h3 className="select-text break-words font-serif text-2xl">{resourceTitle(item)}</h3>
     {item.content?<p className="select-text whitespace-pre-wrap break-words leading-relaxed">{item.content}</p>:<p className="text-sm text-slate-500">This card has a title only; no additional description has been added.</p>}
     {item.url&&<a className="break-all text-blue-700 underline" href={/^https?:\/\//i.test(item.url)?item.url:undefined} target="_blank" rel="noreferrer">{item.url}</a>}
     <div className="flex flex-wrap gap-2">
       <CopyButton key={item.id} text={text} label="Copy card text"/>
       <button className="rounded-lg border px-3 py-2 text-sm" onClick={onPlace}>Add to a lesson</button>
       <button className="rounded-lg border px-3 py-2 text-sm" onClick={onEdit}>Edit card</button>
     </div>
   </div>}
 </Modal>;
}
