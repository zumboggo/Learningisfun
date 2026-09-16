import { validOptionalSourceLink } from '@/utils/source-link';
export function LinkToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-expanded={open} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50" title="Add a supporting link"><span aria-hidden="true">🔗</span>{open ? 'Hide link' : 'Add link'}</button>;
}

export function SourceLinkFields({ title, url, onTitleChange, onUrlChange }: { title: string; url: string; onTitleChange: (value: string) => void; onUrlChange: (value: string) => void }) {
  const valid = validOptionalSourceLink(title, url);
  return <div className="mt-2 grid gap-2 rounded-lg bg-blue-50 p-2 sm:grid-cols-2"><label className="text-[11px] font-medium text-gray-600">Page title<input value={title} onChange={event => onTitleChange(event.target.value)} maxLength={255} placeholder="Article or page title" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm" /></label><label className="text-[11px] font-medium text-gray-600">Link<input type="url" value={url} onChange={event => onUrlChange(event.target.value)} maxLength={2048} placeholder="https://…" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm" /></label>{!valid && <p className="text-xs text-red-600 sm:col-span-2">Add both a title and a complete http or https link.</p>}</div>;
}

export function SourceLink({ title, url }: { title?: string; url?: string }) {
  if (!title || !url || !validOptionalSourceLink(title, url)) return null;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-blue-700 hover:underline"><span aria-hidden="true">🔗</span><span className="truncate">{title}</span></a>;
}
