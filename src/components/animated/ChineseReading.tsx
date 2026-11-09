import {useState} from 'react';
export interface ChineseLine {pinyin:string;english:string;interlinear:{chinese:string;pinyin:string;gloss:string}[]}
export interface ChineseSupport {recordedLines?:string[];lines:Record<string,ChineseLine>;audio:Record<string,string>;intro?:{poster:string;video:string;line:string;actor:string}}
export function ChineseReading({text,line,pinyin,gloss,interactive=false}:{text:string;line?:ChineseLine;pinyin:boolean;gloss:boolean;interactive?:boolean}){
 return <span className="mandarin-line" lang="zh-CN">{(line?.interlinear||[{chinese:text,pinyin:'',gloss:''}]).map((chunk,i)=><Chunk key={text+i} chunk={chunk} pinyin={pinyin} gloss={gloss} interactive={interactive}/>)}</span>;
}
function Chunk({chunk,pinyin,gloss,interactive}:{chunk:ChineseLine['interlinear'][number];pinyin:boolean;gloss:boolean;interactive:boolean}){
 const [revealed,setRevealed]=useState(false);
 const content=<>{(pinyin||revealed)&&<span lang="zh-Latn" className="mandarin-pinyin">{chunk.pinyin}</span>}<strong>{chunk.chinese}</strong>{(gloss||revealed)&&<span lang="en" className="mandarin-gloss">{chunk.gloss}</span>}</>;
 return interactive&&(!pinyin||!gloss)?<button type="button" className="mandarin-chunk" aria-label={`Reveal meaning: ${chunk.chinese}`} aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}>{content}</button>:<span className="mandarin-chunk">{content}</span>;
}
