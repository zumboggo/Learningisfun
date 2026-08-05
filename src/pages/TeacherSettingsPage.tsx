import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ID } from 'appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import type { TeacherSettings, Class } from '@/types';

export function TeacherSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const classes = useLiveQuery(async (): Promise<Class[]> => {
    if (!user) return [];
    return db.classes.where('teacherId').equals(user.$id).toArray();
  }, [user?.$id]);

  const classIds = classes?.map(c => c.$id) ?? [];

  const existingSettings = useLiveQuery(async (): Promise<TeacherSettings[]> => {
    if (classIds.length === 0) return [];
    return db.teacher_settings.where('classId').anyOf(classIds).toArray();
  }, [classIds.join(',')]);

  if (!user) return null;

  if (!classes || classes.length === 0) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Teacher Settings</h1>
        <EmptyState
          title="No classes yet"
          message="Create a class first to configure per-class settings."
          action={
            <Button onClick={() => navigate('/classes/new')}>Create class</Button>
          }
        />
      </div>
    );
  }

  const settingsMap = new Map<string, TeacherSettings>();
  if (existingSettings) {
    for (const s of existingSettings) {
      settingsMap.set(s.classId, s);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Teacher Settings</h1>

      {classes.map(cls => (
        <ClassSettingsCard
          key={cls.$id}
          cls={cls}
          initialSettings={settingsMap.get(cls.$id)}
        />
      ))}
    </div>
  );
}

function ClassSettingsCard({
  cls,
  initialSettings,
}: {
  cls: Class;
  initialSettings: TeacherSettings | undefined;
}) {
  const [commentThreshold, setCommentThreshold] = useState(
    initialSettings?.commentThreshold ?? 5,
  );
  const [hideNicknames, setHideNicknames] = useState(
    initialSettings?.hideStudentNicknames ?? false,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const existing = await db.teacher_settings
        .where('classId')
        .equals(cls.$id)
        .first();

      if (existing) {
        await db.teacher_settings.update(existing.$id, {
          commentThreshold,
          hideStudentNicknames: hideNicknames,
        });
      } else {
        await db.teacher_settings.add({
          $id: ID.unique(),
          classId: cls.$id,
          commentThreshold,
          hideStudentNicknames: hideNicknames,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-4">{cls.name}</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`threshold-${cls.$id}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Comment threshold
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Number of annotations a student must post before they can see
            peers&apos; comments on texts.
          </p>
          <input
            id={`threshold-${cls.$id}`}
            type="number"
            min={0}
            value={commentThreshold}
            onChange={e =>
              setCommentThreshold(Math.max(0, parseInt(e.target.value) || 0))
            }
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hideNicknames}
            onChange={e => setHideNicknames(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Hide student nicknames
            </span>
            <p className="text-xs text-gray-500">
              When enabled, student names are hidden in discussions.
            </p>
          </div>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={handleSave}
          loading={saving}
          size="sm"
        >
          Save settings
        </Button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved!</span>
        )}
      </div>
    </Card>
  );
}
