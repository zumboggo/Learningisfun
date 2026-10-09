export function gameDisplayKey(userId: string) { return `learningisfun:game-display:${userId}`; }
export function prefersGameFullscreen(userId: string) {
  try { return localStorage.getItem(gameDisplayKey(userId)) !== 'window'; } catch { return true; }
}
export function saveGameDisplay(userId: string, fullscreen: boolean) {
  try { localStorage.setItem(gameDisplayKey(userId), fullscreen ? 'fullscreen' : 'window'); } catch { /* Optional device preference. */ }
}
export function isGamePlayerRoute(path: string) {
  return /^\/classes\/[^/]+\/(?:teaching-stone|game\/preview\/teaching-stone|episodes\/[^/]+)$/.test(path);
}
export async function enterGameFullscreen() {
  if (document.fullscreenElement) return true;
  if (!document.documentElement.requestFullscreen) return false;
  try { await document.documentElement.requestFullscreen(); return true; } catch { return false; }
}
export async function exitGameFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    try { await document.exitFullscreen(); } catch { /* Browser may already have exited. */ }
  }
}
