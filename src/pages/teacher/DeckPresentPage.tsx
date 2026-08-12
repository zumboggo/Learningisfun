import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getDeckCards } from '@/services/flashcard.service';
import { Markdown } from '@/components/common/Markdown';
import type { FlashcardCard } from '@/types';

/**
 * Full-screen slideshow of a deck, for a teacher presenting to the whole class.
 * Nothing here writes review history - it is a teaching aid, not a study session.
 */
export function DeckPresentPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const deck = useLiveQuery(() => (deckId ? db.flashcard_decks.get(deckId) : undefined), [deckId]);
  const cards = useLiveQuery(() => (deckId ? getDeckCards(deckId) : []), [deckId]);

  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  // Explicit card order when shuffling, so rendering stays pure (null = deck order).
  const [shuffleOrder, setShuffleOrder] = useState<string[] | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orderedCards = useMemo<FlashcardCard[]>(() => {
    const list = cards || [];
    if (!shuffleOrder) return list;
    const rank = new Map(shuffleOrder.map((id, position) => [id, position]));
    // Cards added since the shuffle keep deck order at the end.
    return [...list].sort(
      (a, b) => (rank.get(a.$id) ?? shuffleOrder.length) - (rank.get(b.$id) ?? shuffleOrder.length),
    );
  }, [cards, shuffleOrder]);

  const toggleShuffle = () => {
    setIndex(0);
    setShowAnswer(false);
    setShowHint(false);
    if (shuffleOrder) {
      setShuffleOrder(null);
      return;
    }
    const ids = (cards || []).map(card => card.$id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffleOrder(ids);
  };

  const total = orderedCards.length;
  const currentCard = orderedCards[index];

  const goTo = useCallback((next: number) => {
    setIndex(prev => {
      const target = Math.min(Math.max(next, 0), Math.max(total - 1, 0));
      if (target !== prev) {
        setShowAnswer(false);
        setShowHint(false);
      }
      return target;
    });
  }, [total]);

  const next = useCallback(() => {
    if (!showAnswer) {
      setShowAnswer(true);
      return;
    }
    goTo(index + 1);
  }, [showAnswer, goTo, index]);

  const prev = useCallback(() => {
    if (showAnswer) {
      setShowAnswer(false);
      setShowHint(false);
      return;
    }
    goTo(index - 1);
  }, [showAnswer, goTo, index]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    navigate(`/decks/${deckId}/review`);
  }, [navigate, deckId]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
        case 'Enter':
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          prev();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setShowAnswer(true);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setShowAnswer(false);
          break;
        case 'Home':
          event.preventDefault();
          goTo(0);
          break;
        case 'End':
          event.preventDefault();
          goTo(total - 1);
          break;
        case 'h':
        case 'H':
          setShowHint(value => !value);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (!document.fullscreenElement) exit();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [next, prev, goTo, total, toggleFullscreen, exit]);

  // Fade the chrome away while the class is reading a slide.
  useEffect(() => {
    const wake = () => {
      setControlsVisible(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    };
    wake();
    window.addEventListener('mousemove', wake);
    window.addEventListener('keydown', wake);
    window.addEventListener('touchstart', wake);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('touchstart', wake);
    };
  }, []);

  if (!deck || !cards) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 text-slate-300">
        Loading deck...
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-900 text-slate-300">
        <p>This deck has no cards to present yet.</p>
        <button
          onClick={exit}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
        >
          Back to deck
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white">
      {/* Top bar */}
      <div
        className={`flex items-center justify-between px-6 py-4 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-white/90">{deck.title}</h1>
          <p className="text-xs text-white/40">Presentation mode</p>
        </div>
        <div className="flex items-center gap-2">
          <TopButton
            label={shuffleOrder ? 'Shuffled' : 'Shuffle'}
            active={Boolean(shuffleOrder)}
            onClick={toggleShuffle}
          />
          <TopButton label={isFullscreen ? 'Exit full screen (F)' : 'Full screen (F)'} onClick={toggleFullscreen} />
          <TopButton label="Exit (Esc)" onClick={exit} />
        </div>
      </div>

      {/* Slide */}
      <button
        type="button"
        onClick={next}
        className="flex flex-1 cursor-pointer flex-col items-center justify-center px-8 text-center focus:outline-none"
        aria-label={showAnswer ? 'Next card' : 'Reveal answer'}
      >
        <div className="w-full max-w-5xl">
          <Markdown
            content={currentCard.frontMarkdown || currentCard.front}
            className="text-3xl font-semibold leading-snug sm:text-4xl md:text-5xl"
          />

          {showHint && currentCard.hint && (
            <div className="mx-auto mt-8 max-w-3xl rounded-xl bg-white/5 px-6 py-4 text-lg text-amber-200/90">
              Hint: {currentCard.hint}
            </div>
          )}

          {showAnswer ? (
            <div className="mt-10 border-t border-white/15 pt-10">
              <Markdown
                content={currentCard.backMarkdown || currentCard.back}
                className="text-2xl leading-relaxed text-emerald-200 sm:text-3xl md:text-4xl"
              />
            </div>
          ) : (
            <p
              className={`mt-12 text-sm uppercase tracking-widest text-white/30 transition-opacity duration-300 ${
                controlsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Click or press Space to reveal
            </p>
          )}
        </div>
      </button>

      {/* Bottom bar */}
      <div
        className={`px-6 pb-6 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-blue-400 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <NavButton label="Previous" onClick={prev} disabled={index === 0 && !showAnswer} />
            <NavButton label={showAnswer ? 'Next' : 'Reveal'} onClick={next} primary />
          </div>

          <span className="text-sm text-white/50">
            {index + 1} / {total}
          </span>

          <div className="flex items-center gap-2">
            {currentCard.hint && (
              <TopButton
                label={showHint ? 'Hide hint (H)' : 'Show hint (H)'}
                active={showHint}
                onClick={() => setShowHint(value => !value)}
              />
            )}
            <span className="hidden text-xs text-white/30 sm:inline">
              Arrows navigate | Space reveals | Esc exits
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopButton({ label, onClick, active = false }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-blue-500/30 text-blue-100' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function NavButton({
  label,
  onClick,
  primary = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        primary ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white/10 text-white/80 hover:bg-white/20'
      }`}
    >
      {label}
    </button>
  );
}
