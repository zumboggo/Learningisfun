import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import {
  getQuestionsWithAuthorship,
  moderateQuestion,
  markForDiscussion,
} from '@/services/question.service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { DiscussionQuestion } from '@/types';

export function QuestionModerationPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const assignment = useLiveQuery(
    () => (assignmentId ? db.reading_assignments.get(assignmentId) : undefined),
    [assignmentId],
  );

  const reading = useLiveQuery(
    () => (assignment ? db.readings.get(assignment.readingId) : undefined),
    [assignment],
  );

  const [questions, setQuestions] = useState<DiscussionQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;
    setLoading(true);
    getQuestionsWithAuthorship(assignmentId)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleModerate = async (questionId: string, status: 'visible' | 'hidden' | 'removed') => {
    await moderateQuestion(questionId, status);
    setQuestions(prev =>
      prev.map(q => q.$id === questionId ? { ...q, moderationStatus: status } : q)
    );
  };

  const handleDiscussion = async (questionId: string, status: 'none' | 'selected' | 'discussed' | 'archived') => {
    await markForDiscussion(questionId, status);
    setQuestions(prev =>
      prev.map(q => q.$id === questionId ? { ...q, discussionStatus: status } : q)
    );
  };

  const authorNames = useLiveQuery(async () => {
    const ids = [...new Set(questions.map(q => q.authorId))];
    const names = new Map<string, string>();
    for (const id of ids) {
      const u = await db.users.get(id);
      names.set(id, u?.name || 'Unknown');
    }
    return names;
  }, [questions]);

  const sorted = [...questions].sort((a, b) => {
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (loading) return <div className="p-4 text-gray-400">Loading…</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-gray-500 mb-4">← Back</button>
      <h1 className="text-2xl font-bold mb-1">Question Moderation</h1>
      {reading && <p className="text-gray-500 mb-6">{reading.title}</p>}

      <div className="space-y-3">
        {sorted.map(q => (
          <Card key={q.$id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-gray-900">{q.questionText}</p>
                {q.selectedPassage && (
                  <p className="mt-1 text-sm text-gray-500">"{q.selectedPassage}"</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="text-gray-500">
                    By: {authorNames?.get(q.authorId) || 'Unknown'}
                  </span>
                  <span className="text-gray-400">▲ {q.voteCount}</span>
                  {q.moderationStatus === 'hidden' && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Hidden</span>
                  )}
                  {q.moderationStatus === 'removed' && (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">Removed</span>
                  )}
                  {q.discussionStatus === 'selected' && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">Selected</span>
                  )}
                  {q.discussionStatus === 'discussed' && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Discussed</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {q.moderationStatus === 'visible' ? (
                  <button onClick={() => void handleModerate(q.$id, 'hidden')} className="text-xs text-yellow-600 hover:text-yellow-800">Hide</button>
                ) : (
                  <button onClick={() => void handleModerate(q.$id, 'visible')} className="text-xs text-green-600 hover:text-green-800">Show</button>
                )}
                <button onClick={() => void handleModerate(q.$id, 'removed')} className="text-xs text-red-600 hover:text-red-800">Remove</button>
                {q.discussionStatus === 'none' ? (
                  <button onClick={() => void handleDiscussion(q.$id, 'selected')} className="text-xs text-blue-600 hover:text-blue-800">Select</button>
                ) : q.discussionStatus === 'selected' ? (
                  <button onClick={() => void handleDiscussion(q.$id, 'discussed')} className="text-xs text-blue-600 hover:text-blue-800">Mark discussed</button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
