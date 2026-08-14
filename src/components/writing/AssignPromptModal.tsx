import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { getPromptClassIds, setPromptClasses } from '@/services/writing.service';
import { classLabel } from '@/utils/helpers';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { WritingPrompt } from '@/types';

interface AssignPromptModalProps {
  prompt: WritingPrompt | null;
  teacherId: string;
  onClose: () => void;
}

/**
 * Sets which classes a writing prompt is handed to — the same "add to class/es"
 * flow flashcard decks use, so one prompt can serve every section.
 */
export function AssignPromptModal({ prompt, teacherId, onClose }: AssignPromptModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const classes = useLiveQuery(
    () => db.classes.where('teacherId').equals(teacherId).toArray(),
    [teacherId],
  );

  // Start from the classes the prompt already has each time it is opened.
  useEffect(() => {
    if (!prompt) return;
    let active = true;
    void getPromptClassIds(prompt.$id).then(classIds => {
      if (!active) return;
      setError('');
      setSelected(new Set(classIds));
    });
    return () => { active = false; };
  }, [prompt]);

  const toggleClass = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!prompt) return;
    setSaving(true);
    setError('');
    try {
      await setPromptClasses(prompt.$id, [...selected], teacherId);
      onClose();
    } catch {
      setError('Could not update the classes for this prompt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={Boolean(prompt)} onClose={onClose} title="Add to class/es">
      <div className="space-y-4">
        {prompt && <p className="text-sm text-gray-500">{prompt.title}</p>}
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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
                <span>{classLabel(cls)}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">You have no classes yet. Create a class first.</p>
        )}

        <p className="text-xs text-gray-400">
          Removing a class hides the prompt from those students. Anything they already wrote is kept.
        </p>

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
