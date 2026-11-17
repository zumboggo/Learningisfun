import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { WorkshopLink as Link } from '@/components/WorkshopLink';
import { GameLaunchLink } from '@/components/GameLaunchLink';
import { localEntries, readPortfolio } from '@/services/ethics-portfolio.service';
import { executeLearningContent } from '@/services/learning-content.service';
import { readAnimatedLibrary, invalidateAnimatedLibrary } from '@/services/use-animated-library';
import { STONE_CLASS_ID } from '@/services/stone.service';

type MissingReading = { id: string; textId: string; classId: string; title: string; questions: number; replies: number; quoteRequired: boolean; assignedReplies: number };
type NotebookAssignment = { assignmentId: string; classId: string; id: string; title: string; notebookAssigned?: boolean };

const quantity = (count: number, singular: string, plural: string) => count ? count + ' ' + (count === 1 ? singular : plural) : '';

export function CurrentlyMissing({ classId, userId }: { classId: string; userId: string }) {
  const ethics = classId === STONE_CLASS_ID;
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ readings: MissingReading[]; notebooks: NotebookAssignment[]; failed: boolean }>();
  const entries = useLiveQuery(() => ethics ? localEntries(userId, classId) : [], [ethics, userId, classId], []);
  useEffect(() => {
    let active = true, version = 0;
    const load = async () => {
      const current = ++version;
      const [reading, episodes] = await Promise.allSettled([
        executeLearningContent<{ readings: MissingReading[] }>({ action: 'listReadingDiscussions', listingClassId: classId, missingOnly: true }).then(({ readings }) => {
          if (!Array.isArray(readings) || readings.some(row => typeof row.questions !== 'number')) throw Error('Invalid missing work response');
          return readings;
        }),
        ethics ? (async () => {
          const { assignments } = await readAnimatedLibrary(userId, false) as { assignments: NotebookAssignment[] };
          const notebooks = assignments.filter(row => row.classId === classId && row.notebookAssigned === true);
          if (notebooks.length) await readPortfolio(userId, classId);
          return notebooks;
        })() : Promise.resolve([]),
      ]);
      if (!active || current !== version) return;
      setResult(previous => ({
        readings: reading.status === 'fulfilled' ? reading.value : previous?.readings || [],
        notebooks: episodes.status === 'fulfilled' ? episodes.value : previous?.notebooks || [],
        failed: reading.status === 'rejected' || episodes.status === 'rejected',
      }));
    };
    const onRefresh = (event: Event) => {
      if ((event as CustomEvent).detail !== classId) return;
      if (ethics) invalidateAnimatedLibrary(userId);
      void load();
    };
    void load();
    window.addEventListener('class-materials-refreshed', onRefresh);
    window.addEventListener('online', load);
    return () => {
      active = false;
      window.removeEventListener('class-materials-refreshed', onRefresh);
      window.removeEventListener('online', load);
    };
  }, [classId, userId, ethics]);
  // The portfolio keeps one notebook per story across replays and versions.
  const submitted = new Set(entries.flatMap(entry => entry.submitted && !entry.preview && entry.source.kind === 'episode-notes' && entry.source.format === 'animated' ? [entry.source.episode] : []));
  const notebooks = (result?.notebooks || []).filter(row => !submitted.has(row.id));
  const count = (result?.readings.length || 0) + notebooks.length;
  return <section aria-label="Currently Missing">
    <button type="button" aria-expanded={open} aria-controls="currently-missing-work" onClick={() => setOpen(value => !value)} className={`inline-flex min-h-11 items-center gap-2 rounded-t-lg border border-purple-200 px-4 font-semibold text-purple-950 hover:bg-purple-100 ${open ? 'bg-purple-100' : 'bg-purple-50'}`}>
      Currently Missing{result && !result.failed && <span className="rounded-full bg-white px-2 text-sm">{count}</span>}<span aria-hidden="true">{open ? '▴' : '▾'}</span>
    </button>
    <div id="currently-missing-work" hidden={!open} className="rounded-b-xl rounded-tr-xl border border-purple-200 bg-white p-4">
      {!result && <p role="status" className="text-sm text-gray-600">Checking assigned work…</p>}
      {result?.failed && <p role="status" className="mb-2 text-sm text-amber-900">Some assignments couldn’t be checked. Use Refresh class to try again.</p>}
      {result && !result.failed && !count && <p className="text-sm text-gray-600">You’re all caught up.</p>}
      {!!count && <ul className="divide-y divide-purple-100">
        {result?.readings.map(row => <li key={row.id}><Link className="block rounded-md px-2 py-2 hover:bg-purple-50" to={`/discussions/texts/${row.textId}/${row.classId}`}>
          <strong className="block text-purple-950">{row.title}</strong>
          <span className="text-sm text-gray-700">{[
            quantity(row.questions, 'question', 'questions'),
            row.replies ? quantity(row.replies, 'reply', 'replies') + (row.quoteRequired ? ' with a quote' : '') : '',
            quantity(row.assignedReplies, 'assigned reply', 'assigned replies'),
          ].filter(Boolean).join(' · ')} left</span>
        </Link></li>)}
        {notebooks.map(row => <li key={row.assignmentId}><GameLaunchLink className="block rounded-md px-2 py-2 hover:bg-purple-50" to={`/game/play/${row.assignmentId}?notebook=1`}>
          <strong className="block text-purple-950">{row.title}</strong>
          <span className="text-sm text-gray-700">Notebook questions · submit your answers</span>
        </GameLaunchLink></li>)}
      </ul>}
    </div>
  </section>;
}
