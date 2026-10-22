import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** Native modal focus containment and Escape, independent of story progress. */
export default function StoryPanel({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current,previous=document.activeElement as HTMLElement|null;if(!dialog)return;
  dialog.showModal();
  return()=>{dialog.close();previous?.focus();};
 },[]);
 return createPortal(<dialog ref={ref} className="cinema-panel" aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)onClose();}}}>
  <header><h2>{title}</h2><button onClick={onClose} aria-label={`Close ${title}`}>Close <span aria-hidden="true">×</span></button></header>
  <div className="cinema-panel-content">{children}</div>
 </dialog>,document.body);
}
