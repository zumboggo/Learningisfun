import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ID } from 'appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { getApiKey, setApiKey, testApiKey } from '@/services/ai.service';
import { classLabel } from '@/utils/helpers';
import type { TeacherSettings, Class } from '@/types';
import { listManagedUsers,resetManagedUserAccount,updateManagedUserRole,type ManagedUser } from '@/services/user-management.service';

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

      <ApiKeyCard />

      <UserAccountsCard />

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

function UserAccountsCard(){
  const [users,setUsers]=useState<ManagedUser[]>([]),[search,setSearch]=useState(''),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
  const load=async()=>{setLoading(true);try{setUsers((await listManagedUsers()).users)}catch(cause){setMessage(cause instanceof Error?cause.message:'Could not load users.')}finally{setLoading(false)}};
  useState(()=>{void load()});
  const visible=users.filter(user=>`${user.name} ${user.email} ${user.classNames.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const changeRole=async(user:ManagedUser,role:'student'|'parent')=>{setMessage('');try{await updateManagedUserRole(user.$id,role);await load();setMessage(`${user.name} is now a ${role}.`)}catch(cause){setMessage(cause instanceof Error?cause.message:'Could not change role.')}};
  const reset=async(user:ManagedUser)=>{if(!window.confirm(`Permanently reset ${user.name} (${user.email})? This is only allowed when the account has no student work.`))return;setMessage('');try{await resetManagedUserAccount(user.$id);setUsers(old=>old.filter(item=>item.$id!==user.$id));setMessage(`${user.name}'s account was removed. They can register again.`)}catch(cause){setMessage(cause instanceof Error?cause.message:'Could not reset account.')}};
  return <Card><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Student and parent accounts</h2><p className="mt-1 text-xs text-gray-500">Correct a mistaken role, or reset a new account that has no submitted work.</p></div><input className="rounded-lg border px-3 py-2 text-sm" placeholder="Search name, email, or class" value={search} onChange={event=>setSearch(event.target.value)}/></div>{message&&<p className="mt-3 rounded-lg bg-blue-50 p-2 text-sm text-blue-800">{message}</p>}<div className="mt-4 max-h-96 divide-y overflow-auto rounded-lg border">{loading?<p className="p-4 text-sm text-gray-500">Loading accounts…</p>:visible.map(user=><div key={user.$id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div className="min-w-0"><strong className="block truncate text-sm">{user.name}</strong><span className="block truncate text-xs text-gray-500">{user.email}</span><span className="text-xs text-gray-400">{user.classNames.join(' · ')||'Not in a class'} · {user.verified?'verified email':'unverified email'}</span></div><div className="flex items-center gap-2"><select aria-label={`Role for ${user.name}`} className="rounded-lg border px-2 py-1.5 text-xs" value={user.role==='parent'?'parent':'student'} onChange={event=>void changeRole(user,event.target.value as 'student'|'parent')}><option value="student">Student</option><option value="parent">Parent</option></select><Button size="sm" variant="danger" onClick={()=>void reset(user)}>Reset account</Button></div></div>)}{!loading&&!visible.length&&<p className="p-4 text-sm text-gray-500">No matching accounts.</p>}</div><p className="mt-3 text-xs text-gray-500">For safety, accounts with submissions, reviews, votes, annotations, discussions, quiz attempts, or Copywork cannot be reset. Change their role instead.</p></Card>;
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
      <h2 className="text-lg font-semibold mb-4">{classLabel(cls)}</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`threshold-${cls.$id}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Question threshold
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Number of questions a student must submit before they can see
            peers&apos; questions in discussions.
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

function ApiKeyCard() {
  const [apiKey, setApiKeyState] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useState(() => {
    getApiKey().then(key => {
      if (key) setApiKeyState(key);
      setLoaded(true);
    });
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await setApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testApiKey(apiKey.trim());
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  if (!loaded) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold mb-2">AI Settings</h2>
      <p className="text-xs text-gray-500 mb-4">
        Enter your OpenRouter API key to enable AI-powered flashcard generation from discussion notes and quiz creation.
        Get a key at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openrouter.ai</a>
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={e => { setApiKeyState(e.target.value); setTestResult(null); }}
            placeholder="sk-or-v1-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving} size="sm">Save key</Button>
          <Button onClick={handleTest} loading={testing} size="sm" variant="secondary">Test connection</Button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>

        {testResult && (
          <div className={`text-sm p-3 rounded-lg ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {testResult.ok ? '✓ API key works!' : `✗ ${testResult.error}`}
          </div>
        )}
      </div>
    </Card>
  );
}
