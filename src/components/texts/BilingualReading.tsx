import {useEffect,useState} from 'react';
import {ParagraphCard} from '@/pages/TextReaderPage';
import {getTranslation,reportTranslation,translationLanguages,type TranslationMode,type TranslationPair} from '@/services/text-translation.service';
import type {TextParagraph} from '@/types';
interface Props {onUseQuote?:(quote:{quotation:string;paragraph:number},destination:'question'|'observation'|'reply')=>void;userId:string;textId:string;level:string;paragraphs:TextParagraph[];contents:string[];ready:boolean;available:boolean;compare:boolean;label?:string;fontSize:number;article:boolean}
function preferences(userId:string):{mode:TranslationMode;language:string} {
  try {const p=JSON.parse(localStorage.getItem(`bilingual:${userId}`)||'{}');return {mode:['sentence','paragraph'].includes(p.mode)?p.mode:'off',language:translationLanguages.some(([code])=>code===p.language)?p.language:''};}catch{return {mode:'off',language:''};}
}
export function BilingualReading(props:Props){return <Reading key={props.userId} {...props}/>;}
function Reading({userId,textId,level,paragraphs,contents,ready,available,compare,label,fontSize,article,onUseQuote}:Props) {
  const [settings,setSettings]=useState(()=>preferences(userId)),[query,setQuery]=useState(''),[retry,setRetry]=useState(0);
  const [result,setResult]=useState<{key:string;rows:Record<string,TranslationPair[]>;error:string;busy:boolean}>({key:'',rows:{},error:'',busy:false});
  const [report,setReport]=useState('');
  const {mode,language}=settings;
  const context=JSON.stringify(paragraphs.map((p,i)=>[p.$id,contents[i]]));
  const requestKey=JSON.stringify([textId,level,language,context]);
  const enabled=mode!=='off'&&Boolean(language)&&ready&&available&&article;
  useEffect(()=>{try{localStorage.setItem(`bilingual:${userId}`,JSON.stringify(settings));}catch{/* Reading remains usable without storage. */}},[settings,userId]);
  useEffect(()=>{
    if(!enabled)return;
    let active=true;
    setResult({key:requestKey,rows:{},error:'',busy:true});
    void (async()=>{
      const source=JSON.parse(context) as [string,string][];
      try {
        for(const [paragraphId,content] of source) {
          if(!active)return;
          const pairs=await getTranslation({textId,level,language,paragraphId,content},context,()=>active);
          if(!active)return;
          setResult(previous=>({...previous,rows:{...previous.rows,[paragraphId]:pairs}}));
        }
        if(active)setResult(previous=>({...previous,busy:false}));
      }catch(cause){if(active)setResult(previous=>({...previous,busy:false,error:cause instanceof Error?cause.message:'Translation unavailable'}));}
    })();
    return()=>{active=false;};
  },[enabled,requestKey,context,textId,level,language,retry]);
  const current=result.key===requestKey?result:undefined;
  return <>
    <section aria-label="Bilingual reading" className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="font-semibold">Read with your language</p>
      <div className="flex flex-wrap gap-2">{(['off','paragraph','sentence'] as const).map(value=><button key={value} aria-pressed={mode===value} className={`min-h-11 rounded-lg border px-4 py-2 ${mode===value?'bg-blue-700 text-white':'bg-white text-slate-900'}`} onClick={()=>setSettings(s=>({...s,mode:value}))}>{value==='off'?'Off':value==='paragraph'?'Paragraph Mode':'Sentence Mode'}</button>)}</div>
      <div className="flex flex-wrap items-center gap-3"><label>Find language <input className="ml-2 max-w-48 rounded border bg-white p-2" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search languages"/></label><label>Your language <select className="ml-2 max-w-full rounded border bg-white p-2" value={language} onChange={e=>{setSettings(s=>({...s,language:e.target.value,mode:s.mode==='off'?'paragraph':s.mode}));setReport('');}}><option value="">Choose language</option>{translationLanguages.filter(([code,name])=>code===language||`${code} ${name}`.toLowerCase().includes(query.toLowerCase())).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label></div>
      {!available||!article?<p>Bilingual modes need saved article text. Choose Article Mode when available.</p>:mode!=='off'&&!language?<p>Choose your language to show translations.</p>:mode!=='off'&&!ready?<p>Create the selected English support version below first.</p>:null}
      {mode!=='off'&&<p className="text-sm text-slate-700">English first, your language below. Translations are AI-generated. Write your questions and observations in English.</p>}
      {enabled&&current?.busy&&<p role="status">Preparing translation… English remains available.</p>}
      {enabled&&current?.error&&<div role="alert">{current.error} <button className="min-h-11 rounded border bg-white px-3" onClick={()=>setRetry(n=>n+1)}>Retry translation</button></div>}
      {report&&<p role="status">{report}</p>}
    </section>
    {article&&available&&ready&&<main aria-label="Reading text" className="reader-paper mx-auto max-w-[76ch] space-y-8 rounded-2xl bg-white px-7 py-6 text-slate-900 sm:px-12 sm:py-8" style={{fontSize}}>{paragraphs.map((paragraph,index)=><div id={`paragraph-${index+1}`} key={paragraph.$id} className="reader-prose scroll-mt-8">
      {level!=='original'&&compare&&<ParagraphCard onUseQuote={onUseQuote} paragraph={paragraph} index={index} label="Original"/>}
      <ParagraphCard onUseQuote={onUseQuote} paragraph={{...paragraph,content:contents[index]}} index={index} label={label} pairs={enabled?current?.rows[paragraph.$id]:undefined} translationMode={mode} language={language}/>
      {enabled&&current?.rows[paragraph.$id]&&<button className="min-h-11 text-sm text-slate-600 underline" onClick={()=>{setReport('Sending report…');void reportTranslation({textId,level,language,paragraphId:paragraph.$id,content:contents[index]}).then(()=>setReport('Translation flagged for review. Thank you.')).catch(()=>setReport('Could not send the report. Please try again when connected.'));}}>Translation seems wrong · paragraph {index+1}</button>}
    </div>)}</main>}
  </>;
}
