import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {enterGameFullscreen,exitGameFullscreen,prefersGameFullscreen,saveGameDisplay} from '@/services/game-display';

export function GameDisplay({userId,children}:{userId:string;children:ReactNode}) {
  const [expanded,setExpanded]=useState(()=>prefersGameFullscreen(userId));
  const [native,setNative]=useState(!!document.fullscreenElement);
  const [notice,setNotice]=useState('');
  const mounted=useRef(false);
  const hadNative=useRef(!!document.fullscreenElement);
  useEffect(()=>{
    mounted.current=true;
    const changed=()=>{const active=!!document.fullscreenElement;setNative(active);if(active)setExpanded(true);else if(hadNative.current)setExpanded(false);hadNative.current=active;};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!document.fullscreenElement)setExpanded(false);};
    document.addEventListener('fullscreenchange',changed);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('fullscreenchange',changed);document.removeEventListener('keydown',escape);mounted.current=false;queueMicrotask(()=>{if(!mounted.current)void exitGameFullscreen();});};
  },[]);
  useEffect(()=>{
    if(!expanded)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const chrome=Array.from(document.querySelectorAll<HTMLElement>('[data-app-chrome]')).map(element=>({element,inert:element.inert}));
    chrome.forEach(({element})=>{element.inert=true;});
    return()=>{document.body.style.overflow=previous;chrome.forEach(({element,inert})=>{element.inert=inert;});};
  },[expanded]);
  const windowed=()=>{saveGameDisplay(userId,false);setExpanded(false);setNotice('');void exitGameFullscreen();};
  const fullscreen=async()=>{saveGameDisplay(userId,true);setExpanded(true);setNotice('');if(!await enterGameFullscreen())setNotice('Fullscreen is unavailable here. The game fills this window instead.');};
  return <section aria-label="Game player" className={expanded?'game-display-expanded fixed inset-0 z-50 flex flex-col bg-stone-50':'game-display-windowed'}>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white px-3 py-2 text-sm" style={{paddingTop:'max(.5rem, env(safe-area-inset-top))'}}>
      <Link className="rounded-lg px-3 py-2 font-semibold text-teal-900" to="/game" onClick={()=>void exitGameFullscreen()}>← The Game</Link>
      <div className="flex flex-wrap gap-2">
        {!native&&<button className="min-h-11 rounded-lg bg-teal-900 px-3 py-2 font-semibold text-white" onClick={()=>void fullscreen()}>Full screen</button>}
        {(expanded||native)&&<button className="min-h-11 rounded-lg border border-stone-300 px-3 py-2" onClick={windowed}>{native?'Exit full screen':'Play in browser window'}</button>}
      </div>
      {notice&&<p role="status" className="w-full text-xs text-gray-600">{notice}</p>}
    </div>
    <div className={expanded?'game-display-content min-h-0 flex-1 overflow-auto':'game-window-content'}>{children}</div>
  </section>;
}
