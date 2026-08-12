import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { addCard, assignDeck, createDeck, publishDeck } from '@/services/flashcard.service';
import { parseTags } from '@/utils/helpers';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

interface CardRow {
  front: string;
  back: string;
  tags: string;
}

const NEW_DECK = '__new__';

function blankRow(): CardRow {
  return { front: '', back: '', tags: '' };
}

function isBlank(row: CardRow): boolean {
  return !row.front.trim() && !row.back.trim() && !row.tags.trim();
}

function isComplete(row: CardRow): boolean {
  return Boolean(row.front.trim() && row.back.trim());
}

export function AddClassCardsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<CardRow[]>([blankRow(), blankRow(), blankRow()]);
  const [target, setTarget] = useState(NEW_DECK);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [dailyTarget, setDailyTarget] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cls = useLiveQuery(() => (classId ? db.classes.get(classId) : undefined), [classId]);

  const classDecks = useLiveQuery(async () => {
    if (!classId) return [];
    const assignments = await db.deck_assignments.where('classId').equals(classId).toArray();
    const decks = await Promise.all(assignments.map(a => db.flashcard_decks.get(a.deckId)));
    return decks
      .filter((deck): deck is NonNullable<typeof deck> => Boolean(deck))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [classId]);

  // Fronts already in the chosen deck, so we can flag duplicates before saving.
  const existingFronts = useLiveQuery(async () => {
    if (target === NEW_DECK) return new Set<string>();
    const cards = await db.flashcard_cards.where('deckId').equals(target).toArray();
    return new Set(cards.map(card => card.front.trim().toLowerCase()));
  }, [target]);

  // Tags already used across this class's decks, offered as autocomplete so
  // teachers reuse "chapter-3" instead of inventing "Chapter 3".
  const tagSuggestions = useLiveQuery(async () => {
    const deckIds = (classDecks || []).map(deck => deck.$id);
    if (deckIds.length === 0) return [];
    const cards = await db.flashcard_cards.where('deckId').anyOf(deckIds).toArray();
    const byKey = new Map<string, string>();
    for (const card of cards) {
      for (const tag of card.tags) {
        const key = tag.trim().toLowerCase();
        if (key && !byKey.has(key)) byKey.set(key, tag.trim());
      }
    }
    return [...byKey.values()].sort((a, b) => a.localeCompare(b));
  }, [classDecks]);

  const filledRows = useMemo(() => rows.filter(isComplete), [rows]);
  const halfFilledCount = useMemo(
    () => rows.filter(row => !isBlank(row) && !isComplete(row)).length,
    [rows],
  );

  // A row is a duplicate if the deck already has that front, or an earlier row does.
  const duplicateFlags = useMemo(() => {
    const seen = new Set<string>();
    return rows.map(row => {
      const key = row.front.trim().toLowerCase();
      if (!key) return false;
      const clash = seen.has(key) || Boolean(existingFronts?.has(key));
      seen.add(key);
      return clash;
    });
  }, [rows, existingFronts]);

  const duplicateCount = duplicateFlags.filter(Boolean).length;

  const updateRow = (index: number, field: keyof CardRow, value: string) => {
    setRows(prev => {
      const next = prev.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      // Keep exactly one trailing blank row so the grid always has somewhere to type.
      if (index === next.length - 1 && !isBlank(next[index])) next.push(blankRow());
      return next;
    });
  };

  const removeRow = (index: number) => {
    setRows(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [blankRow()];
    });
  };

  /**
   * Teachers usually already have these in a spreadsheet. Pasting a multi-row
   * selection into a cell spreads it across the grid instead of dumping every
   * tab and newline into one field.
   */
  const handlePaste = (index: number, field: keyof CardRow, text: string) => {
    if (!/[\t\n]/.test(text)) return false;
    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim());
    if (lines.length === 0) return false;

    const order: (keyof CardRow)[] = ['front', 'back', 'tags'];
    const startCol = order.indexOf(field);

    setRows(prev => {
      const next = [...prev];
      lines.forEach((line, offset) => {
        const cells = line.split('\t');
        const rowIndex = index + offset;
        while (next.length <= rowIndex) next.push(blankRow());
        const row = { ...next[rowIndex] };
        cells.forEach((cell, cellOffset) => {
          const col = order[startCol + cellOffset];
          if (col) row[col] = cell.trim();
        });
        next[rowIndex] = row;
      });
      if (!isBlank(next[next.length - 1])) next.push(blankRow());
      return next;
    });
    return true;
  };

  const canSave =
    filledRows.length > 0 &&
    (target !== NEW_DECK || newDeckTitle.trim().length > 0) &&
    !saving;

  const handleSave = async () => {
    if (!user || !classId || filledRows.length === 0) return;
    setSaving(true);
    setError('');

    try {
      let deckId = target;

      if (target === NEW_DECK) {
        const deck = await createDeck(user.$id, newDeckTitle.trim(), '', 'teacher');
        deckId = deck.$id;
      }

      for (const row of filledRows) {
        await addCard(deckId, row.front.trim(), row.back.trim(), {
          tags: parseTags(row.tags),
        });
      }

      if (target === NEW_DECK) {
        await publishDeck(deckId, user.$id);
        await assignDeck(deckId, classId, false, dailyTarget || null);
      }

      navigate(`/classes/${classId}`);
    } catch {
      setError('Could not save these cards. They are still here — try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!cls) {
    return <div className="p-4 text-gray-400">Loading class…</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div>
        <Link to={`/classes/${classId}`} className="text-sm text-blue-600 hover:underline">
          ← {cls.courseName}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Add cards</h1>
        <p className="text-sm text-gray-500">
          Type a front and back for each card. Tags are optional and comma separated.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deck-target">
          Add to deck
        </label>
        <select
          id="deck-target"
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
        >
          <option value={NEW_DECK}>Create a new deck…</option>
          {classDecks?.map(deck => (
            <option key={deck.$id} value={deck.$id}>{deck.title}</option>
          ))}
        </select>

        {target === NEW_DECK && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deck-title">
                New deck title
              </label>
              <input
                id="deck-title"
                value={newDeckTitle}
                onChange={e => setNewDeckTitle(e.target.value)}
                placeholder="e.g. Chapter 3 vocabulary"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="daily-target">
                Cards per day
              </label>
              <input
                id="daily-target"
                type="number"
                min={0}
                value={dailyTarget}
                onChange={e => setDailyTarget(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}
      </Card>

      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">
            {filledRows.length} {filledRows.length === 1 ? 'card' : 'cards'} ready
          </h2>
          <p className="text-xs text-gray-500">
            Tip: paste straight from a spreadsheet to fill several rows at once.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="w-10 px-2 py-2 font-semibold">#</th>
                <th scope="col" className="px-2 py-2 font-semibold">Front</th>
                <th scope="col" className="px-2 py-2 font-semibold">Back</th>
                <th scope="col" className="px-2 py-2 font-semibold">Tags</th>
                <th scope="col" className="w-10 px-2 py-2">
                  <span className="sr-only">Remove row</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-gray-100">
                  <td className="px-2 py-1.5 text-xs text-gray-400 tabular-nums">{index + 1}</td>
                  <td className="px-2 py-1.5">
                    <input
                      value={row.front}
                      onChange={e => updateRow(index, 'front', e.target.value)}
                      onPaste={e => {
                        if (handlePaste(index, 'front', e.clipboardData.getData('text'))) {
                          e.preventDefault();
                        }
                      }}
                      aria-label={`Front of card ${index + 1}`}
                      aria-invalid={duplicateFlags[index] || undefined}
                      className={`w-full rounded-md border px-2 py-1.5 ${
                        duplicateFlags[index] ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                      }`}
                    />
                    {duplicateFlags[index] && (
                      <p className="mt-1 text-xs text-amber-700">Already in this deck</p>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={row.back}
                      onChange={e => updateRow(index, 'back', e.target.value)}
                      onPaste={e => {
                        if (handlePaste(index, 'back', e.clipboardData.getData('text'))) {
                          e.preventDefault();
                        }
                      }}
                      aria-label={`Back of card ${index + 1}`}
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={row.tags}
                      onChange={e => updateRow(index, 'tags', e.target.value)}
                      onPaste={e => {
                        if (handlePaste(index, 'tags', e.clipboardData.getData('text'))) {
                          e.preventDefault();
                        }
                      }}
                      list="class-tag-suggestions"
                      placeholder="optional"
                      aria-label={`Tags for card ${index + 1}`}
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      aria-label={`Remove card ${index + 1}`}
                      className="rounded px-1.5 text-gray-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <datalist id="class-tag-suggestions">
          {tagSuggestions?.map(tag => <option key={tag} value={tag} />)}
        </datalist>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          <Button onClick={() => setRows(prev => [...prev, blankRow()])} size="sm" variant="secondary">
            Add row
          </Button>
          {halfFilledCount > 0 && (
            <span className="text-amber-700">
              {halfFilledCount} {halfFilledCount === 1 ? 'row needs' : 'rows need'} both a front and a back
              — {halfFilledCount === 1 ? 'it' : 'they'} won't be saved.
            </span>
          )}
          {duplicateCount > 0 && (
            <span className="text-amber-700">
              {duplicateCount} duplicate {duplicateCount === 1 ? 'front' : 'fronts'} — saving adds
              {duplicateCount === 1 ? ' it' : ' them'} again.
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          onClick={() => void handleSave()}
          loading={saving}
          disabled={!canSave}
          size="lg"
          className="sm:flex-1"
        >
          Save {filledRows.length} {filledRows.length === 1 ? 'card' : 'cards'}
        </Button>
        <Link to={`/classes/${classId}`} className="sm:flex-1">
          <Button variant="secondary" size="lg" className="w-full">Cancel</Button>
        </Link>
      </div>
    </div>
  );
}
