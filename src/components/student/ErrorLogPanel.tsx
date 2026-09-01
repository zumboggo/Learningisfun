import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { newErrorLogEntry, refreshErrorLog, saveErrorLog, type WritingErrorLogEntry } from '@/services/error-log.service';

export function ErrorLogPanel({ userId }: { userId: string }) {
  const [rows, setRows] = useState<WritingErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    void refreshErrorLog(userId).then(value => { if (active) setRows(value); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const update = (id: string, field: 'problem' | 'fix', value: string) => {
    setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
    setDirty(true); setMessage('');
  };
  const addRow = () => { if (rows.length >= 50) return; setRows(current => [...current, newErrorLogEntry()]); setDirty(true); setMessage(''); };
  const removeRow = (id: string) => { setRows(current => current.filter(row => row.id !== id)); setDirty(true); setMessage(''); };
  const save = async () => {
    setSaving(true); setMessage('');
    const result = await saveErrorLog(userId, rows);
    setRows(result.rows); setDirty(false);
    setMessage(result.synced ? 'Error log saved.' : 'Saved on this device. Account sync will be available when the connection returns.');
    setSaving(false);
  };

  return <section className="student-section" aria-labelledby="error-log-heading">
    <div className="student-section-head"><div><h2 id="error-log-heading" className="student-title">Error Log</h2><p className="student-subtitle">Notice recurring writing habits, then keep the fix close at hand.</p></div><span className="text-xs font-semibold text-slate-400">{rows.length}/50</span></div>
    <div className="student-card overflow-hidden">
      <div className="border-b border-slate-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950"><p><strong>Problem:</strong> “I join two sentences with a comma when I get excited.”</p><p><strong>Fix:</strong> “Use a semicolon or split them into two sentences.”</p></div>
      {loading ? <p className="p-4 text-sm text-slate-400">Loading your error log…</p> : <div className="divide-y divide-slate-100">
        {rows.map((row, index) => <div key={row.id} className="grid gap-2 p-3 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem] sm:items-start">
          <span className="hidden pt-2 text-center text-xs font-bold text-slate-400 sm:block">{index + 1}</span>
          <label className="text-xs font-semibold text-slate-500"><span className="sm:hidden">Problem</span><textarea rows={2} maxLength={500} value={row.problem} onChange={event => update(row.id, 'problem', event.target.value)} className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal leading-5 text-slate-800" placeholder="What mistake or habit keeps recurring?" /></label>
          <label className="text-xs font-semibold text-slate-500"><span className="sm:hidden">Fix</span><textarea rows={2} maxLength={500} value={row.fix} onChange={event => update(row.id, 'fix', event.target.value)} className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal leading-5 text-slate-800" placeholder="What will you try next time?" /></label>
          <button type="button" className="justify-self-end rounded-lg px-3 py-2 text-lg text-red-500 hover:bg-red-50" aria-label={`Delete error log row ${index + 1}`} onClick={() => removeRow(row.id)}>×</button>
        </div>)}
        {!rows.length && <p className="p-5 text-center text-sm text-slate-500">Your log is empty. Add a pattern you want to notice, or send an AI feedback suggestion here.</p>}
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-3"><Button size="sm" variant="secondary" disabled={rows.length >= 50} onClick={addRow}>+ Add row</Button><div className="flex items-center gap-3">{message && <span role="status" className="max-w-xs text-right text-xs text-slate-500">{message}</span>}<Button size="sm" loading={saving} disabled={!dirty} onClick={() => void save()}>Save</Button></div></div>
    </div>
  </section>;
}
