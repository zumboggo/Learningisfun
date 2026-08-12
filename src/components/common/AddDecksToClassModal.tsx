import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getClassAssignments, setClassDecks } from '@/services/flashcard.service';
import { Modal } from './Modal';
import { Button } from './Button';

interface AddDecksToClassModalProps {
  open: boolean;
  classId: string;
  teacherId: string;
  onClose: () => void;
}

export function AddDecksToClassModal({ open, classId, teacherId, onClose }: AddDecksToClassModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dailyTarget, setDailyTarget] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const decks = useLiveQuery(
    () => db.flashcard_decks
      .where('creatorId')
      .equals(teacherId)
      .and(d => d.status !== 'archived')
      .toArray(),
    [teacherId],
  );

  // Start from the decks this class already has so unchecking one removes it.
  useEffect(() => {
    if (!open) return;
    let active = true;
    void getClassAssignments(classId).then(assignments => {
      if (!active) return;
      setError('');
      setSelected(new Set(assignments.map(a => a.deckId)));
      const target = assignments.find(a => a.dailyTarget != null)?.dailyTarget;
      setDailyTarget(target ?? 10);
    });
    return () => { active = false; };
  }, [open, classId]);

  const toggleDeck = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await setClassDecks(classId, [...selected], dailyTarget || null);
      onClose();
    } catch {
      setError('Failed to update decks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add decks to class">
      <div className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        {decks && decks.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {decks.map(deck => (
              <label key={deck.$id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(deck.$id)}
                  onChange={() => toggleDeck(deck.$id)}
                  className="mt-1 rounded"
                />
                <span className="min-w-0">
                  <span className="block">{deck.title}</span>
                  {deck.description && (
                    <span className="block text-xs text-gray-500">{deck.description}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">You have no decks yet. Create one first.</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-decks-daily-target">
            Daily target for newly added decks
          </label>
          <input
            id="add-decks-daily-target"
            type="number"
            min={0}
            value={dailyTarget}
            onChange={e => setDailyTarget(Math.max(0, Number(e.target.value) || 0))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={() => void handleSave()}
            loading={saving}
            disabled={!decks || decks.length === 0}
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
