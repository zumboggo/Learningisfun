import { useState } from 'react';
import { clearAppShell, freshAppUrl } from '@/utils/force-refresh';

export function ForceRefreshButton() {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    if (!navigator.onLine) {
      setError('Connect to the internet, then try Force refresh again.');
      return;
    }
    if (!window.confirm('Load the latest Learning is Fun? Save any unfinished typing first. Your saved work and sign-in will stay on this device.')) return;
    setRefreshing(true);
    setError('');
    try {
      // Verify connectivity before removing the offline shell.
      const response = await fetch(new URL('index.html', new URL(import.meta.env.BASE_URL, location.origin)).href + '?app-refresh=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('App unavailable');
      await clearAppShell();
      window.location.replace(freshAppUrl());
    } catch {
      setError('Could not refresh. Check your connection and try again.');
      setRefreshing(false);
    }
  }

  return <span className="inline-flex flex-col items-end gap-1">
    <button type="button" onClick={() => void refresh()} disabled={refreshing}
      className="min-h-9 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-600">
      {refreshing ? 'Refreshing…' : 'Force refresh'}
    </button>
    {error && <span role="alert" className="max-w-56 text-xs text-red-700">{error}</span>}
  </span>;
}
