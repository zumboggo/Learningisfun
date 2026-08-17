import { useCallback, useEffect, useRef, useState } from 'react';
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
import { shuffle } from '@/services/class-picker';
import { useSwipeCard, type SwipeDir } from '@/hooks/useSwipeCard';
import type { FlashcardCard, ReviewRating } from '@/types';

/**
 * 'unlimited' is a page-level mode, not a queue mode: it keeps dealing the whole
 * deck round after round and deliberately records no review, so a student can
 * practise for as long as they like without pushing tomorrow's cards away.
 */
type StudyMode = FlashcardQueueMode | 'unlimited';

const RATING_BY_SWIPE: Record<SwipeDir, ReviewRating> = {
  left: 'again',
  up: 'hard',
  right: 'good',
  down: 'easy',
};

const CARD_TIME_CAP_SECONDS = 60;
const HEALTHY_TIME_MIN = 3;
const HEALTHY_TIME_MAX = 8;

interface CardTimeRecord {
  cardId: string;
  rating: ReviewRating;
  elapsedSeconds: number;
}

export function FlashcardReviewPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user, isTeacher, isParent } = useAuth();
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
  const [queueMode, setQueueMode] = useState<StudyMode>('mixed');
  const [selectedQueueMode, setSelectedQueueMode] = useState<StudyMode>('mixed');
  const [lapCount, setLapCount] = useState(0);
  const [studySessionId, setStudySessionId] = useState('');
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [emptyMessage, setEmptyMessage] = useState('');
  const [cardTimes, setCardTimes] = useState<CardTimeRecord[]>([]);
  const [sessionNewRemaining, setSessionNewRemaining] = useState(0);
  const [sessionReviewRemaining, setSessionReviewRemaining] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(0);
  const cardStartedAt = useRef(Date.now());
  const activeSecondsRef = useRef(0);
  const studySessionIdRef = useRef('');
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionCategoryRef = useRef(new Map<string, 'new' | 'review'>());
  const finishedCardIdsRef = useRef(new Set<string>());

  useEffect(() => {
    studySessionIdRef.current = studySessionId;
  }, [studySessionId]);

  useEffect(() => () => {
    if (studySessionIdRef.current && user) {
      void finishFlashcardStudySession(studySessionIdRef.current, user.$id, activeSecondsRef.current);
    }
  }, [user]);

  const currentCard = cards[currentIndex];

  const startSession = async (mode: StudyMode) => {
    if (!deckId || !user) return;
    // Unlimited practice runs over the whole deck, shuffled, with no cap.
    const sessionCards = mode === 'unlimited'
      ? shuffle(await buildFlashcardQueue(user.$id, deckId, 'all', Number.MAX_SAFE_INTEGER))
      : await buildFlashcardQueue(user.$id, deckId, mode, 30);
    if (sessionCards.length === 0) {
      setEmptyMessage(
        mode === 'due' ? 'No due cards right now.'
          : mode === 'new' ? 'No new cards left in this deck.'
            : 'No cards available.',
      );
      return;
    }
    setLapCount(0);

    const existingStates = await db.student_card_state
      .where('userId').equals(user.$id)
      .and(state => state.deckId === deckId)
      .toArray();
    const stateByCard = new Map(existingStates.map(state => [state.cardId, state]));
    const categoryByCard = new Map<string, 'new' | 'review'>();
    for (const card of sessionCards) categoryByCard.set(card.$id, stateByCard.has(card.$id) ? 'review' : 'new');
    sessionCategoryRef.current = categoryByCard;
    finishedCardIdsRef.current = new Set();
    setSessionNewRemaining([...categoryByCard.values()].filter(category => category === 'new').length);
    setSessionReviewRemaining([...categoryByCard.values()].filter(category => category === 'review').length);
    setSessionFinished(0);

    const studySession = isParent ? null : await startFlashcardStudySession(user.$id, deckId, classId || null);
    activeSecondsRef.current = 0;
    setActiveSeconds(0);
    setStudySessionId(studySession?.$id || '');
    setQueueMode(mode);
    setCards(sessionCards);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStarted(true);
    setSessionComplete(false);
    setReviewedCount(0);
    setEmptyMessage('');
    setCardTimes([]);
    cardStartedAt.current = Date.now();
  };

  const finishSession = async () => {
    if (!studySessionId || !user) return;
    await finishFlashcardStudySession(studySessionId, user.$id, activeSecondsRef.current);
    setStudySessionId('');
  };

  const handleExit = async () => {
    await finishSession();
    // Unlimited study never ends on its own, so finishing it deliberately still
    // earns the summary screen.
    if (queueMode === 'unlimited' && reviewedCount > 0) {
      setSessionComplete(true);
      return;
    }
    setSessionStarted(false);
    setSessionComplete(false);
  };

  const handleRate = async (rating: ReviewRating) => {
    if (!user || !currentCard || !deckId) return;
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    const rawElapsed = Math.round((Date.now() - cardStartedAt.current) / 1000);
    const elapsedSeconds = Math.min(CARD_TIME_CAP_SECONDS, Math.max(1, rawElapsed));
    activeSecondsRef.current += elapsedSeconds;
    setActiveSeconds(activeSecondsRef.current);

    setCardTimes(prev => [...prev, { cardId: currentCard.$id, rating, elapsedSeconds }]);

    // The whole point of unlimited practice is that it leaves the schedule
    // alone, so no review is written and no due date moves. The study session
    // itself is still timed, so the minutes still count towards their streak.
    let needsMorePractice = false;
    if (queueMode !== 'unlimited') {
      const nextState = await reviewCard(user.$id, currentCard.$id, deckId, rating, {
        classId: classId || null,
        sessionId: studySessionId,
        elapsedSeconds,
      });
      needsMorePractice = nextState.intervalDays < 1;
      if (!needsMorePractice && !finishedCardIdsRef.current.has(currentCard.$id)) {
        finishedCardIdsRef.current.add(currentCard.$id);
        setSessionFinished(value => value + 1);
        if (sessionCategoryRef.current.get(currentCard.$id) === 'new') setSessionNewRemaining(value => Math.max(0, value - 1));
        else setSessionReviewRemaining(value => Math.max(0, value - 1));
      }
    }
    setReviewedCount(prev => prev + 1);

    const nextCards = needsMorePractice ? [...cards, currentCard] : cards;
    if (needsMorePractice) setCards(nextCards);
    if (currentIndex + 1 >= nextCards.length) {
      if (queueMode === 'unlimited') {
        // Reshuffle and keep going rather than ending the session.
        setCards(prev => shuffle(prev));
        setCurrentIndex(0);
        setLapCount(prev => prev + 1);
        setShowAnswer(false);
        cardStartedAt.current = Date.now();
        return;
      }
      await finishSession();
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      cardStartedAt.current = Date.now();
    }
  };
  const browseNext = () => { if (currentIndex >= cards.length - 1) setCurrentIndex(0); else setCurrentIndex(i=>i+1); setShowAnswer(false); };

  const handleRateRef = useRef<(rating: ReviewRating) => Promise<void>>(async () => {});
  handleRateRef.current = handleRate;

  const dismissRef = useRef<((dir: SwipeDir) => void) | null>(null);

  const handleSwipe = useCallback((dir: SwipeDir) => {
    dismissRef.current?.(dir);
  }, []);

  const handleDismissed = useCallback((dir: SwipeDir) => {
    void handleRateRef.current(RATING_BY_SWIPE[dir]);
  }, []);

  const swipeHandle = useSwipeCard({
    enabled: sessionStarted && !sessionComplete && showAnswer && !isParent,
    onSwipe: handleSwipe,
    onDismissed: handleDismissed,
    haptics: true,
  });

  dismissRef.current = swipeHandle.dismiss;

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

  useEffect(() => {
    if (!sessionStarted || sessionComplete || !showAnswer) return;
    inactivityTimerRef.current = setTimeout(() => {
      setCardTimes(prev => {
        if (!currentCard) return prev;
        const alreadyTimed = prev.some(t => t.cardId === currentCard.$id && t.elapsedSeconds >= CARD_TIME_CAP_SECONDS);
        if (alreadyTimed) return prev;
        return [...prev, { cardId: currentCard.$id, rating: 'good', elapsedSeconds: CARD_TIME_CAP_SECONDS }];
      });
    }, CARD_TIME_CAP_SECONDS * 1000);
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [sessionStarted, sessionComplete, showAnswer, currentIndex]);

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

        <div className="mb-2 grid grid-cols-3 rounded-lg bg-gray-100 p-1">
          <QueueModeButton label="Mixed" active={selectedQueueMode === 'mixed'} onClick={() => setSelectedQueueMode('mixed')} />
          <QueueModeButton label={`Due ${progress?.due || 0}`} active={selectedQueueMode === 'due'} onClick={() => setSelectedQueueMode('due')} />
          <QueueModeButton label={`New ${progress?.newCount || 0}`} active={selectedQueueMode === 'new'} onClick={() => setSelectedQueueMode('new')} />
        </div>

        <button
          onClick={() => setSelectedQueueMode('unlimited')}
          className={`mb-4 w-full rounded-lg border p-3 text-left transition-colors ${
            selectedQueueMode === 'unlimited'
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="block text-sm font-semibold text-gray-900">Unlimited study</span>
          <span className="block text-xs text-gray-500">
            Go through the whole deck as many times as you like. Nothing is scheduled, so none of
            your cards get pushed further away — they still come back when they were going to.
          </span>
        </button>

        <Button onClick={() => void startSession(selectedQueueMode)} className="w-full" size="lg">
          {selectedQueueMode === 'unlimited' ? 'Start unlimited study' : `Start ${selectedQueueMode} session`}
        </Button>

        {isTeacher && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-medium">Teach this deck</h3>
            <p className="mt-1 text-sm text-gray-500">
              Open a full-screen slideshow to work through the cards with the whole class. Nothing is
              recorded against your own review history.
            </p>
            <Button
              onClick={() => navigate(`/decks/${deckId}/present`)}
              variant="secondary"
              className="mt-3 w-full"
            >
              Present to class
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (sessionComplete) {
    const totalTime = cardTimes.reduce((sum, t) => sum + t.elapsedSeconds, 0);
    const avgTime = reviewedCount > 0 ? totalTime / reviewedCount : 0;
    const againCount = cardTimes.filter(t => t.rating === 'again').length;
    const hardCount = cardTimes.filter(t => t.rating === 'hard').length;
    const goodCount = cardTimes.filter(t => t.rating === 'good').length;
    const easyCount = cardTimes.filter(t => t.rating === 'easy').length;
    const timeHealthy = avgTime >= HEALTHY_TIME_MIN && avgTime <= HEALTHY_TIME_MAX;

    return (
      <div className="p-4 max-w-lg mx-auto text-center relative">
        <Confetti />
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Session complete!</h2>
        <p className="text-gray-500 mb-6">
          You reviewed {reviewedCount} cards in {Math.round(totalTime / 60)} minutes.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-blue-50 p-4">
            <div className="text-2xl font-bold text-blue-700">{avgTime.toFixed(1)}s</div>
            <div className="text-xs text-blue-600">avg per card</div>
            <div className={`text-xs mt-1 font-medium ${timeHealthy ? 'text-green-600' : 'text-orange-500'}`}>
              {timeHealthy ? '✓ Good pace' : avgTime < HEALTHY_TIME_MIN ? '⚡ A bit fast' : '🐢 Take your time'}
            </div>
          </div>
          <div className="rounded-xl bg-purple-50 p-4">
            <div className="text-2xl font-bold text-purple-700">{Math.round(totalTime / 60)}m</div>
            <div className="text-xs text-purple-600">total time</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <RatingBreakdown label="Again" count={againCount} total={reviewedCount} color="red" />
          <RatingBreakdown label="Hard" count={hardCount} total={reviewedCount} color="orange" />
          <RatingBreakdown label="Good" count={goodCount} total={reviewedCount} color="green" />
          <RatingBreakdown label="Easy" count={easyCount} total={reviewedCount} color="blue" />
        </div>

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
    <div className="flashcard-study-page p-4 max-w-lg mx-auto">
      <div className="flashcard-study-header">
        <button onClick={() => void handleExit()} className="flashcard-exit" aria-label={queueMode === 'unlimited' ? 'Finish session' : 'Exit session'}>
          <span aria-hidden="true">‹</span>
          <span>{queueMode === 'unlimited' ? 'Finish' : 'Exit'}</span>
        </button>
        <div className="flashcard-deck-pill" title={deck.title}>
          <BookIcon />
          <span>{deck.title}</span>
        </div>
      </div>

      <div className="flashcard-progress-row">
        {queueMode === 'unlimited' ? <span>{lapCount > 0 && `Round ${lapCount + 1} · `}{currentIndex + 1} of {cards.length}</span> : <div className="flashcard-session-counts" aria-label="Cards remaining and finished today">
          <span className="count-new"><b>{sessionNewRemaining}</b> New</span>
          <span className="count-review"><b>{sessionReviewRemaining}</b> Review</span>
          <span className="count-finished"><b>{sessionFinished}</b> Finished</span>
        </div>}
      </div>

      {queueMode === 'unlimited' && (
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Practice mode — your review schedule stays exactly where it was.
          {reviewedCount > 0 && ` ${reviewedCount} cards so far.`}
        </p>
      )}

      <div className="flashcard-progress-track">
        <div
          className="flashcard-progress-fill"
          style={{ width: `${queueMode === 'unlimited' ? ((currentIndex + 1) / cards.length) * 100 : (sessionFinished / Math.max(1, sessionCategoryRef.current.size)) * 100}%` }}
        />
      </div>

      {currentCard && (
        <div
          key={swipeHandle.animKey}
          ref={swipeHandle.cardRef}
          className={`flashcard-focus-card flex flex-col select-none touch-none ${swipeHandle.dismissClass}`}
          {...swipeHandle.handlers}
          onClick={() => { if (!showAnswer) setShowAnswer(true); }}
        >
          <div className="flashcard-question flex flex-1 flex-col items-center justify-center">
            <div className="flashcard-state-icon flashcard-state-icon-question" aria-hidden="true">?</div>
            <Markdown
              content={currentCard.frontMarkdown || currentCard.front}
              className="flashcard-question-copy text-center"
            />
            {!showAnswer && <span className="flashcard-tap-cue">Tap to flip · Space</span>}
          </div>

          {showAnswer && (
            <div className="flashcard-answer space-y-4">
              <div className="flashcard-state-icon flashcard-state-icon-answer" aria-hidden="true">✓</div>
              <Markdown
                content={currentCard.backMarkdown || currentCard.back}
                className="flashcard-answer-copy text-center"
              />
              {currentCard.hint && (
                <div className="flashcard-hint">
                  <span aria-hidden="true">♧</span><span><strong>Hint:</strong> {currentCard.hint}</span>
                </div>
              )}
            </div>
          )}

          <div className="flashcard-card-actions">
            {!showAnswer ? (
              <Button onClick={() => setShowAnswer(true)} className="w-full" size="lg">
                Show answer <span className="ml-2 text-xs opacity-80">Space</span>
              </Button>
            ) : (
              isParent ? <Button onClick={browseNext} className="w-full">Next card</Button> : null
            )}
          </div>
        </div>
      )}

      {showAnswer && !isParent && (
        <div className="flashcard-rating-zone" aria-label="Swipe or choose a rating">
          <div className="flashcard-swipe-line" aria-hidden="true"><span>← Again</span><i>·</i><span>↑ Hard</span><i>·</i><span>→ Good</span><i>·</i><span>↓ Easy</span></div>
          <div className="flashcard-rating-grid">
            <RatingButton label="Again" shortcut="1" direction="↶" tone="red" onClick={() => void handleRate('again')} />
            <RatingButton label="Hard" shortcut="2" direction="↑" tone="orange" onClick={() => void handleRate('hard')} />
            <RatingButton label="Good" shortcut="3" direction="→" tone="green" onClick={() => void handleRate('good')} />
            <RatingButton label="Easy" shortcut="4" direction="↓" tone="blue" onClick={() => void handleRate('easy')} />
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

function RatingButton({ label, shortcut, direction, tone, onClick }: { label: string; shortcut: string; direction: string; tone: 'red' | 'orange' | 'green' | 'blue'; onClick: () => void }) {
  const classes = {
    red: 'bg-red-50 text-red-700 hover:bg-red-100',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  };
  return (
    <button onClick={onClick} className={`flashcard-rating-button ${classes[tone]}`} aria-label={`${label}, keyboard ${shortcut}`}>
      <span className="flashcard-rating-direction" aria-hidden="true">{direction}</span>
      <span className="block">{label}</span>
      <kbd>{shortcut}</kbd>
    </button>
  );
}

function BookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H7.5A3.5 3.5 0 0 0 4 20.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H14v18a3 3 0 0 1 3-3h3Z"/></svg>;
}

function RatingBreakdown({ label, count, total, color }: { label: string; count: number; total: number; color: 'red' | 'orange' | 'green' | 'blue' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const bgColors = { red: 'bg-red-50', orange: 'bg-orange-50', green: 'bg-green-50', blue: 'bg-blue-50' };
  const textColors = { red: 'text-red-700', orange: 'text-orange-700', green: 'text-green-700', blue: 'text-blue-700' };
  return (
    <div className={`rounded-xl p-3 ${bgColors[color]}`}>
      <div className={`text-lg font-bold ${textColors[color]}`}>{count}</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xs text-gray-400">{pct}%</div>
    </div>
  );
}

export function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: ['#e94c9d', '#5b7cff', '#22c55e', '#f59e0b', '#a855f7', '#0284c7'][i % 6],
    size: 6 + Math.random() * 6,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
