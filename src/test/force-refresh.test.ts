import { afterEach, expect, it, vi } from 'vitest';
import { clearAppShell, freshAppUrl } from '../utils/force-refresh';

afterEach(() => vi.unstubAllGlobals());

it('removes only the current app worker and precache, preserving learning and other app caches', async () => {
  const base = new URL(import.meta.env.BASE_URL, location.origin).href;
  const unregister = vi.fn().mockResolvedValue(true);
  const otherUnregister = vi.fn();
  vi.stubGlobal('navigator', { serviceWorker: { getRegistrations: async () => [
    { scope: base, unregister }, { scope: base + 'other/', unregister: otherUnregister },
  ] } });
  const deleteCache = vi.fn().mockResolvedValue(true);
  vi.stubGlobal('caches', { keys: async () => [
    'workbox-precache-v2-' + base, 'workbox-precache-v2-' + base + 'other/',
    'episode-audio-v1', 'pdf-import-worker',
  ], delete: deleteCache });
  localStorage.setItem('refresh-test-saved-work', 'keep');
  await clearAppShell();
  expect(unregister).toHaveBeenCalledOnce();
  expect(otherUnregister).not.toHaveBeenCalled();
  expect(deleteCache).toHaveBeenCalledExactlyOnceWith('workbox-precache-v2-' + base);
  expect(localStorage.getItem('refresh-test-saved-work')).toBe('keep');
  localStorage.removeItem('refresh-test-saved-work');
});

it('preserves the current URL and adds a cache-busting parameter', () => {
  const url = new URL(freshAppUrl());
  expect(url.pathname).toBe(location.pathname);
  expect(url.searchParams.has('app-refresh')).toBe(true);
});
