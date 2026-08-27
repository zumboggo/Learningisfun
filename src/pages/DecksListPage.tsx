import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getDeckCards, getStudentDecks, updateEntireDeck, type EditableDeckCard } from '@/services/flashcard.service';
import { buildFlashcardDeckCsv } from '@/utils/csv-parser';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { AssignDeckModal } from '@/components/common/AssignDeckModal';
import { classLabel } from '@/utils/helpers';
import type { FlashcardCard, FlashcardDeck } from '@/types';

interface DeckEditorState {
  deck: FlashcardDeck;
  cards: FlashcardCard[];
}

export function DecksListPage() {
  const { user, isTeacher } = useAuth();
  const [assigningDeck, setAssigningDeck] = useState<FlashcardDeck | null>(null);
  const [editingDeck, setEditingDeck] = useState<DeckEditorState | null>(null);
  const [openingEditorId, setOpeningEditorId] = useState('');
  const [exportingDeckId, setExportingDeckId] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedDeckIds, setSelectedDeckIds] = useState<Set<string> | null>(null);
  const [sessionSize, setSessionSize] = useState(30);
  const navigate = useNavigate();

  const decks = useLiveQuery(async () => {
    if (!user) return [];
    if (isTeacher) {
      return db.flashcard_decks.where('creatorId').equals(user.$id).toArray();
    }
    return getStudentDecks(user.$id);
  }, [user?.$id, isTeacher]);

  // Class names per deck, so a teacher can see where a deck is already assigned
  // without opening the dialog.
  const classNamesByDeck = useLiveQuery(async () => {
    if (!user || !isTeacher) return {} as Record<string, string[]>;
    const [assignments, classes] = await Promise.all([
      db.deck_assignments.toArray(),
      db.classes.where('teacherId').equals(user.$id).toArray(),
    ]);
    const nameById = new Map(classes.map(c => [c.$id, classLabel(c)]));
    const map: Record<string, string[]> = {};
    for (const assignment of assignments) {
      const name = nameById.get(assignment.classId);
      if (!name) continue;
      (map[assignment.deckId] ||= []).push(name);
    }
    return map;
  }, [user?.$id, isTeacher]);

  const teacherDecks = decks?.filter(d => d.type === 'teacher') || [];
  const personalDecks = decks?.filter(d => d.type === 'personal') || [];

  useEffect(() => {
    if (!user || isTeacher || !decks) return;
    void Promise.all([
      db.app_metadata.get(`studyDecks_${user.$id}`),
      db.app_metadata.get(`studySessionSize_${user.$id}`),
    ]).then(([savedDecks, savedSize]) => {
      const available = new Set(decks.map(deck => deck.$id));
      let ids = decks.map(deck => deck.$id);
      if (savedDecks) {
        try { ids = (JSON.parse(savedDecks.value) as string[]).filter(id => available.has(id)); } catch { /* use every deck */ }
      }
      setSelectedDeckIds(new Set(ids));
      const parsedSize = Number(savedSize?.value || 30);
      setSessionSize(Math.min(100, Math.max(5, Number.isFinite(parsedSize) ? parsedSize : 30)));
    });
  }, [decks, isTeacher, user]);

  const toggleStudyDeck = (deckId: string) => {
    if (!user) return;
    const next = new Set(selectedDeckIds || []);
    if (next.has(deckId)) next.delete(deckId); else next.add(deckId);
    setSelectedDeckIds(next);
    void db.app_metadata.put({ key: `studyDecks_${user.$id}`, value: JSON.stringify([...next]) });
  };

  const beginCombinedStudy = () => {
    const ids = [...(selectedDeckIds || [])];
    if (!ids.length) return;
    navigate(`/decks/combined/review?decks=${encodeURIComponent(ids.join(','))}&limit=${sessionSize}&autostart=1`);
  };

  const exportDeck = async (deck: FlashcardDeck) => {
    setActionError('');
    setExportingDeckId(deck.$id);
    try {
      const cards = await getDeckCards(deck.$id);
      const csv = `\uFEFF${buildFlashcardDeckCsv(cards)}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${deck.title.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '') || 'flashcards'}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not export this deck.');
    } finally {
      setExportingDeckId('');
    }
  };

  const openDeckEditor = async (deck: FlashcardDeck) => {
    setActionError('');
    setOpeningEditorId(deck.$id);
    try {
      setEditingDeck({ deck, cards: await getDeckCards(deck.$id) });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not open this deck.');
    } finally {
      setOpeningEditorId('');
    }
  };

  const renderDeck = (deck: FlashcardDeck) => {
    const classNames = classNamesByDeck?.[deck.$id] || [];
    return (
      <Card key={deck.$id}>
        <div className="flex items-start justify-between gap-3">
          <Link to={`/decks/${deck.$id}/review`} className="min-w-0 flex-1">
            <h3 className="font-medium">{deck.title}</h3>
            {deck.description && <p className="text-sm text-gray-500">{deck.description}</p>}
            {isTeacher && (
              <p className="text-xs text-gray-400 mt-1">
                {classNames.length > 0 ? `In: ${classNames.join(', ')}` : 'Not in any class yet'}
              </p>
            )}
          </Link>
          {isTeacher && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to={`/decks/${deck.$id}/present`}>
                <Button size="sm">Present</Button>
              </Link>
              <Button size="sm" variant="secondary" onClick={() => setAssigningDeck(deck)}>
                Assign
              </Button>
              <Button size="sm" variant="secondary" loading={exportingDeckId === deck.$id} onClick={() => void exportDeck(deck)}>Export CSV</Button>
              <Button size="sm" variant="secondary" loading={openingEditorId === deck.$id} onClick={() => void openDeckEditor(deck)}>Edit</Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cards</h1>
        {isTeacher ? (
          <Link to="/decks/new">
            <Button size="sm">New deck</Button>
          </Link>
        ) : (
          <Link to="/decks/import">
            <Button size="sm" variant="secondary">Import CSV</Button>
          </Link>
        )}
      </div>

      {actionError && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}

      {!isTeacher && decks && decks.length > 0 && (
        <section className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Build today&apos;s session</h2>
          <p className="mt-1 text-sm text-slate-500">Choose decks and study them together in one mixed session.</p>
          <div className="mt-4 space-y-2">
            {decks.map(deck => (
              <div key={deck.$id} className="flex items-center gap-2 rounded-xl border bg-white p-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input type="checkbox" className="h-5 w-5 rounded" checked={selectedDeckIds?.has(deck.$id) ?? true} onChange={() => toggleStudyDeck(deck.$id)} />
                  <span className="min-w-0"><strong className="block truncate text-sm">{deck.title}</strong>{deck.description && <span className="block truncate text-xs text-slate-500">{deck.description}</span>}</span>
                </label>
                <Button size="sm" variant="secondary" loading={exportingDeckId === deck.$id} onClick={() => void exportDeck(deck)}>Export CSV</Button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-600"><span>{selectedDeckIds?.size ?? decks.length} decks selected</span><span>{sessionSize} cards</span></div>
          <Button size="lg" className="mt-3 w-full bg-blue-600" disabled={(selectedDeckIds?.size ?? decks.length) === 0} onClick={beginCombinedStudy}>Study</Button>
        </section>
      )}

      {isTeacher && teacherDecks.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">{isTeacher ? 'My decks' : 'Assigned'}</h2>
          <div className="space-y-3">
            {teacherDecks.map(renderDeck)}
          </div>
        </section>
      )}

      {isTeacher && personalDecks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">My Cards</h2>
          <div className="space-y-3">
            {personalDecks.map(renderDeck)}
          </div>
        </section>
      )}

      {decks && decks.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-400">
            {isTeacher ? 'No decks yet. Create one!' : 'No flashcard decks available yet'}
          </p>
        </Card>
      )}

      {user && isTeacher && (
        <AssignDeckModal
          deck={assigningDeck}
          teacherId={user.$id}
          onClose={() => setAssigningDeck(null)}
        />
      )}
      {user && editingDeck && <EditDeckModal deck={editingDeck.deck} initialCards={editingDeck.cards} creatorId={user.$id} onClose={() => setEditingDeck(null)} />}
    </div>
  );
}

interface EditableRow extends EditableDeckCard { clientId: string; }

function EditDeckModal({ deck, initialCards, creatorId, onClose }: {
  deck: FlashcardDeck;
  initialCards: FlashcardCard[];
  creatorId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description);
  const [rows, setRows] = useState<EditableRow[]>(() => initialCards.map(card => ({
    clientId: card.$id,
    id: card.$id,
    front: card.frontMarkdown || card.front,
    back: card.backMarkdown || card.back,
    hint: card.hint,
    tags: card.tags,
  })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const removedCount = initialCards.length - rows.filter(row => row.id).length;
  const invalidRows = rows.some(row => !row.front.trim() || !row.back.trim());

  const updateRow = (clientId: string, patch: Partial<EditableRow>) => {
    setRows(current => current.map(row => row.clientId === clientId ? { ...row, ...patch } : row));
  };
  const addRow = () => {
    setRows(current => [...current, {
      clientId: `new-${crypto.randomUUID()}`,
      front: '',
      back: '',
      hint: '',
      tags: [],
    }]);
  };
  const save = async () => {
    if (!title.trim() || !rows.length || invalidRows) return;
    setSaving(true);
    setError('');
    try {
      await updateEntireDeck(deck.$id, creatorId, {
        title,
        description,
        cards: rows.map(({ id, front, back, hint, tags }) => ({ id, front, back, hint, tags })),
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this deck.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit deck · ${rows.length} cards`} panelClassName="sm:max-w-6xl">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">Deck title
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={title} onChange={event => setTitle(event.target.value)} />
          </label>
          <label className="text-sm font-medium text-gray-700">Description
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={description} onChange={event => setDescription(event.target.value)} />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="w-10 px-3 py-2">#</th><th className="w-[28%] px-3 py-2">Front</th><th className="w-[38%] px-3 py-2">Back</th><th className="w-[14%] px-3 py-2">Hint</th><th className="w-[16%] px-3 py-2">Tags</th><th className="w-12 px-3 py-2"><span className="sr-only">Delete</span></th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, index) => (
                <tr key={row.clientId} className="align-top">
                  <td className="px-3 py-3 text-gray-400">{index + 1}</td>
                  <td className="p-2"><textarea aria-label={`Card ${index + 1} front`} rows={3} className="w-full resize-y rounded-lg border px-2 py-2" value={row.front} onChange={event => updateRow(row.clientId, { front: event.target.value })} /></td>
                  <td className="p-2"><textarea aria-label={`Card ${index + 1} back`} rows={3} className="w-full resize-y rounded-lg border px-2 py-2" value={row.back} onChange={event => updateRow(row.clientId, { back: event.target.value })} /></td>
                  <td className="p-2"><textarea aria-label={`Card ${index + 1} hint`} rows={3} className="w-full resize-y rounded-lg border px-2 py-2" value={row.hint} onChange={event => updateRow(row.clientId, { hint: event.target.value })} /></td>
                  <td className="p-2"><textarea aria-label={`Card ${index + 1} tags`} rows={3} className="w-full resize-y rounded-lg border px-2 py-2" value={row.tags.join(', ')} onChange={event => updateRow(row.clientId, { tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} /></td>
                  <td className="p-2"><button type="button" aria-label={`Delete card ${index + 1}`} title="Delete card" className="rounded-lg px-3 py-2 text-xl text-red-500 hover:bg-red-50" onClick={() => setRows(current => current.filter(item => item.clientId !== row.clientId))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button type="button" variant="secondary" onClick={addRow}>+ Add card</Button>
        {removedCount > 0 && <p className="text-sm text-red-600">{removedCount} existing {removedCount === 1 ? 'card' : 'cards'} will be deleted when you save.</p>}
        {!rows.length && <p className="text-sm text-red-600">Add at least one card before saving.</p>}
        {invalidRows && <p className="text-sm text-amber-700">Every card needs both a front and a back.</p>}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" loading={saving} disabled={!title.trim() || !rows.length || invalidRows} onClick={() => void save()}>Save deck</Button>
        </div>
      </div>
    </Modal>
  );
}
