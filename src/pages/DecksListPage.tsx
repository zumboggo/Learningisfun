import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getStudentDecks } from '@/services/flashcard.service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export function DecksListPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const decks = useLiveQuery(async () => {
    if (!user) return [];
    if (isTeacher) {
      return db.flashcard_decks.where('creatorId').equals(user.$id).toArray();
    }
    return getStudentDecks(user.$id);
  }, [user?.$id, isTeacher]);

  const teacherDecks = decks?.filter(d => d.type === 'teacher') || [];
  const personalDecks = decks?.filter(d => d.type === 'personal') || [];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Flashcard Decks</h1>
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
          <h2 className="text-lg font-semibold mb-3">Assigned Decks</h2>
          <div className="space-y-3">
            {teacherDecks.map(deck => (
              <Link key={deck.$id} to={`/decks/${deck.$id}/review`}>
                <Card>
                  <h3 className="font-medium">{deck.title}</h3>
                  {deck.description && <p className="text-sm text-gray-500">{deck.description}</p>}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isTeacher && personalDecks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">My Decks</h2>
          <div className="space-y-3">
            {personalDecks.map(deck => (
              <Link key={deck.$id} to={`/decks/${deck.$id}/review`}>
                <Card>
                  <h3 className="font-medium">{deck.title}</h3>
                  {deck.description && <p className="text-sm text-gray-500">{deck.description}</p>}
                </Card>
              </Link>
            ))}
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
    </div>
  );
}
