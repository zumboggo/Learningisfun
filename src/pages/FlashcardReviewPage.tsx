import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import {
  buildFlashcardQueue,
  finishFlashcardStudySession,
  getDeckProgress,
  reviewCard,
  startFlashcardStudySession,
  type FlashcardQueueMode,
} from '@/services/flashcard.service';
import { Button } from '@/components/common/Button';
import { Markdown } from '@/components/common/Markdown';
import type { FlashcardCard, ReviewRating } from '@/types';

export function FlashcardReviewPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const deck = useLiveQuery(() => (deckId ? db.flashcard_decks.get(deckId) : undefined), [deckId]);
  const progress = useLiveQuery(
    () => (deckId && user ? getDeckProgress(user.$id, deckId) : undefined),
    [deckId, user?.$id],
  );
  const classId = useLiveQuery(async () => {
    if (!deckId || !user) return null;
    const memberships = await db.class_members.where('userId').equals(user.$id).toArray();
    for (const membership of memberships) {
      const assignment = await db.deck_assignments
        .where('classId')
        .equals(membership.classId)
        .and(item => item.deckId === deckId)
        .first();
      if (assignment) return membership.classId;
    }
    return null;
  }, [deckId, user?.$id]);

  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [queueMode, setQueueMode] = useState<FlashcardQueueMode>('mixed');
  const [selectedQueueMode, setSelectedQueueMode] = useState<FlashcardQueueMode>('mixed');
  const [studySessionId, setStudySessionId] = useState('');
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [emptyMessage, setEmptyMessage] = useState('');
  const cardStartedAt = useRef(Date.now());
  const activeSecondsRef = useRef(0);
  const studySessionIdRef = useRef('');

  useEffect(() => {
    studySessionIdRef.current = studySessionId;
  }, [studySessionId]);

  useEffect(() => () => {
    if (studySessionIdRef.current && user) {
      void finishFlashcardStudySession(studySessionIdRef.current, user.$id, activeSecondsRef.current);
    }
  }, [user]);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sessionStarted || sessionComplete) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (!showAnswer && event.code === 'Space') {
        event.preventDefault();
        setShowAnswer(true);
        return;
      }
      if (!showAnswer) return;
      const ratingByKey: Record<string, ReviewRating> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      };
      const rating = ratingByKey[event.key];
      if (rating) {
        event.preventDefault();
        void handleRate(rating);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionStarted, sessionComplete, showAnswer, currentCard?.$id, currentIndex, studySessionId]);

  const startSession = async (mode: FlashcardQueueMode) => {
    if (!deckId || !user) return;
    const sessionCards = await buildFlashcardQueue(user.$id, deckId, mode, 30);
    if (sessionCards.length === 0) {
      setEmptyMessage(mode === 'due' ? 'No due cards right now.' : mode === 'new' ? 'No new cards left in this deck.' : 'No cards available.');
      return;
    }

    const studySession = await startFlashcardStudySession(user.$id, deckId, classId || null);
    activeSecondsRef.current = 0;
    setActiveSeconds(0);
    setStudySessionId(studySession.$id);
    setQueueMode(mode);
    setCards(sessionCards);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStarted(true);
    setSessionComplete(false);
    setReviewedCount(0);
    setEmptyMessage('');
    cardStartedAt.current = Date.now();
  };

  const finishSession = async () => {
    if (!studySessionId || !user) return;
    await finishFlashcardStudySession(studySessionId, user.$id, activeSecondsRef.current);
    setStudySessionId('');
  };

  const handleExit = async () => {
    await finishSession();
    setSessionStarted(false);
    setSessionComplete(false);
  };

  const handleRate = async (rating: ReviewRating) => {
    if (!user || !currentCard || !deckId) return;
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - cardStartedAt.current) / 1000));
    activeSecondsRef.current += elapsedSeconds;
    setActiveSeconds(activeSecondsRef.current);

    await reviewCard(user.$id, currentCard.$id, deckId, rating, {
      classId: classId || null,
      sessionId: studySessionId,
      elapsedSeconds,
    });
    setReviewedCount(prev => prev + 1);

    if (currentIndex + 1 >= cards.length) {
      await finishSession();
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      cardStartedAt.current = Date.now();
    }
  };

  if (!deck) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading deck...</div>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-4">Back</button>
        <h1 className="text-2xl font-bold mb-2">{deck.title}</h1>
        {deck.description && <p className="text-gray-500 mb-6">{deck.description}</p>}

        {progress && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <ProgressStat label="New" value={progress.newCount} tone="blue" />
            <ProgressStat label="Familiar" value={progress.familiar} tone="yellow" />
            <ProgressStat label="Known" value={progress.known} tone="green" />
            <ProgressStat label="Due" value={progress.due} tone="red" />
          </div>
        )}

        {emptyMessage && <div className="mb-4 rounded-lg bg-gray-100 p-3 text-sm text-gray-600">{emptyMessage}</div>}

        <div className="mb-4 grid grid-cols-3 rounded-lg bg-gray-100 p-1">
          <QueueModeButton label="Mixed" active={selectedQueueMode === 'mixed'} onClick={() => setSelectedQueueMode('mixed')} />
          <QueueModeButton label={`Due ${progress?.due || 0}`} active={selectedQueueMode === 'due'} onClick={() => setSelectedQueueMode('due')} />
          <QueueModeButton label={`New ${progress?.newCount || 0}`} active={selectedQueueMode === 'new'} onClick={() => setSelectedQueueMode('new')} />
        </div>

        <Button onClick={() => void startSession(selectedQueueMode)} className="w-full" size="lg">
          Start {selectedQueueMode} session
        </Button>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Session complete</h2>
        <p className="text-gray-500 mb-6">
          You reviewed {reviewedCount} cards in {Math.round(activeSeconds / 60)} minutes.
        </p>
        <div className="space-y-3">
          <Button onClick={() => setSessionStarted(false)} className="w-full">
            Back to deck
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="w-full">
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => void handleExit()} className="text-gray-500">Exit</button>
        <span className="text-sm text-gray-400">
          {queueMode} | {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div className="mb-4 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {currentCard && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[340px] flex flex-col">
          <div className="flex-1 p-6 flex items-center justify-center">
            <Markdown
              content={currentCard.frontMarkdown || currentCard.front}
              className="text-center text-xl leading-relaxed"
            />
          </div>

          {showAnswer && (
            <div className="border-t border-gray-100 p-6 space-y-4">
              <Markdown
                content={currentCard.backMarkdown || currentCard.back}
                className="text-center text-lg leading-relaxed text-gray-700"
              />
              {currentCard.hint && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                  Hint: {currentCard.hint}
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-t border-gray-100">
            {!showAnswer ? (
              <Button onClick={() => setShowAnswer(true)} className="w-full" size="lg">
                Show answer <span className="ml-2 text-xs opacity-80">Space</span>
              </Button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <RatingButton label="Again" shortcut="1" tone="red" onClick={() => void handleRate('again')} />
                <RatingButton label="Hard" shortcut="2" tone="orange" onClick={() => void handleRate('hard')} />
                <RatingButton label="Good" shortcut="3" tone="green" onClick={() => void handleRate('good')} />
                <RatingButton label="Easy" shortcut="4" tone="blue" onClick={() => void handleRate('easy')} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QueueModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}

function ProgressStat({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'yellow' | 'green' | 'red' }) {
  const classes = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-3 text-center ${classes[tone]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

function RatingButton({ label, shortcut, tone, onClick }: { label: string; shortcut: string; tone: 'red' | 'orange' | 'green' | 'blue'; onClick: () => void }) {
  const classes = {
    red: 'bg-red-50 text-red-700 hover:bg-red-100',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  };
  return (
    <button onClick={onClick} className={`py-3 px-2 rounded-xl text-sm font-medium ${classes[tone]}`}>
      <span className="block">{label}</span>
      <span className="text-xs opacity-75">{shortcut}</span>
    </button>
  );
}
