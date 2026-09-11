export function textShareContent(id:string,title:string,base=window.location.href) {
  const url=new URL(base); url.search=''; url.hash=`/texts/${encodeURIComponent(id)}`;
  const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  return {url:url.href,plain:`${title}\n${url.href}`,html:`<a href="${escape(url.href)}">${escape(title)}</a>`};
}
export async function copyTextLink(id:string,title:string) {
  const content=textShareContent(id,title);
  if(navigator.clipboard?.write && typeof ClipboardItem!=='undefined'){
    try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([content.html],{type:'text/html'}),'text/plain':new Blob([content.plain],{type:'text/plain'})})]);return;}catch{/* Plain-text fallback for browsers that restrict rich clipboard writes. */}
  }
  await navigator.clipboard.writeText(content.plain);
}
export function sharedReadingDestination(state:unknown):string|undefined {
  const path=(state as {from?:unknown}|null)?.from;
  return typeof path==='string' && /^\/texts\/[^/?#]+$/.test(path)?path:undefined;
}
