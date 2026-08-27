import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { completePasswordRecovery, passwordRecoveryParams } from '@/services/auth.service';

export function ResetPasswordPage() {
  const recovery = useMemo(() => passwordRecoveryParams(), []);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const mismatch = Boolean(confirmation) && password !== confirmation;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recovery || password.length < 8 || mismatch) return;
    setLoading(true); setError('');
    try { await completePasswordRecovery(recovery.userId, recovery.secret, password); setComplete(true); }
    catch { setError('This reset link is invalid or has expired. Request a new email and try again.'); }
    finally { setLoading(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4"><div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-bold text-gray-950">Choose a new password</h1>
    {complete ? <div className="mt-4 space-y-4"><p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-900">Your password has been changed. You can now sign in with the new password.</p><Link to="/login" className="block"><Button className="w-full">Sign in</Button></Link></div> : !recovery ? <div className="mt-4 space-y-4"><p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">This password-reset link is incomplete or expired. Please request a new one.</p><Link to="/forgot-password" className="block"><Button className="w-full">Request a new link</Button></Link></div> : <form onSubmit={submit} className="mt-4 space-y-4">
      <p className="text-sm text-gray-600">Use at least 8 characters. Choose something memorable that other students cannot guess.</p>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label className="block text-sm font-medium text-gray-700">New password<input autoFocus type="password" minLength={8} maxLength={256} required autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" /></label>
      <label className="block text-sm font-medium text-gray-700">Confirm new password<input type="password" minLength={8} maxLength={256} required autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base" /></label>
      {mismatch && <p className="text-sm text-red-700">The passwords do not match.</p>}
      <Button type="submit" loading={loading} disabled={password.length < 8 || password !== confirmation} className="w-full">Change password</Button>
    </form>}
  </div></main>;
}
