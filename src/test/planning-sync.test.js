import { test, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import markup from '../features/planning/editor.html?raw';
import editor from '../features/planning/editor.js?raw';
import sync from '../features/planning/sync.js?raw';

test('cloud saves wait for idle, skip unchanged renders, and Save flushes immediately', async () => {
  vi.useFakeTimers();
  const dom = new JSDOM(markup, { url: 'https://example.test/', runScripts: 'outside-only' });
  const win = dom.window;
  try {
    win.PLANNING_USER = 'teacher'; win.PLANNING_ORIGIN = 'https://example.test';
    win.setTimeout = (...args) => setTimeout(...args); win.clearTimeout = id => clearTimeout(id);
    win.postMessage = vi.fn();
    win.eval(editor + '\n' + sync + '\nwindow.edit = value => { state.cards[0] = value; save(); }; window.redraw = render;');
    win.edit('First draft');
    expect(JSON.parse(win.localStorage.getItem('learning-planning:teacher')).boards[0].data.cards[0]).toBe('First draft');
    await vi.advanceTimersByTimeAsync(59000);
    expect(win.postMessage).not.toHaveBeenCalled();
    win.edit('Second draft');
    await vi.advanceTimersByTimeAsync(59000);
    expect(win.postMessage).not.toHaveBeenCalled();
    // Opening or redrawing the board must not postpone a real edit's backup.
    win.redraw();
    await vi.advanceTimersByTimeAsync(1000);
    expect(win.postMessage).toHaveBeenCalledTimes(1);
    const acknowledge = async () => {
      const request = win.postMessage.mock.calls.at(-1)[0];
      win.dispatchEvent(new win.MessageEvent('message', { origin: win.PLANNING_ORIGIN, source: win,
        data: { type: 'planning-response', id: request.id, data: { ok: true } } }));
      await Promise.resolve(); await Promise.resolve();
    };
    await acknowledge();
    win.redraw();
    await vi.advanceTimersByTimeAsync(120000);
    expect(win.postMessage).toHaveBeenCalledTimes(1);
    win.edit('Final'); win.document.querySelector('#save-board').click();
    expect(win.postMessage).toHaveBeenCalledTimes(2);
    await acknowledge();
    await vi.advanceTimersByTimeAsync(60000);
    expect(win.postMessage).toHaveBeenCalledTimes(2);
  } finally { dom.window.close(); vi.useRealTimers(); }
});
