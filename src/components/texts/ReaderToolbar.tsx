import type { ReactNode } from 'react';
export type ReaderPanel = 'tqe'|'support'|'notes'|'more'|null;
export function ReaderToolbar({mode,panel,onArticle,onOriginal,onPanel,size,onSize,children}:{mode:'article'|'original'|'annotate';panel:ReaderPanel;onArticle:()=>void;onOriginal:()=>void;onPanel:(panel:ReaderPanel)=>void;size:number;onSize:(size:number)=>void;children?:ReactNode}) {
  const button='min-h-11 shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ';
  const style=(active:boolean)=>button+(active?'border-blue-200 bg-blue-50 text-blue-800':'border-slate-200 bg-white text-slate-700 hover:bg-slate-50');
  return <section aria-label="Reading options" className="reader-toolbar">
    <div className="flex flex-wrap items-center gap-2">
      <button className={style(mode==='article'&&!panel)} aria-pressed={mode==='article'&&!panel} onClick={onArticle}>Article Mode</button>
      <button className={style(mode==='original')} aria-pressed={mode==='original'} onClick={onOriginal}>Original Text</button>
      {(['tqe','support','notes','more'] as const).map(key=><button key={key} className={style(panel===key)} aria-expanded={panel===key} aria-controls="reader-options-panel" onClick={()=>onPanel(panel===key?null:key)}>{key==='tqe'?'TQE':key[0].toUpperCase()+key.slice(1)} <span aria-hidden="true">{panel===key?'⌃':'⌄'}</span></button>)}
      <div className="ml-auto flex items-center gap-1"><button aria-label="Smaller text" className={style(false)} disabled={size<=16||mode==='original'} onClick={()=>onSize(Math.max(16,size-2))}>A−</button><output aria-label="Font size" className="sr-only">{size}px</output><button aria-label="Larger text" className={style(false)} disabled={size>=56||mode==='original'} onClick={()=>onSize(Math.min(56,size+2))}>A+</button></div>
    </div>
    {panel&&<div id="reader-options-panel" className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">{children}</div>}
  </section>;
}
