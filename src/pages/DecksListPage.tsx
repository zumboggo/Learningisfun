import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getStudentDecks } from '@/services/flashcard.service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AssignDeckModal } from '@/components/common/AssignDeckModal';
import type { FlashcardDeck } from '@/types';

export function DecksListPage() {
  const { user, isTeacher } = useAuth();
  const [assigningDeck, setAssigningDeck] = useState<FlashcardDeck | null>(null);

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
    const nameById = new Map(classes.map(c => [c.$id, c.courseName]));
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
            <Button size="sm" variant="secondary" onClick={() => setAssigningDeck(deck)}>
              Add to Class/es
            </Button>
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

      {teacherDecks.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">{isTeacher ? 'My decks' : 'Assigned'}</h2>
          <div className="space-y-3">
            {teacherDecks.map(renderDeck)}
          </div>
        </section>
      )}

      {!isTeacher && personalDecks.length > 0 && (
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
    </div>
  );
}
