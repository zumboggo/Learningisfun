import { useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CopyButton } from '@/components/common/CopyButton';
import { groupCountFor, makeRandomGroups, type Pickable } from '@/services/class-picker';

/**
 * Deals the class into random groups of roughly the chosen size. Sizes never
 * differ by more than one — 10 students at a target of 4 gives 4/3/3.
 */
export function CreateGroupsModal({
  open,
  students,
  onClose,
}: {
  open: boolean;
  students: Pickable[];
  onClose: () => void;
}) {
  const [targetSize, setTargetSize] = useState(4);
  const [groups, setGroups] = useState<Pickable[][] | null>(null);

  // Shown before dealing so the teacher can see what a size will produce.
  const preview = useMemo(() => {
    const count = groupCountFor(students.length, targetSize);
    if (count === 0) return '';
    const base = Math.floor(students.length / count);
    const remainder = students.length % count;
    const sizes = Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
    return `${count} group${count === 1 ? '' : 's'} of ${sizes.join(', ')}`;
  }, [students.length, targetSize]);

  const asText = () =>
    (groups || [])
      .map((group, i) => `Group ${i + 1}: ${group.map(s => s.name).join(', ')}`)
      .join('\n');

  return (
    <Modal open={open} onClose={onClose} title="Create groups">
      <div className="space-y-4">
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">
            This class has no students yet. Share the join code or import a roster first.
          </p>
        ) : (
          <>
            <div>
              <label htmlFor="group-size" className="mb-1 block text-sm font-medium text-gray-700">
                Average group size
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="group-size"
                  type="range"
                  min={2}
                  max={Math.max(2, Math.min(10, students.length))}
                  value={targetSize}
                  onChange={e => setTargetSize(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center text-lg font-bold tabular-nums">{targetSize}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {students.length} students → {preview}
              </p>
            </div>

            <Button onClick={() => setGroups(makeRandomGroups(students, targetSize))} className="w-full">
              {groups ? 'Shuffle again' : 'Make groups'}
            </Button>

            {groups && (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {groups.map((group, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 p-3">
                      <h3 className="mb-1 text-sm font-semibold text-gray-900">
                        Group {i + 1}
                        <span className="ml-1 font-normal text-gray-400">({group.length})</span>
                      </h3>
                      <ul className="space-y-0.5 text-sm text-gray-600">
                        {group.map(student => (
                          <li key={student.id}>{student.name}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <CopyButton text={asText()} label="Copy groups" copiedLabel="Groups copied" />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
