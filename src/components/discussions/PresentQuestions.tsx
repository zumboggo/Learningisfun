import { useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Button } from '@/components/common/Button';
import './present-questions.css';

/** Accept only question text so author details never enter the presentation. */
export function PresentQuestions({ questions }: { questions: string[] }) {
  const [slides, setSlides] = useState<string[] | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  return <>
    <Button size="sm" variant="secondary" disabled={!questions.length} onClick={() => {
      // Snapshot the order: incoming votes and refreshes must not move slides.
      flushSync(() => setSlides([...questions]));
      void surface.current?.requestFullscreen?.().catch(() => { /* The full-window view also works without browser fullscreen. */ });
    }}>Present Questions</Button>
    {slides && createPortal(<QuestionSlides questions={slides} surface={surface} onClose={() => setSlides(null)} />, document.body)}
  </>;
}

function QuestionSlides({ questions, surface, onClose }: {
  questions: string[];
  surface: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = dialogRef.current;
    const fullscreenSurface = surface.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    let enteredFullscreen = false;
    dialog?.showModal();
    dialog?.focus();
    document.body.style.overflow = 'hidden';
    const key = (event: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowLeft', ' ', 'Home', 'End', 'Escape'].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'Escape') closeRef.current();
        else if (event.key === 'Home') setIndex(0);
        else if (event.key === 'End') setIndex(questions.length - 1);
        else setIndex(current => Math.max(0, Math.min(questions.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1))));
      }
    };
    const fullscreen = () => {
      if (document.fullscreenElement === fullscreenSurface) enteredFullscreen = true;
      else if (enteredFullscreen) closeRef.current();
    };
    document.addEventListener('keydown', key, true);
    document.addEventListener('fullscreenchange', fullscreen);
    return () => {
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('fullscreenchange', fullscreen);
      if (document.fullscreenElement === fullscreenSurface) void document.exitFullscreen?.().catch(() => {});
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [questions, surface]);
  const next = () => setIndex(current => Math.min(questions.length - 1, current + 1));
  const text = questions[index];
  return <dialog ref={dialogRef} tabIndex={-1} className="question-presentation-dialog" aria-label="Question presentation" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div ref={surface} className="question-presentation">
    <button type="button" className="question-presentation-slide" onClick={next} aria-label="Next question">
      <span className={`question-presentation-text ${text.length > 500 ? 'question-presentation-long' : ''}`} aria-live="polite">{text}</span>
    </button>
    <nav className="question-presentation-controls" aria-label="Presentation controls">
      <button type="button" disabled={index === 0} onClick={() => setIndex(current => current - 1)}>Previous</button>
      <span aria-live="polite">{index + 1} / {questions.length}</span>
      <button type="button" disabled={index === questions.length - 1} onClick={next}>Next</button>
      <button type="button" onClick={onClose}>Exit presentation</button>
    </nav>
    </div>
  </dialog>;
}
