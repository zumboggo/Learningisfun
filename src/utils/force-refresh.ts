/** Remove only this app's offline shell; never touch account or learning data. */
export async function clearAppShell(): Promise<void> {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations
      .filter(registration => registration.scope === base.href)
      .map(registration => registration.unregister()));
  }
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith('workbox-precache-') && name.endsWith(base.href))
      .map(name => caches.delete(name)));
  }
}

export function freshAppUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('app-refresh', String(Date.now()));
  return url.href;
}
