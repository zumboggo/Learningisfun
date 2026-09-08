import { describe, expect, it, vi } from 'vitest';
import { SpeechPlayer, speechChunks, speechText } from '@/utils/read-aloud';
function player() {
  const engine = { speak: vi.fn(), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn() };
  const notify = vi.fn();
  const instance = new SpeechPlayer(engine as unknown as SpeechSynthesis, notify, text => ({ text } as SpeechSynthesisUtterance));
  return { engine, notify, instance };
}
describe('browser read aloud', () => {
  it('reads words instead of Markdown syntax or link URLs', () => {
    expect(speechText('# Heading\n\nA **bold** and *gentle* [voice](https://example.com).')).toBe('Heading A bold and gentle voice.');
    expect(speechText('| Term | Definition |\n| --- | --- |\n| Epic | Narrative |')).not.toContain('---');
  });
  it('splits long readings without losing words', () => {
    const content = 'A short sentence with familiar words. '.repeat(100);
    const chunks = speechChunks(content);
    expect(chunks.every(chunk => chunk.length <= 220)).toBe(true);
    expect(chunks.join(' ')).toBe(content.trim());
    expect(speechChunks('')).toEqual([]);
  });
  it('speaks one chunk at a time, supports pause/resume, and reports completion', () => {
    const { instance, engine, notify } = player();
    instance.play('A short sentence. '.repeat(20), 0.75);
    expect(engine.speak).toHaveBeenCalledTimes(1);
    expect(engine.speak.mock.calls[0][0].rate).toBe(0.75);
    instance.pause(); expect(engine.pause).toHaveBeenCalledOnce();
    instance.resume(); expect(notify.mock.lastCall?.[0].phase).toBe('playing');
    let position = 0;
    while (position < engine.speak.mock.calls.length) engine.speak.mock.calls[position++][0].onend();
    expect(notify.mock.lastCall?.[0].phase).toBe('idle');
    expect(notify.mock.lastCall?.[0].current).toBe(notify.mock.lastCall?.[0].total);
  });
  it('does not restart from a stale completion callback after stopping', () => {
    const { instance, engine } = player();
    instance.play('Long reading. '.repeat(50), 1);
    const stale = engine.speak.mock.calls[0][0].onend;
    instance.stop(); stale();
    expect(engine.speak).toHaveBeenCalledTimes(1);
  });
  it('holds the next chunk if the browser finishes the current one while paused', () => {
    const { instance, engine } = player();
    instance.play('Long reading. '.repeat(50), 1);
    instance.pause(); engine.speak.mock.calls[0][0].onend();
    expect(engine.speak).toHaveBeenCalledTimes(1);
    instance.resume(); expect(engine.speak).toHaveBeenCalledTimes(2);
  });
  it('handles missing voices and speech failures without continuing the queue', () => {
    const { instance, engine, notify } = player();
    instance.play('Something to read.', 1);
    engine.speak.mock.calls[0][0].onerror();
    expect(notify.mock.lastCall?.[0].error).toContain('another voice');
    expect(notify.mock.lastCall?.[0].phase).toBe('idle');
  });
});
