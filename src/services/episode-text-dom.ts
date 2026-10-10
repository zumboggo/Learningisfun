export interface TextPatch {original:string;text:string}
export interface TextField {key:string;original:string;text:string;node:Text}
export type TextPatches=Record<string,TextPatch>;
const excluded='tw-storydata,tw-passagedata,#store-area,script,style,noscript,textarea,input,select,output,[contenteditable],.score';
function hash(value:string){let a=2166136261,b=5381;for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b,33)^value.charCodeAt(i);}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
export function connectEpisodeText(doc:Document,getPatches:()=>TextPatches,onFields:(fields:TextField[])=>void){
 const originals=new WeakMap<Text,{original:string;applied:string}>();
 let fields:TextField[]=[];
 const refresh=()=>{
  observer.disconnect();
  const walker=doc.createTreeWalker(doc.body,4);const next:TextField[]=[];
  for(let node=walker.nextNode() as Text|null;node;node=walker.nextNode() as Text|null){
   const parent=node.parentElement;
   if(!parent||parent.closest(excluded)||!node.data.trim()||/^\s*\d+(?:\s*\/\s*\d+)?\s*$/.test(node.data))continue;
   let state=originals.get(node);if(!state||node.data!==state.applied)state={original:node.data,applied:node.data};
   const passage=parent.closest('[data-passage],.passage');
   const path:string[]=[];let el:Element|null=parent;
   while(el&&el!==passage&&el!==doc.body){path.push(el.tagName+':'+Array.from(el.parentElement?.children||[]).indexOf(el));el=el.parentElement;}
   const scope=passage?.getAttribute('data-passage')||passage?.id||'page';
   const key=hash(scope+'|'+path.reverse().join('/')+'|'+Array.from(parent.childNodes).indexOf(node)+'|'+state.original);
   const patch=getPatches()[key];const text=patch?.original===state.original?patch.text:state.original;
   if(node.data!==text)node.data=text;
   state.applied=text;originals.set(node,state);
   // Hidden passages still receive saved changes, but cannot be selected in the editor.
   const details=parent.closest('details:not([open])');
   let visible=!parent.closest('[hidden],[aria-hidden="true"]')&&(!details||!!details.querySelector('summary')?.contains(parent));
   for(let ancestor:Element|null=parent;visible&&ancestor;ancestor=ancestor.parentElement){const style=doc.defaultView?.getComputedStyle(ancestor);if(style?.display==='none'||style?.visibility==='hidden')visible=false;}
   if(visible)next.push({key,original:state.original,text,node});
  }
  fields=next;onFields(fields);observer.observe(doc.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','style','class','aria-hidden','data-init','data-passage']});
 };
 const observer=new MutationObserver(refresh);refresh();
 return {refresh,fields:()=>fields,disconnect:()=>observer.disconnect()};
}
