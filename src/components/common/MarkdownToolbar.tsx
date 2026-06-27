import type { RefObject } from 'react';

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const tools = [
  { label: 'B', title: 'Bold', before: '**', after: '**', fallback: 'bold text' },
  { label: 'I', title: 'Italic', before: '*', after: '*', fallback: 'italic text' },
  { label: 'Quote', title: 'Quote', before: '> ', after: '', fallback: 'quoted idea' },
  { label: 'List', title: 'Bullet list', before: '- ', after: '', fallback: 'first point' },
  { label: 'Link', title: 'Link', before: '[', after: '](https://)', fallback: 'link text' },
];

export function MarkdownToolbar({ textareaRef, value, onChange, className = '' }: MarkdownToolbarProps) {
  const applyTool = (tool: typeof tools[number]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || tool.fallback;
    const next = `${value.slice(0, start)}${tool.before}${selected}${tool.after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + tool.before.length;
      textarea.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  };

  return (
    <div className={`flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-2 py-1.5 ${className}`}>
      {tools.map(tool => (
        <button
          key={tool.title}
          type="button"
          title={tool.title}
          onClick={() => applyTool(tool)}
          className="h-8 rounded px-2 text-xs font-medium text-gray-700 hover:bg-white hover:text-blue-700"
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
