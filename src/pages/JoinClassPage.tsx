import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { findClassByJoinCode, findClassByParentCode, findClassBySubstituteCode, joinClass } from '@/services/class.service';
import type { Class } from '@/types';

type Mode = 'signup' | 'signin';

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

/** Appwrite's raw messages are unhelpful to a 15-year-old on a phone. */
function describeAuthError(err: unknown, mode: Mode): string {
  const message = err instanceof Error ? err.message : '';
  if (/already exists|already been taken/i.test(message)) {
    return 'That email already has an account. Tap "I have an account" and sign in with the class code.';
  }
  if (/Invalid credentials|password/i.test(message) && mode === 'signin') {
    return 'That email and password did not match. Check them and try again.';
  }
  return message || 'Something went wrong. Please try again.';
}

/**
 * Public landing page for the link a teacher hands out. A student who has never
 * opened the app can create an account and enrol in one submit; a student who
 * already has one signs in and enrols in one submit.
 */
export function JoinClassPage() {
  const { code: codeParam } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState(() =>
    normalizeCode(codeParam || searchParams.get('code') || ''),
  );
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lookup, setLookup] = useState<{ code: string; cls: Class | null } | null>(null);
  const [joinRole, setJoinRole] = useState<'student' | 'parent' | 'substitute'>('student');

  useEffect(() => { if (user?.role === 'parent' || user?.role === 'substitute') setJoinRole(user.role); }, [user?.role]);

  // Preview when collection permissions allow it. The selected role remains
  // authoritative because signed-out browsers may not be allowed to query classes.
  useEffect(() => {
    if (code.length !== 6) return;
    let cancelled = false;
    const lookupClass = joinRole === 'parent' ? findClassByParentCode(code) : joinRole === 'substitute' ? findClassBySubstituteCode(code) : findClassByJoinCode(code);
    void lookupClass.then(cls => { if (!cancelled) setLookup({ code, cls }); });
    return () => { cancelled = true; };
  }, [code, joinRole]);

  // Ignore a result that arrived for a code the student has since edited.
  const currentLookup = lookup?.code === code ? lookup : null;
  const foundClass = currentLookup?.cls ?? null;
  const lookupDone = Boolean(currentLookup);

  const enrol = useCallback(async (userId: string) => {
    // The very first lookup can land before the new session is fully attached,
    // so a single miss is retried before it is reported as a bad code.
    let joined = await joinClass(userId, code, joinRole);
    if (!joined) {
      await new Promise(resolve => setTimeout(resolve, 600));
      joined = await joinClass(userId, code, joinRole);
    }
    if (!joined) {
      setError(
        "You're signed in, but that class code didn't match a class. Check the code with your teacher — you can retype it above and press Join class.",
      );
      return false;
    }
    navigate('/dashboard', { replace: true });
    return true;
  }, [code, joinRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Enter the 6-character class code from your teacher');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      const account = mode === 'signup'
        ? await register(email, password, name, joinRole)
        : await login(email, password);
      await enrol(account.$id);
    } catch (err) {
      setError(describeAuthError(err, mode));
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinAsCurrentUser = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Enter the 6-character class code from your teacher');
      return;
    }
    setSubmitting(true);
    try {
      await enrol(user!.$id);
    } catch {
      setError('Could not join the class. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const codeField = (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-gray-100 p-1" aria-label="Join as">
        <button type="button" className={`rounded-md px-3 py-2 text-sm font-semibold ${joinRole === 'student' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`} onClick={() => { setJoinRole('student'); setLookup(null); setError(''); }}>Student</button>
        <button type="button" className={`rounded-md px-3 py-2 text-sm font-semibold ${joinRole === 'parent' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`} onClick={() => { setJoinRole('parent'); setLookup(null); setError(''); }}>Parent observer</button>
        <button type="button" className={`rounded-md px-3 py-2 text-sm font-semibold ${joinRole === 'substitute' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`} onClick={() => { setJoinRole('substitute'); setLookup(null); setError(''); }}>Substitute</button>
      </div>
      <label htmlFor="join-code" className="block text-sm font-medium text-gray-700 mb-1">
        {joinRole === 'parent' ? 'Parent code' : joinRole === 'substitute' ? 'Substitute code' : 'Student class code'}
      </label>
      <input
        id="join-code"
        value={code}
        onChange={e => setCode(normalizeCode(e.target.value))}
        placeholder="ABC123"
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-[0.35em] uppercase"
      />
      {foundClass && (
        <p className="mt-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          Joining <span className="font-semibold">{foundClass.courseName}</span> — {foundClass.name} as {joinRole === 'parent' ? 'a parent observer' : joinRole === 'substitute' ? 'a temporary substitute' : 'a student'}
        </p>
      )}
      {!foundClass && lookupDone && (
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          We couldn't preview that {joinRole} code while signed out. Double-check it with the teacher — it will be securely verified after sign-in.
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">Learning is Fun</h1>
          <p className="text-gray-500 mt-2">Join as a student, parent observer, or substitute</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center text-gray-400">
            Loading…
          </div>
        ) : user ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
            <p className="text-sm text-gray-600">
              Signed in as <span className="font-medium text-gray-900">{user.name}</span>
            </p>
            {codeField}
            <Button onClick={() => void handleJoinAsCurrentUser()} loading={submitting} className="w-full">
              Join class
            </Button>
            <p className="text-center text-sm text-gray-500">
              Not you? <Link to="/dashboard" className="text-blue-600 hover:underline">Go to dashboard</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

            {codeField}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  mode === 'signup'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                I'm new here
              </button>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); }}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  mode === 'signin'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                I have an account
              </button>
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="join-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname
                </label>
                <input
                  id="join-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  autoComplete="nickname"
                />
              </div>
            )}

            <div>
              <label htmlFor="join-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="join-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="join-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="join-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              {mode === 'signup' && (
                <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
              )}
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              {mode === 'signup' ? 'Create account & join' : 'Sign in & join'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Teacher? <Link to="/login" className="text-blue-600 hover:underline">Sign in here</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
