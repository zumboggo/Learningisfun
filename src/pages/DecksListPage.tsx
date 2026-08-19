import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getStudentDecks, updateDeckMetadata } from '@/services/flashcard.service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { AssignDeckModal } from '@/components/common/AssignDeckModal';
import { classLabel } from '@/utils/helpers';
import type { FlashcardDeck } from '@/types';

export function DecksListPage() {
  const { user, isTeacher } = useAuth();
  const [assigningDeck, setAssigningDeck] = useState<FlashcardDeck | null>(null);
  const [editingDeck,setEditingDeck]=useState<FlashcardDeck|null>(null);
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
                Add to Class/es
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingDeck(deck)}>Edit</Button>
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

      {!isTeacher && decks && decks.length > 0 && (
        <section className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Build today&apos;s session</h2>
          <p className="mt-1 text-sm text-slate-500">Choose decks and study them together in one mixed session.</p>
          <div className="mt-4 space-y-2">
            {decks.map(deck => (
              <label key={deck.$id} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3">
                <input type="checkbox" className="h-5 w-5 rounded" checked={selectedDeckIds?.has(deck.$id) ?? true} onChange={() => toggleStudyDeck(deck.$id)} />
                <span className="min-w-0"><strong className="block truncate text-sm">{deck.title}</strong>{deck.description && <span className="block truncate text-xs text-slate-500">{deck.description}</span>}</span>
              </label>
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
      {user&&editingDeck&&<EditDeckModal deck={editingDeck} creatorId={user.$id} onClose={()=>setEditingDeck(null)}/>}
    </div>
  );
}

function EditDeckModal({deck,creatorId,onClose}:{deck:FlashcardDeck;creatorId:string;onClose:()=>void}){const[title,setTitle]=useState(deck.title),[description,setDescription]=useState(deck.description);return <Modal open onClose={onClose} title="Edit deck"><div className="space-y-3"><input className="w-full rounded-lg border px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Deck title"/><textarea className="w-full rounded-lg border px-3 py-2" rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description"/><Button className="w-full" disabled={!title.trim()} onClick={()=>void updateDeckMetadata(deck.$id,creatorId,{title,description}).then(onClose)}>Save changes</Button></div></Modal>}
