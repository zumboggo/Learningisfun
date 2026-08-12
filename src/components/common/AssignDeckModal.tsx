import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getDeckAssignments, setDeckClasses } from '@/services/flashcard.service';
import { Modal } from './Modal';
import { Button } from './Button';
import type { FlashcardDeck } from '@/types';

interface AssignDeckModalProps {
  deck: FlashcardDeck | null;
  teacherId: string;
  onClose: () => void;
}

export function AssignDeckModal({ deck, teacherId, onClose }: AssignDeckModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dailyTarget, setDailyTarget] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const classes = useLiveQuery(
    () => db.classes.where('teacherId').equals(teacherId).toArray(),
    [teacherId],
  );

  // Reload the current assignments each time a deck is opened so the checkboxes
  // start from what the class already has.
  useEffect(() => {
    if (!deck) return;
    let active = true;
    void getDeckAssignments(deck.$id).then(assignments => {
      if (!active) return;
      setError('');
      setSelected(new Set(assignments.map(a => a.classId)));
      const target = assignments.find(a => a.dailyTarget != null)?.dailyTarget;
      setDailyTarget(target ?? 10);
    });
    return () => { active = false; };
  }, [deck]);

  const toggleClass = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!deck) return;
    setSaving(true);
    setError('');
    try {
      await setDeckClasses(deck.$id, [...selected], dailyTarget || null);
      onClose();
    } catch {
      setError('Failed to update classes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!deck} onClose={onClose} title="Add to Class/es">
      <div className="space-y-4">
        {deck && <p className="text-sm text-gray-500">{deck.title}</p>}
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        {classes && classes.length > 0 ? (
          <div className="space-y-2">
            {classes.map(cls => (
              <label key={cls.$id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(cls.$id)}
                  onChange={() => toggleClass(cls.$id)}
                  className="rounded"
                />
                <span>{cls.courseName} <span className="text-gray-400">({cls.name})</span></span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">You have no classes yet. Create a class first.</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="assign-daily-target">
            Daily target for newly added classes
          </label>
          <input
            id="assign-daily-target"
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
            disabled={!classes || classes.length === 0}
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
