export function TextSource({source,url}:{source?:string;url?:string}) {
  const candidate=url?.trim()||source?.trim()||'';
  let href='';try {const parsed=new URL(candidate);if(['https:','http:'].includes(parsed.protocol))href=parsed.href;}catch{/* A source name need not be a URL. */}
  if(!source&&!href)return null;
  return <p className="mt-2 text-sm text-slate-600">{source&&<span>{source}{href?' · ':''}</span>}{href&&<a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline">Read original source ↗</a>}</p>;
}
