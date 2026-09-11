export interface TextPurpose { isCopywork?: boolean; isAssignedReading?: boolean }
export function TextPurposeControls({value,onChange,disabled=false}:{value:TextPurpose;onChange:(value:TextPurpose)=>void;disabled?:boolean}) {
  return <div className="flex gap-1" role="group" aria-label="Reading purpose">{([{key:'isCopywork',letter:'C',label:'Copywork'},{key:'isAssignedReading',letter:'A',label:'Assigned Reading'}] as const).map(({key,letter,label})=><button key={key} type="button" title={label} aria-label={label} aria-pressed={Boolean(value[key])} disabled={disabled} onClick={()=>onChange({isCopywork:Boolean(value.isCopywork),isAssignedReading:Boolean(value.isAssignedReading),[key]:!value[key]})} className={`h-9 w-9 rounded-lg border-2 font-bold transition-colors disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${value[key]?'border-blue-700 bg-blue-700 text-white':'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'}`}>{letter}</button>)}</div>;
}
export function TextPurposeLabels({value}:{value:TextPurpose}) {
  const labels=[...(value.isCopywork?['Copywork']:[]),...(value.isAssignedReading?['Assigned reading']:[])];
  if(!labels.length)labels.push(value.isCopywork===false||value.isAssignedReading===false?'Optional reading':'Reading');
  return <span className="inline-flex flex-wrap gap-1">{labels.map(label=><span key={label} className={`rounded px-2 py-0.5 text-xs font-medium ${label==='Copywork'?'bg-violet-100 text-violet-900':label==='Assigned reading'?'bg-blue-100 text-blue-900':'bg-slate-100 text-slate-600'}`}>{label}</span>)}</span>;
}
