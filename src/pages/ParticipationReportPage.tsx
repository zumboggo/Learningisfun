import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import {
  buildClassParticipationRows,
  downloadCsv,
  rowsToCsv,
  type ParticipationRow,
} from '@/services/report.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

export function ParticipationReportPage() {
  const { classId } = useParams<{ classId: string }>();
  const [assignmentId, setAssignmentId] = useState('');
  const [classSessionId, setClassSessionId] = useState('');
  const [deckId, setDeckId] = useState('');
  const [rows, setRows] = useState<ParticipationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const cls = useLiveQuery(() => (classId ? db.classes.get(classId) : undefined), [classId]);
  const assignments = useLiveQuery(async () => {
    if (!classId) return [];
    const items = await db.reading_assignments.where('classId').equals(classId).toArray();
    return Promise.all(items.map(async assignment => ({
      assignment,
      reading: await db.readings.get(assignment.readingId),
    })));
  }, [classId]);
  const sessions = useLiveQuery(
    () => (classId ? db.class_sessions.where('classId').equals(classId).toArray() : []),
    [classId],
  );
  const deckAssignments = useLiveQuery(async () => {
    if (!classId) return [];
    const items = await db.deck_assignments.where('classId').equals(classId).toArray();
    return Promise.all(items.map(async assignment => ({
      assignment,
      deck: await db.flashcard_decks.get(assignment.deckId),
    })));
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    void buildClassParticipationRows(classId, {
      assignmentId: assignmentId || undefined,
      classSessionId: classSessionId || undefined,
      deckId: deckId || undefined,
    })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [classId, assignmentId, classSessionId, deckId]);

  const exportCsv = () => {
    if (!cls) return;
    downloadCsv(`${cls.name.replace(/\s+/g, '-')}-participation.csv`, rowsToCsv(rows));
  };

  if (!classId || !cls) {
    return <div className="p-4 text-gray-400">Loading report...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to={`/classes/${classId}`} className="text-sm text-gray-500">Back to class</Link>
          <h1 className="text-2xl font-bold">Participation report</h1>
          <p className="text-sm text-gray-500">{cls.name}</p>
        </div>
        <Button onClick={exportCsv} disabled={rows.length === 0}>Export CSV</Button>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Writing assignment</label>
            <select
              value={assignmentId}
              onChange={e => setAssignmentId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All / none selected</option>
              {assignments?.map(({ assignment, reading }) => (
                <option key={assignment.$id} value={assignment.$id}>{reading?.title || assignment.$id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class period</label>
            <select
              value={classSessionId}
              onChange={e => setClassSessionId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All / none selected</option>
              {sessions?.map(session => (
                <option key={session.$id} value={session.$id}>{session.sessionDate} - {session.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Flashcard deck</label>
            <select
              value={deckId}
              onChange={e => setDeckId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All / none selected</option>
              {deckAssignments?.map(({ assignment, deck }) => (
                <option key={assignment.$id} value={assignment.deckId}>{deck?.title || assignment.deckId}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Questions</th>
                <th className="px-3 py-2">Votes</th>
                <th className="px-3 py-2">Response</th>
                <th className="px-3 py-2">Words</th>
                <th className="px-3 py-2">Flag</th>
                <th className="px-3 py-2">Minutes</th>
                <th className="px-3 py-2">Reviewed</th>
                <th className="px-3 py-2">New</th>
                <th className="px-3 py-2">Familiar</th>
                <th className="px-3 py-2">Known</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={`${row.email}-${row.studentName}`} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <div className="font-medium">{row.studentName}</div>
                    <div className="text-xs text-gray-400">{row.email}</div>
                  </td>
                  <td className="px-3 py-2">{row.questionsSubmitted}</td>
                  <td className="px-3 py-2">{row.votesUsed}</td>
                  <td className="px-3 py-2">{row.responseStatus}</td>
                  <td className="px-3 py-2">{row.responseWords}</td>
                  <td className="px-3 py-2">{row.belowMinimum ? 'Short' : ''}</td>
                  <td className="px-3 py-2">{row.flashcardMinutes}</td>
                  <td className="px-3 py-2">{row.cardsReviewed}</td>
                  <td className="px-3 py-2">{row.newCards}</td>
                  <td className="px-3 py-2">{row.familiarCards}</td>
                  <td className="px-3 py-2">{row.knownCards}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-gray-400" colSpan={11}>No students found</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-3 py-8 text-center text-gray-400" colSpan={11}>Loading...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
