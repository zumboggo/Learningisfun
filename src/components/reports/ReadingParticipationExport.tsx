import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { downloadCsv } from '@/services/report.service';
import { exportReadingParticipation, type ParticipationStudent } from '@/services/reading-participation-export';

export function ReadingParticipationExport({ classId, className, students }: { classId: string; className: string; students: ParticipationStudent[] }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const run = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const csv = await exportReadingParticipation(classId, className, students);
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
      downloadCsv(`${className.replace(/[^\p{L}\p{N}_-]+/gu, '-')}-text-participation-${date}.csv`, csv);
      setMessage('CSV exported with student totals and a breakdown by text.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not export participation. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-xl border border-blue-200 bg-white p-4">
    <h2 className="font-semibold text-gray-950">Text participation for grading</h2>
    <p className="mt-1 text-sm text-gray-600">Export question and reply counts for each student, with totals and a breakdown by assigned text. Includes students with no posts and all dates.</p>
    <p className="mt-1 text-xs text-gray-500">Counts posted work, including moderated posts; excludes withdrawn questions and private drafts. Filter “Row type” in the CSV to view totals or text breakdowns.</p>
    <Button className="mt-3" size="sm" loading={busy} onClick={() => void run()}>Export text participation CSV</Button>
    {message && <p role="status" className="mt-2 text-sm text-green-800">{message}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
