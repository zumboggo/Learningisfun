export function ResourceTitleField({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <label className="block text-sm font-medium">Title<input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Title" value={value} onChange={e=>onChange(e.target.value)}/></label>;
}
export function ResourceLinkField({value,onChange,label='Source (optional link)',allowFileReference=false}:{value:string;onChange:(value:string)=>void;label?:string;allowFileReference?:boolean}) {
  return <label className="block text-sm font-medium">{label}<input type={allowFileReference?'text':'url'} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://…" value={value} onChange={e=>onChange(e.target.value)}/></label>;
}
