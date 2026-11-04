import {useState,type DragEvent} from 'react';

/** The same placement operation serves native drag, touch and keyboard buttons. */
export function CitationBuilder({pieces,italicPieces=[],onChange}:{pieces:string[];italicPieces?:string[];onChange:(answer:string)=>void}){
 const [slots,setSlots]=useState<(number|null)[]>(()=>pieces.map(()=>null));
 const [active,setActive]=useState<number|null>(null);
 function put(id:number,target:number|null){
  const next=[...slots],old=next.indexOf(id);
  if(old!==-1)next[old]=null;
  if(target!==null){const displaced=next[target];if(displaced!==null&&old!==-1)next[old]=displaced;next[target]=id;}
  setSlots(next);setActive(null);onChange(next.every(i=>i!==null)?next.map(i=>pieces[i!]).join(' '):'');
 }
 function drop(event:DragEvent,target:number|null){event.preventDefault();const value=event.dataTransfer.getData('application/x-lesson-piece');if(!/^\d+$/.test(value))return;const id=Number(value);if(id<pieces.length)put(id,target);}
 const token=(id:number)=>italicPieces.includes(pieces[id])?<em>{pieces[id]}</em>:pieces[id];
 const start=(event:DragEvent,id:number)=>{event.dataTransfer.setData('application/x-lesson-piece',String(id));event.dataTransfer.effectAllowed='move';};
 return <div className="citation-builder"><p>Drag each piece into reading order, or select a piece and then its numbered space. Select a placed piece to move it.</p>
 <div aria-label="Citation pieces" className="piece-bank" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,null)}>{pieces.map((_,id)=>slots.includes(id)?null:<button type="button" key={id} draggable aria-pressed={active===id} onDragStart={e=>start(e,id)} onClick={()=>setActive(id)}>{token(id)}</button>)}</div>
 <ol className="piece-slots" aria-label="Citation in reading order">{slots.map((id,i)=><li key={i}><button type="button" aria-label={`${i+1} ${id===null?'Place piece here':pieces[id]}`} draggable={id!==null} onDragStart={e=>id!==null&&start(e,id)} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,i)} aria-pressed={id!==null&&id===active} onClick={()=>{if(active!==null)put(active,i);else if(id!==null)setActive(id);}}><b>{i+1}</b>{id===null?'Place piece here':token(id)}</button></li>)}</ol>
 {active!==null&&<p role="status">Selected: {pieces[active]} {slots.includes(active)&&<button type="button" onClick={()=>put(active,null)}>Return to bank</button>}</p>}
 </div>;
}
