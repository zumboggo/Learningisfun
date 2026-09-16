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
  // Attendance is temporary: closing this dialog starts a fresh session.
  return open ? <GroupSession students={students} onClose={onClose}/> : null;
}

function GroupSession({students,onClose}:{students:Pickable[];onClose:()=>void}) {
  const [absent,setAbsent]=useState<Set<string>>(new Set());
  const present=students.filter(student=>!absent.has(student.id));
  const exclude=(id:string)=>{
    setAbsent(current=>new Set(current).add(id));
    setGroups(current=>current?.map(group=>group.filter(student=>student.id!==id)).filter(group=>group.length) || null);
  };
  const restore=(id:string)=>{
    setAbsent(current=>{const next=new Set(current);next.delete(id);return next;});
    setGroups(null);
  };
  const [targetSize, setTargetSize] = useState(4);
  const [groups, setGroups] = useState<Pickable[][] | null>(null);

  // Shown before dealing so the teacher can see what a size will produce.
  const preview = useMemo(() => {
    const count = groupCountFor(present.length, targetSize);
    if (count === 0) return '';
    const base = Math.floor(present.length / count);
    const remainder = present.length % count;
    const sizes = Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
    return `${count} group${count === 1 ? '' : 's'} of ${sizes.join(', ')}`;
  }, [present.length, targetSize]);

  const asText = () =>
    (groups || [])
      .map((group, i) => `Group ${i + 1}: ${group.map(s => s.name).join(', ')}`)
      .join('\n');

  return (
    <Modal open onClose={onClose} title="Create groups">
      <div className="space-y-4">
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">
            This class has no students yet. Share the join code or import a roster first.
          </p>
        ) : (
          <>
            <details open={!groups} className="rounded-xl border border-gray-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold">Who’s here? · {present.length} present · {students.length-present.length} absent</summary>
              <p className="my-2 text-xs text-gray-500">Click × beside anyone absent today. This only affects these groups—not the class roster.</p>
              <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto">
                {present.map(student=><span key={student.id} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 pl-3 text-sm">{student.name}<button type="button" aria-label={`Exclude ${student.name} from groups`} title="Absent today" onClick={()=>exclude(student.id)} className="min-h-10 min-w-10 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700">×</button></span>)}
              </div>
              {absent.size>0&&<div className="mt-3 border-t pt-2"><p className="mb-1 text-xs text-gray-500">Not included · click to restore</p><div className="flex flex-wrap gap-2">{students.filter(student=>absent.has(student.id)).map(student=><button type="button" key={student.id} aria-label={`Restore ${student.name} to groups`} onClick={()=>restore(student.id)} className="min-h-10 rounded-lg border px-3 text-sm text-gray-500">+ {student.name}</button>)}</div></div>}
            </details>
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
                {present.length ? `${present.length} students → ${preview}` : 'No students selected. Restore someone to make groups.'}
              </p>
            </div>

            <Button disabled={!present.length} onClick={() => setGroups(makeRandomGroups(present, targetSize))} className="w-full">
              {groups ? 'Shuffle again' : 'Make groups'}
            </Button>

            {groups && groups.length>0 && (
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
                          <li key={student.id} className="flex items-center justify-between gap-2"><span>{student.name}</span><button type="button" aria-label={`Mark ${student.name} absent`} title="Exclude from these groups" className="min-h-10 min-w-10 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-700" onClick={()=>exclude(student.id)}>×</button></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Removing someone keeps everyone else in place. Shuffle again to rebalance the groups.</p>
                <CopyButton text={asText()} label="Copy groups" copiedLabel="Groups copied" />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
