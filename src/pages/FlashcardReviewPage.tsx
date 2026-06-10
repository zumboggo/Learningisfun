import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getDueCards, getNewCards, reviewCard, getDeckCards, getDeckProgress } from '@/services/flashcard.service';
import { Button } from '@/components/common/Button';
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

  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentCard = cards[currentIndex];

  const startSession = async (mode: 'due' | 'new' | 'all') => {
    if (!deckId || !user) return;
    let sessionCards: FlashcardCard[] = [];

    if (mode === 'due') {
      sessionCards = await getDueCards(user.$id, deckId);
    } else if (mode === 'new') {
      sessionCards = await getNewCards(user.$id, deckId);
    } else {
      sessionCards = await getDeckCards(deckId);
    }

    if (sessionCards.length === 0) return;

    setCards(sessionCards);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStarted(true);
    setSessionComplete(false);
    setReviewedCount(0);
  };

  const handleRate = async (rating: ReviewRating) => {
    if (!user || !currentCard || !deckId) return;
    await reviewCard(user.$id, currentCard.$id, deckId, rating);
    setReviewedCount(prev => prev + 1);

    if (currentIndex + 1 >= cards.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  if (!deck) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading deck…</div>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-4">← Back</button>
        <h1 className="text-2xl font-bold mb-2">{deck.title}</h1>
        {deck.description && <p className="text-gray-500 mb-6">{deck.description}</p>}

        {progress && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{progress.newCount}</div>
              <div className="text-xs text-blue-600">New</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">{progress.learning}</div>
              <div className="text-xs text-yellow-600">Learning</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{progress.due}</div>
              <div className="text-xs text-green-600">Due</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {(progress?.due || 0) > 0 && (
            <Button onClick={() => void startSession('due')} className="w-full" size="lg">
              Review due cards ({progress?.due})
            </Button>
          )}
          {(progress?.newCount || 0) > 0 && (
            <Button onClick={() => void startSession('new')} variant="secondary" className="w-full" size="lg">
              Learn new cards ({progress?.newCount})
            </Button>
          )}
          <Button onClick={() => void startSession('all')} variant="ghost" className="w-full">
            Study all cards
          </Button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Session complete!</h2>
        <p className="text-gray-500 mb-6">You reviewed {reviewedCount} cards</p>
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
        <button onClick={() => setSessionStarted(false)} className="text-gray-500">← Exit</button>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div className="mb-4 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {currentCard && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[300px] flex flex-col">
          <div className="flex-1 p-6 flex items-center justify-center">
            <p className="text-xl text-center leading-relaxed">{currentCard.front}</p>
          </div>

          {showAnswer && (
            <div className="border-t border-gray-100 p-6">
              <p className="text-lg text-center leading-relaxed text-gray-700">{currentCard.back}</p>
            </div>
          )}

          <div className="p-4 border-t border-gray-100">
            {!showAnswer ? (
              <Button onClick={() => setShowAnswer(true)} className="w-full" size="lg">
                Show answer
              </Button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => void handleRate('again')}
                  className="py-3 px-2 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100"
                >
                  Again
                </button>
                <button
                  onClick={() => void handleRate('hard')}
                  className="py-3 px-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium hover:bg-orange-100"
                >
                  Hard
                </button>
                <button
                  onClick={() => void handleRate('good')}
                  className="py-3 px-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100"
                >
                  Good
                </button>
                <button
                  onClick={() => void handleRate('easy')}
                  className="py-3 px-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100"
                >
                  Easy
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
