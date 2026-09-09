export type TextViewMode = 'article' | 'phone';

export function TextViewControls({ mode, onMode, size, onSize, title, paragraphs }: {
  mode: TextViewMode; onMode: (mode: TextViewMode) => void;
  size: number; onSize: (size: number) => void; title: string; paragraphs: string[];
}) {
  const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-40';
  return <div className="flex flex-wrap items-center gap-2" aria-label="Text display and export">
    <button className={button} aria-pressed={mode === 'article'} onClick={() => onMode('article')}>Article Mode</button>
    <button className={button} aria-pressed={mode === 'phone'} onClick={() => onMode('phone')}>Cell Phone Mode</button>
    <button className={button} aria-label="Smaller text" disabled={size <= 16} onClick={() => onSize(Math.max(16, size - 2))}>A−</button>
    <output className="text-sm" aria-label="Font size">{size}px</output>
    <button className={button} aria-label="Larger text" disabled={size >= 56} onClick={() => onSize(Math.min(56, size + 2))}>A+</button>
    <button className={`${button} sm:ml-auto`} disabled={!paragraphs.some(p => p.trim())} onClick={() => downloadReading(title, paragraphs)}>Export .md</button>
  </div>;
}

function downloadReading(title: string, paragraphs: string[]) {
  const blob = new Blob([`# ${title.replace(/[\r\n]+/g, ' ')}\n\n${paragraphs.join('\n\n')}\n`], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = Array.from(title).filter(char => char.charCodeAt(0) >= 32).join('').replace(/[<>:"/\\|?*]/g, '').trim();
  link.download = `${filename.slice(0, 100) || 'reading'}.md`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
