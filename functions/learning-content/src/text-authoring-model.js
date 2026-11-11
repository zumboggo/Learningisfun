export const LENGTHS={short:[600,800],standard:[1000,1200],extended:[1500,1800]};
export function lengthRange(brief){return brief.length==='custom'?[brief.customWords,brief.customWords]:LENGTHS[brief.length]||LENGTHS.standard;}
export function proseWords(content){return String(content||'').replace(/^#{1,6}\s.*$/gm,'').replace(/!\[[^\]]*\]\([^)]+\)/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').match(/[\p{L}\p{N}]+(?:['’’-][\p{L}\p{N}]+)*/gu)?.length||0;}
export function newTextDraft(){return {brief:{topic:'',audience:'',length:'standard',customWords:1100,illustrations:4,course:'',week:'',vocabulary:'',source:'',preferences:'',historical:false},messages:[],title:'',author:'',content:'',contentMode:'full',externalUrl:'',scenes:[],sources:[],research:null,reviewed:false,guidanceVersion:'2026-11-09.1'};}
export function readingParagraphs(v,textId,resolve=fileId=>`reading-image:${textId}:${fileId}`){
 const blocks=v.content.replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),out=[];
 for(let i=0;i<blocks.length;i++){out.push(blocks[i].replace(/reading-image:[\w-]+:(img_[a-f0-9]{10}_[a-f0-9]{20})/g,(_,fileId)=>resolve(fileId)));for(const s of v.scenes.filter(s=>!s.omitted&&s.fileId&&s.after===i))out.push(`![${s.alt.replace(/[\[\]\n]/g,' ')}](${resolve(s.fileId)})\n\n*${s.caption}*`);}
 if(v.sources.length)out.push('### Sources',...v.sources.map(s=>`[${s.title.replace(/[\[\]]/g,'')}](${s.url})`));return out;
}
