import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { requestPasswordRecovery } from '@/services/auth.service';

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    try { await requestPasswordRecovery(email); setSent(true); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setError(/could not load|failed to fetch|network/i.test(message)
        ? 'The password service could not be reached. Check your connection, wait a moment, and try again.'
        : 'The recovery email could not be sent. Check the address and try again.');
    }
    finally { setLoading(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4"><div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-bold text-gray-950">Reset your password</h1>
    {sent ? <div className="mt-4 space-y-4"><p role="status" className="rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-900">If an account uses <strong>{email}</strong>, a password-reset link has been sent. Check the inbox and spam folder. The link expires after one hour.</p><Link to="/login" className="block"><Button className="w-full">Back to sign in</Button></Link><button className="w-full text-sm text-blue-700 hover:underline" onClick={() => setSent(false)}>Try a different email</button></div> : <form onSubmit={submit} className="mt-4 space-y-4">
      <p className="text-sm leading-6 text-gray-600">Enter the student email address used for this account. Appwrite will email a secure link for choosing a new password.</p>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label className="block text-sm font-medium text-gray-700">Student email<input autoFocus type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" /></label>
      <Button type="submit" loading={loading} disabled={!email.trim()} className="w-full">Send reset email</Button>
      <Link to="/login" className="block text-center text-sm text-blue-700 hover:underline">Back to sign in</Link>
    </form>}
  </div></main>;
}
