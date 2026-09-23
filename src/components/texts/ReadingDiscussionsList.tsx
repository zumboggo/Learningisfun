import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { executeLearningContent } from '@/services/learning-content.service';
import { currentReadingWeek, readingWeek, type ReadingDiscussionListing } from '@/services/reading-discussion.service';
import { Button } from '@/components/common/Button';

export function ReadingDiscussionsList() {
  const [rows, setRows] = useState<ReadingDiscussionListing[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await executeLearningContent<{ readings: ReadingDiscussionListing[] }>({ action: 'listReadingDiscussions' });
      setRows(result.readings); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load readings'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  const classes = new Map<string, { name: string; weeks: Map<string, ReadingDiscussionListing[]> }>();
  for (const row of [...rows].sort((a, b) => a.className.localeCompare(b.className) || b.date.localeCompare(a.date))) {
    const group = classes.get(row.classId) || { name: row.className, weeks: new Map<string, ReadingDiscussionListing[]>() };
    const week = readingWeek(row.date);
    group.weeks.set(week, [...(group.weeks.get(week) || []), row]);
    classes.set(row.classId, group);
  }
  const currentWeek = currentReadingWeek();
  return <section aria-label="Text discussions" className="mb-6 space-y-4">
    <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Classes</h2><Button size="sm" variant="secondary" loading={loading} onClick={() => void refresh()}>Refresh texts</Button></div>
    <p className="text-sm text-slate-500">Choose a class and a reading. Ask a question, then explore the answers together.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!loading && !error && !rows.length && <p className="text-slate-500">Your available assigned texts will appear here.</p>}
    {[...classes].map(([id, group]) => {
      const previous = [...group.weeks].filter(([week]) => week < currentWeek || week === 'Unscheduled');
      const upcoming = [...group.weeks].filter(([week]) => week > currentWeek && week !== 'Unscheduled');
      return <details key={id} className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-semibold text-slate-800">{group.name}</summary>
        <div className="mt-4 space-y-3">
          <details open className="rounded-xl border border-slate-100 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold">Current Week</summary>
            <p className="mt-2 text-xs text-slate-400">Week of {currentWeek}</p>
            <ReadingLinks rows={group.weeks.get(currentWeek) || []} />
            {!group.weeks.get(currentWeek)?.length && <p className="py-3 text-sm text-slate-500">No readings this week.</p>}
            {upcoming.length > 0 && <details className="mt-3 border-t pt-3"><summary className="cursor-pointer text-xs text-slate-500">Upcoming readings</summary>{upcoming.reverse().map(([week, readings]) => <div key={week}><p className="mt-3 text-xs text-slate-400">Week of {week}</p><ReadingLinks rows={readings} /></div>)}</details>}
          </details>
          <details className="rounded-xl border border-slate-100 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold">Previous Weeks</summary>
            <div className="mt-3 space-y-2">{previous.map(([week, readings]) => <details key={week} className="rounded-lg bg-slate-50 px-3 py-2"><summary className="cursor-pointer text-sm text-slate-600">{week === 'Unscheduled' ? week : `Week of ${week}`} · {readings.length} {readings.length === 1 ? 'text' : 'texts'}</summary><ReadingLinks rows={readings} /></details>)}</div>
            {!previous.length && <p className="py-3 text-sm text-slate-500">No previous readings yet.</p>}
          </details>
        </div>
      </details>;
    })}
  </section>;
}

function ReadingLinks({ rows }: { rows: ReadingDiscussionListing[] }) {
  return <div className="divide-y divide-slate-100">{rows.map(row => <Link className="flex min-h-11 items-center justify-between gap-3 py-3 text-sm text-blue-800" key={row.id} to={`/discussions/texts/${row.textId}/${row.classId}`}><span>{row.title}{!row.available && <small className="ml-2 text-slate-500">Teacher preview · not released</small>}</span><span aria-hidden="true">→</span></Link>)}</div>;
}
