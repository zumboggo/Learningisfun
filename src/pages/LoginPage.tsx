import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { getLastPage } from '@/utils/last-page';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const recoveryUrl = `/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : ''}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const signedIn = await login(email, password);
      navigate(getLastPage(signedIn.$id), { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(/could not load|failed to fetch|network/i.test(message)
        ? 'The sign-in server could not be reached. Check your connection and try again, or request a password-reset email below.'
        : message || 'Sign in failed. Check your email and password, or reset your password below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">Learning is Fun</h1>
          <p className="text-gray-500 mt-2">Offline-first learning</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && <div role="alert" className="space-y-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><Link to={recoveryUrl} className="inline-block font-semibold underline">Send me a password-reset link</Link></div>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>

          <Link to={recoveryUrl} className="block"><Button type="button" variant="secondary" className="w-full">Forgot Password?</Button></Link>
          <p className="text-center text-xs leading-5 text-gray-500">We’ll email you a secure link to choose a new password.</p>

          <Link to="/join" className="block rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center text-sm font-semibold text-blue-700 hover:bg-blue-100">Have a student, parent, or substitute class code?</Link>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
