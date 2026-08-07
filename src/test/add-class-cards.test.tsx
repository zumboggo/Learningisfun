import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { parseTags } from '@/utils/helpers';

const navigate = vi.fn();
const addCard = vi.fn();
const createDeck = vi.fn();
const publishDeck = vi.fn();
const assignDeck = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { $id: 'teacher-1' }, isTeacher: true }),
}));

vi.mock('@/services/flashcard.service', () => ({
  addCard: (...args: unknown[]) => addCard(...args),
  createDeck: (...args: unknown[]) => {
    createDeck(...args);
    return Promise.resolve({ $id: 'new-deck-1' });
  },
  publishDeck: (...args: unknown[]) => publishDeck(...args),
  assignDeck: (...args: unknown[]) => assignDeck(...args),
}));

// The page reads the class, its decks, existing fronts and tag suggestions
// through useLiveQuery, which resolves a promise and re-renders. Stand in a
// hook with the same contract so the component reaches its loaded state.
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

vi.mock('@/db/schema', () => {
  type Row = Record<string, unknown>;
  const table = (rows: Row[]) => ({
    where: (field: string) => ({
      equals: (value: unknown) => {
        const matches = () => rows.filter(row => row[field] === value);
        return {
          toArray: () => Promise.resolve(matches()),
          count: () => Promise.resolve(matches().length),
        };
      },
      anyOf: (values: unknown[]) => ({
        toArray: () => Promise.resolve(rows.filter(row => values.includes(row[field]))),
      }),
    }),
    get: (id: string) => Promise.resolve(rows.find(row => row.$id === id)),
  });
  return {
    db: {
      classes: table([{ $id: 'class-1', name: 'English 101' }]),
      deck_assignments: table([{ $id: 'a1', deckId: 'deck-1', classId: 'class-1' }]),
      flashcard_decks: table([{ $id: 'deck-1', title: 'Chapter 3' }]),
      flashcard_cards: table([
        { $id: 'c1', deckId: 'deck-1', front: 'inevitable', back: 'unavoidable', tags: ['chapter-3'] },
      ]),
    },
  };
});

async function renderPage() {
  const { AddClassCardsPage } = await import('@/pages/teacher/AddClassCardsPage');
  return render(
    <MemoryRouter initialEntries={['/classes/class-1/cards/new']}>
      <Routes>
        <Route path="/classes/:classId/cards/new" element={<AddClassCardsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('parseTags', () => {
  it('splits on commas and semicolons', () => {
    expect(parseTags('vocab, chapter-3; noun')).toEqual(['vocab', 'chapter-3', 'noun']);
  });

  it('drops blanks and trims whitespace', () => {
    expect(parseTags('  vocab ,, ; noun  ')).toEqual(['vocab', 'noun']);
  });

  it('collapses case-insensitive duplicates to the first spelling', () => {
    expect(parseTags('Vocab, vocab, VOCAB')).toEqual(['Vocab']);
  });

  it('collapses inner whitespace', () => {
    expect(parseTags('chapter   three')).toEqual(['chapter three']);
  });

  it('returns an empty array for an empty string', () => {
    expect(parseTags('')).toEqual([]);
  });
});

describe('AddClassCardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Front, Back and Tags columns', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByRole('columnheader', { name: 'Front' })).toBeInTheDocument());
    expect(screen.getByRole('columnheader', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Tags' })).toBeInTheDocument();
  });

  it('only counts rows that have both a front and a back', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => expect(screen.getByLabelText('Front of card 1')).toBeInTheDocument());
    expect(screen.getByText('0 cards ready')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Front of card 1'), 'ephemeral');
    expect(screen.getByText('0 cards ready')).toBeInTheDocument();
    expect(screen.getByText(/needs both a front and a back/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Back of card 1'), 'short-lived');
    expect(screen.getByText('1 card ready')).toBeInTheDocument();
  });

  it('grows the grid so there is always a blank row to type in', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => expect(screen.getByLabelText('Front of card 3')).toBeInTheDocument());
    expect(screen.queryByLabelText('Front of card 4')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Front of card 3'), 'x');
    expect(screen.getByLabelText('Front of card 4')).toBeInTheDocument();
  });

  it('saves only complete rows, with parsed tags', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => expect(screen.getByLabelText('Front of card 1')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Front of card 1'), 'ephemeral');
    await user.type(screen.getByLabelText('Back of card 1'), 'short-lived');
    await user.type(screen.getByLabelText('Tags for card 1'), 'vocab, Vocab');
    // Row 2 is deliberately half-filled and should be skipped.
    await user.type(screen.getByLabelText('Front of card 2'), 'orphan front');

    await user.type(screen.getByLabelText('New deck title'), 'Unit 4');
    await user.click(screen.getByRole('button', { name: 'Save 1 card' }));

    await waitFor(() => expect(addCard).toHaveBeenCalledTimes(1));
    expect(addCard).toHaveBeenCalledWith('new-deck-1', 'ephemeral', 'short-lived', {
      tags: ['vocab'],
    });
    expect(createDeck).toHaveBeenCalledWith('teacher-1', 'Unit 4', '', 'teacher');
    expect(publishDeck).toHaveBeenCalled();
    expect(assignDeck).toHaveBeenCalledWith('new-deck-1', 'class-1', false, 10);
    expect(navigate).toHaveBeenCalledWith('/classes/class-1');
  });

  it('flags a front that repeats an earlier row', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => expect(screen.getByLabelText('Front of card 1')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Front of card 1'), 'duplicate');
    await user.type(screen.getByLabelText('Front of card 2'), 'duplicate');

    expect(screen.getByText('Already in this deck')).toBeInTheDocument();
    expect(screen.getByLabelText('Front of card 2')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Front of card 1')).not.toHaveAttribute('aria-invalid');
  });

  it('cannot save a new deck without a title', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => expect(screen.getByLabelText('Front of card 1')).toBeInTheDocument());
    await user.type(screen.getByLabelText('Front of card 1'), 'front');
    await user.type(screen.getByLabelText('Back of card 1'), 'back');

    expect(screen.getByRole('button', { name: 'Save 1 card' })).toBeDisabled();

    await user.type(screen.getByLabelText('New deck title'), 'Unit 4');
    expect(screen.getByRole('button', { name: 'Save 1 card' })).toBeEnabled();
  });

  it('spreads a pasted spreadsheet selection across rows and columns', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => expect(screen.getByLabelText('Front of card 1')).toBeInTheDocument());

    await user.click(screen.getByLabelText('Front of card 1'));
    await user.paste('alpha\tfirst\tgreek\nbeta\tsecond\tgreek');

    expect(screen.getByLabelText('Front of card 1')).toHaveValue('alpha');
    expect(screen.getByLabelText('Back of card 1')).toHaveValue('first');
    expect(screen.getByLabelText('Tags for card 1')).toHaveValue('greek');
    expect(screen.getByLabelText('Front of card 2')).toHaveValue('beta');
    expect(screen.getByLabelText('Back of card 2')).toHaveValue('second');
    expect(screen.getByText('2 cards ready')).toBeInTheDocument();
  });
});
