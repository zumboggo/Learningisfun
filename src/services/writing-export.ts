export interface WritingExportPost {id:string;parentId:string|null;label:string;content:string;createdAt:string;name?:string}
export interface WritingExport {prompt:string;className:string;date:string;posts:WritingExportPost[]}
const cell=(value:string)=>`"${(/^[\s]*[=+@-]/.test(value)?"'":"")+value.replace(/"/g,'""')}"`;
export function formatWritingExport(data:WritingExport,format:'txt'|'csv',names:boolean):string {
  if(format==='txt')return `${data.className}\n${data.date}\n\n${data.prompt}\n\n`+data.posts.map(p=>`${p.label}${names&&p.name?` — ${p.name}`:''}\nID: ${p.id}${p.parentId?` · Reply to: ${p.parentId}`:''}\n${p.createdAt}\n${p.content}`).join('\n\n---\n\n');
  const header=['Class','Date','Prompt','ID','Parent ID','Label',...(names?['Student name']:[]),'Submitted at','Response'];
  return '\uFEFF'+[header,...data.posts.map(p=>[data.className,data.date,data.prompt,p.id,p.parentId||'',p.label,...(names?[p.name||'']:[]),p.createdAt,p.content])].map(row=>row.map(cell).join(',')).join('\r\n');
}
