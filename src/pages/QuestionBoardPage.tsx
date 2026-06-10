import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import {
  submitQuestion,
  hasSubmittedQuestion,
  getVisibleQuestions,
  toggleVote,
  hasVoted,
  getUserVoteCount,
} from '@/services/question.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import type { DiscussionQuestion } from '@/types';

export function QuestionBoardPage() {
  const { readingId } = useParams<{ readingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const reading = useLiveQuery(() => (readingId ? db.readings.get(readingId) : undefined), [readingId]);

  const assignments = useLiveQuery(
    () => (readingId ? db.reading_assignments.where('readingId').equals(readingId).toArray() : []),
    [readingId],
  );

  const assignmentId = assignments?.[0]?.$id || '';

  const hasSubmitted = useLiveQuery(
    () => (assignmentId && user ? hasSubmittedQuestion(user.$id, assignmentId) : false),
    [assignmentId, user?.$id],
  );

  const questions = useLiveQuery(
    () => (assignmentId && user ? getVisibleQuestions(assignmentId, user.$id) : []),
    [assignmentId, user?.$id],
  );

  const userVoteCount = useLiveQuery(
    () => (assignmentId && user ? getUserVoteCount(user.$id, assignmentId) : 0),
    [assignmentId, user?.$id],
  );

  const [showSubmit, setShowSubmit] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [selectedPassage, setSelectedPassage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set());

  const MAX_VOTES = 3;

  const handleSubmitQuestion = async () => {
    if (!user || !readingId || !assignmentId || !questionText.trim()) return;
    setSubmitting(true);
    try {
      await submitQuestion(user.$id, readingId, assignmentId, questionText.trim(), selectedPassage);
      setQuestionText('');
      setSelectedPassage('');
      setShowSubmit(false);
    } catch (err) {
      console.error('Failed to submit question:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (questionId: string) => {
    if (!user) return;
    try {
      const voted = await toggleVote(user.$id, questionId);
      setVotedQuestions(prev => {
        const next = new Set(prev);
        if (voted) next.add(questionId);
        else next.delete(questionId);
        return next;
      });
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const sortedQuestions = questions
    ? [...questions]
        .filter(q => q.moderationStatus === 'visible')
        .sort((a, b) => {
          if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        })
    : [];

  if (!reading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-2">← Back to reading</button>
        <h1 className="text-2xl font-bold">{reading.title}</h1>
        <p className="text-gray-500 text-sm">Discussion Questions</p>
      </div>

      {!hasSubmitted ? (
        <Card className="text-center py-8">
          <div className="text-4xl mb-4">❓</div>
          <h2 className="text-lg font-semibold mb-2">Submit a question first</h2>
          <p className="text-gray-500 text-sm mb-6">
            To see your classmates' questions, you need to submit at least one question about this reading.
          </p>
          <Button onClick={() => setShowSubmit(true)}>
            Write a question
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">
              {sortedQuestions.length} questions · {(userVoteCount || 0)}/{MAX_VOTES} votes used
            </div>
            <Button onClick={() => setShowSubmit(true)} size="sm" variant="secondary">
              New question
            </Button>
          </div>

          <div className="space-y-3">
            {sortedQuestions.map(q => (
              <QuestionCard
                key={q.$id}
                question={q}
                userId={user?.$id || ''}
                voted={votedQuestions.has(q.$id)}
                onVote={() => void handleVote(q.$id)}
                canVote={
                  q.authorId !== user?.$id &&
                  (userVoteCount || 0) < MAX_VOTES
                }
                isAuthor={q.authorId === user?.$id}
              />
            ))}
          </div>
        </>
      )}

      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit a question">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your question
            </label>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="What would you like to discuss about this reading?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relevant passage (optional)
            </label>
            <textarea
              value={selectedPassage}
              onChange={e => setSelectedPassage(e.target.value)}
              placeholder="Paste the passage your question relates to"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm"
            />
          </div>
          <Button
            onClick={() => void handleSubmitQuestion()}
            loading={submitting}
            disabled={!questionText.trim()}
            className="w-full"
          >
            Submit question
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function QuestionCard({
  question,
  userId,
  voted,
  onVote,
  canVote,
  isAuthor,
}: {
  question: DiscussionQuestion;
  userId: string;
  voted: boolean;
  onVote: () => void;
  canVote: boolean;
  isAuthor: boolean;
}) {
  return (
    <Card className={question.discussionStatus === 'selected' ? 'ring-2 ring-blue-500' : ''}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onVote}
            disabled={!canVote && !voted}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
              voted
                ? 'bg-blue-100 text-blue-700'
                : canVote
                  ? 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                  : 'bg-gray-50 text-gray-300'
            }`}
          >
            ▲
          </button>
          <span className="text-sm font-semibold text-gray-700">{question.voteCount}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-gray-900 leading-relaxed">{question.questionText}</p>
          {question.selectedPassage && (
            <div className="mt-2 pl-3 border-l-2 border-gray-200 text-sm text-gray-500">
              "{question.selectedPassage}"
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            {isAuthor && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Your question</span>}
            {question.discussionStatus === 'selected' && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">Selected for discussion</span>
            )}
            {question.discussionStatus === 'discussed' && (
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Discussed</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
