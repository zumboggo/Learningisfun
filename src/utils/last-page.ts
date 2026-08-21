const TRANSIENT_ROUTES = [/\/decks\/[^/]+\/review$/, /\/quizzes\/[^/]+\/take$/, /\/presentations\/[^/]+\/live$/];

export function lastPageKey(userId: string): string {
  return `learningisfun:lastPage:${userId}`;
}

export function isRememberablePage(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && path !== '/dashboard' && !TRANSIENT_ROUTES.some(pattern => pattern.test(path));
}

export function getLastPage(userId: string): string {
  const saved = localStorage.getItem(lastPageKey(userId));
  return saved && isRememberablePage(saved.split('?')[0]) ? saved : '/dashboard';
}
