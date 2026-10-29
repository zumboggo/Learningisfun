import { test, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import markup from '../features/planning/editor.html?raw';
import editor from '../features/planning/editor.js?raw';
import merge from '../features/planning/merge.js?raw';
import sync from '../features/planning/sync.js?raw';

function device(cloud, saved) {
  const dom = new JSDOM(markup, { url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;
  win.PLANNING_USER = 'teacher'; win.PLANNING_ORIGIN = 'https://example.test';
  win.TextEncoder = TextEncoder;
  win.setTimeout = (...args) => setTimeout(...args); win.clearTimeout = id => clearTimeout(id);
  win.setInterval = (...args) => setInterval(...args);
  if (saved) win.localStorage.setItem('learning-planning:teacher', JSON.stringify(saved));
  win.postMessage = vi.fn(request => {
    const data = request.action === 'list' ? { documents: [...cloud.values()].map(payload => ({ payload })) } : { ok: true };
    if (request.action === 'save') cloud.set(request.deviceId, request.payload);
    queueMicrotask(() => win.dispatchEvent(new win.MessageEvent('message', { origin: win.PLANNING_ORIGIN, source: win,
      data: { type: 'planning-response', id: request.id, data } })));
  });
  win.eval(editor + '\n' + merge + '\n' + sync + '\nwindow.edit = (i,value) => { state.cards[i] = value; save(); }; window.snapshot = () => JSON.parse(JSON.stringify(library)); window.remove = () => {window.confirm=()=>true;deleteBoard(currentId)};');
  return win;
}

test('two devices converge, retain independent edits, sync deletion and do not upload unchanged polls', async () => {
  vi.useFakeTimers(); const cloud = new Map(); const windows = [];
  try {
    const a = device(cloud); windows.push(a);
    await vi.advanceTimersByTimeAsync(10);
    a.edit(0, 'Laptop draft'); await vi.advanceTimersByTimeAsync(1100);
    const b = device(cloud, a.snapshot()); windows.push(b);
    await vi.advanceTimersByTimeAsync(10);
    a.edit(0, 'Laptop final'); b.edit(1, 'Phone idea');
    await vi.advanceTimersByTimeAsync(21000);
    expect(a.snapshot().boards[0].data.cards.slice(0,2)).toEqual(['Laptop final','Phone idea']);
    expect(b.snapshot().boards[0].data.cards.slice(0,2)).toEqual(['Laptop final','Phone idea']);
    const saves = a.postMessage.mock.calls.filter(([r])=>r.action==='save').length;
    await vi.advanceTimersByTimeAsync(21000);
    expect(a.postMessage.mock.calls.filter(([r])=>r.action==='save').length).toBe(saves);
    const old = a.snapshot().boards[0].id;
    a.remove(); await vi.advanceTimersByTimeAsync(21000);
    expect(b.snapshot().boards.some(board=>board.id===old)).toBe(false);
  } finally { windows.forEach(w=>w.close()); vi.clearAllTimers(); vi.useRealTimers(); }
});

test('versioned account import wins over stale local content and offline edits upload after reconnect', async () => {
  vi.useFakeTimers(); const cloud = new Map(); const windows=[];
  try {
    const a=device(cloud); windows.push(a); await vi.advanceTimersByTimeAsync(10);
    const stale=a.snapshot(); a.edit(0,'Authoritative laptop import'); await vi.advanceTimersByTimeAsync(1100);
    const b=device(cloud,stale); windows.push(b); await vi.advanceTimersByTimeAsync(10);
    expect(b.snapshot().boards[0].data.cards[0]).toBe('Authoritative laptop import');
    Object.defineProperty(b.navigator,'onLine',{value:false,configurable:true});
    b.edit(2,'Offline idea'); await vi.advanceTimersByTimeAsync(1100);
    Object.defineProperty(b.navigator,'onLine',{value:true,configurable:true});
    b.dispatchEvent(new b.Event('online')); await vi.advanceTimersByTimeAsync(21000);
    expect(a.snapshot().boards[0].data.cards[2]).toBe('Offline idea');
  } finally {windows.forEach(w=>w.close());vi.clearAllTimers();vi.useRealTimers();}
});
