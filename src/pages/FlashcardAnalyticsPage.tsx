import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getTeacherFlashcardAnalytics } from '@/services/flashcard.service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export function FlashcardAnalyticsPage() {
  const { classId, deckId } = useParams<{ classId: string; deckId: string }>();

  const cls = useLiveQuery(() => (classId ? db.classes.get(classId) : undefined), [classId]);
  const deck = useLiveQuery(() => (deckId ? db.flashcard_decks.get(deckId) : undefined), [deckId]);
  const rows = useLiveQuery(
    () => (classId && deckId ? getTeacherFlashcardAnalytics(classId, deckId) : []),
    [classId, deckId],
  );

  if (!classId || !deckId || !cls || !deck) {
    return <div className="p-4 text-gray-400">Loading flashcard progress...</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to={`/classes/${classId}`} className="text-sm text-gray-500">Back to class</Link>
          <h1 className="text-2xl font-bold">Flashcard progress</h1>
          <p className="text-sm text-gray-500">{cls.name} | {deck.title}</p>
        </div>
        <Link to={`/classes/${classId}/reports`}>
          <Button size="sm" variant="secondary">Full report</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Minutes studied" value={round1((rows || []).reduce((sum, row) => sum + row.minutes, 0))} />
        <SummaryCard label="Cards reviewed" value={(rows || []).reduce((sum, row) => sum + row.cardsReviewed, 0)} />
        <SummaryCard label="Students" value={rows?.length || 0} />
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Minutes</th>
                <th className="px-3 py-2">Reviewed</th>
                <th className="px-3 py-2">New</th>
                <th className="px-3 py-2">Familiar</th>
                <th className="px-3 py-2">Known</th>
                <th className="px-3 py-2">Ratio</th>
              </tr>
            </thead>
            <tbody>
              {rows?.map(row => {
                const total = row.newCount + row.familiar + row.known;
                return (
                  <tr key={row.userId} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">{row.minutes}</td>
                    <td className="px-3 py-2">{row.cardsReviewed}</td>
                    <td className="px-3 py-2">{row.newCount}</td>
                    <td className="px-3 py-2">{row.familiar}</td>
                    <td className="px-3 py-2">{row.known}</td>
                    <td className="px-3 py-2">
                      {total > 0 ? `${pct(row.newCount, total)} / ${pct(row.familiar, total)} / ${pct(row.known, total)}` : '0 / 0 / 0'}
                    </td>
                  </tr>
                );
              })}
              {rows && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-gray-400" colSpan={7}>No flashcard activity yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </Card>
  );
}

function pct(value: number, total: number): string {
  return `${Math.round((value / total) * 100)}%`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
