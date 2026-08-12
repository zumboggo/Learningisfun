import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

// Same useLiveQuery stand-in as the other page tests: resolve the promise and
// re-render so the component reaches its loaded state.
vi.mock('dexie-react-hooks', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    useLiveQuery: (fn: () => unknown, deps: unknown[] = []) => {
      const [value, setValue] = React.useState<unknown>(undefined);
      React.useEffect(() => {
        let cancelled = false;
        void Promise.resolve(fn()).then(resolved => {
          if (!cancelled) setValue(resolved);
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, deps);
      return value;
    },
  };
});

const CARDS = [
  { $id: 'c1', deckId: 'deck-1', front: 'ephemeral', back: 'short-lived', hint: 'think mayfly', sortOrder: 0 },
  { $id: 'c2', deckId: 'deck-1', front: 'inevitable', back: 'unavoidable', hint: '', sortOrder: 1 },
];

vi.mock('@/db/schema', () => ({
  db: {
    flashcard_decks: {
      get: (id: string) =>
        Promise.resolve(id === 'deck-1' ? { $id: 'deck-1', title: 'Chapter 3', description: '' } : undefined),
    },
  },
}));

vi.mock('@/services/flashcard.service', () => ({
  getDeckCards: () => Promise.resolve(CARDS),
}));

async function renderPresentation() {
  const { DeckPresentPage } = await import('@/pages/teacher/DeckPresentPage');
  return render(
    <MemoryRouter initialEntries={['/decks/deck-1/present']}>
      <Routes>
        <Route path="/decks/:deckId/present" element={<DeckPresentPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DeckPresentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens on the first card with the answer hidden', async () => {
    await renderPresentation();
    await waitFor(() => expect(screen.getByText('ephemeral')).toBeInTheDocument());

    expect(screen.getByText('Chapter 3')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.queryByText('short-lived')).not.toBeInTheDocument();
  });

  it('reveals the answer, then advances to the next card', async () => {
    const user = userEvent.setup();
    await renderPresentation();
    await waitFor(() => expect(screen.getByText('ephemeral')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Reveal' }));
    expect(screen.getByText('short-lived')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('inevitable')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    // A new card always starts face down.
    expect(screen.queryByText('unavoidable')).not.toBeInTheDocument();
  });

  it('steps back from an answer to the question, then to the previous card', async () => {
    const user = userEvent.setup();
    await renderPresentation();
    await waitFor(() => expect(screen.getByText('ephemeral')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Reveal' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Reveal' }));
    expect(screen.getByText('unavoidable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.queryByText('unavoidable')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('ephemeral')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('shows a hint only when the teacher asks for it', async () => {
    const user = userEvent.setup();
    await renderPresentation();
    await waitFor(() => expect(screen.getByText('ephemeral')).toBeInTheDocument());

    expect(screen.queryByText(/think mayfly/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show hint (H)' }));
    expect(screen.getByText(/think mayfly/)).toBeInTheDocument();
  });

  it('drives the slideshow from the keyboard', async () => {
    const user = userEvent.setup();
    await renderPresentation();
    await waitFor(() => expect(screen.getByText('ephemeral')).toBeInTheDocument());

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('short-lived')).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('inevitable')).toBeInTheDocument();

    await user.keyboard('{Home}');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('leaves the deck screen on exit', async () => {
    const user = userEvent.setup();
    await renderPresentation();
    await waitFor(() => expect(screen.getByText('ephemeral')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Exit (Esc)' }));
    expect(navigate).toHaveBeenCalledWith('/decks/deck-1/review');
  });
});
