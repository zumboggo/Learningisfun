import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { findClassByJoinCode, joinClass } from '@/services/class.service';
import { WORKSHOP_CLASS_ID } from '@/services/workshop-context';

export default function WorkshopPage() {
  const { user, workshopAccess, workshopError } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (workshopAccess?.owner || workshopAccess?.enrolled) return <Navigate to={`/classes/${WORKSHOP_CLASS_ID}`} replace />;

  const join = async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const candidate = await findClassByJoinCode(code);
      if (candidate?.$id !== WORKSHOP_CLASS_ID) throw Error('Use the Lifeplus Workshop class code David gives you.');
      const cls = await joinClass(user.$id, code, 'student');
      if (!cls) throw Error('Check the workshop class code with David.');
      navigate(`/classes/${WORKSHOP_CLASS_ID}`);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return <main className="mx-auto max-w-lg space-y-5 p-6">
    <h1 className="text-2xl font-bold">Join Lifeplus Workshop</h1>
    <p>Use your usual teacher account and the workshop class code David gives you. You can read, discuss, practise and complete workshop activities as a learner. Your own teaching workspace stays separate.</p>
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); void join(); }}>
      <label className="block">Workshop class code<input required maxLength={6} className="mt-2 block w-full rounded border p-3 font-mono uppercase" value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} /></label>
      {(error || workshopError) && <p role="alert">{error || workshopError}</p>}
      <button disabled={busy || code.length !== 6} className="rounded bg-teal-900 px-4 py-3 text-white">{busy ? 'Joining…' : 'Join workshop'}</button>
    </form>
    <Link to="/classes">Return to my classes</Link>
  </main>;
}
