export function speechText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*\|?[\s:|-]*---[\s:|-]*\|?\s*$/gm, '')
    .replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+\.\s+)/gm, '')
    .replace(/```[^\n]*\n/g, '').replace(/```/g, '')
    .replace(/[*`~]/g, '').replace(/\b_([^_]+)_\b/g, '$1')
    .replace(/\|/g, ', ').replace(/\s+/g, ' ').trim();
}

export function speechChunks(markdown: string): string[] {
  let remaining = speechText(markdown);
  const chunks: string[] = [];
  while (remaining.length > 220) {
    const sample = remaining.slice(0, 220);
    const sentence = Math.max(sample.lastIndexOf('. '), sample.lastIndexOf('? '), sample.lastIndexOf('! '));
    const space = sample.lastIndexOf(' ');
    const end = sentence >= 60 ? sentence + 1 : space > 0 ? space : 220;
    chunks.push(remaining.slice(0, end).trim()); remaining = remaining.slice(end).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export type SpeechStatus = { phase: 'idle' | 'playing' | 'paused'; current: number; total: number; error?: string };

// Short utterances avoid long-document limits. Hold a strong reference to the
// active utterance and invalidate callbacks before canceling browser playback.
export class SpeechPlayer {
  private generation = 0;
  private utterance?: SpeechSynthesisUtterance;
  private paused = false;
  private next?: () => void;
  private status: SpeechStatus = { phase: 'idle', current: 0, total: 0 };
  private engine: SpeechSynthesis;
  private notify: (status: SpeechStatus) => void;
  private make: (text: string) => SpeechSynthesisUtterance;
  constructor(engine: SpeechSynthesis, notify: (status: SpeechStatus) => void, make = (text: string) => new SpeechSynthesisUtterance(text)) { this.engine = engine; this.notify = notify; this.make = make; }
  private update(status: SpeechStatus) { this.status = status; this.notify(status); }
  stop(notify = true) {
    this.generation++; this.next = undefined; this.paused = false;
    if (this.utterance) { this.utterance.onend = null; this.utterance.onerror = null; }
    this.utterance = undefined; this.engine.cancel();
    if (notify) this.update({ phase: 'idle', current: 0, total: 0 });
  }
  play(content: string, rate: number, voice?: SpeechSynthesisVoice) {
    this.stop(); const chunks = speechChunks(content); if (!chunks.length) return;
    const generation = this.generation;
    let index = 0;
    const next = () => {
      if (generation !== this.generation) return;
      if (this.paused) { this.next = next; return; }
      if (index === chunks.length) { this.utterance = undefined; this.update({ phase: 'idle', current: chunks.length, total: chunks.length }); return; }
      const utterance = this.make(chunks[index]); this.utterance = utterance;
      utterance.rate = rate;
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
      else utterance.lang = 'en';
      utterance.onend = () => { if (generation === this.generation) { index++; this.utterance = undefined; next(); } };
      utterance.onerror = () => {
        if (generation !== this.generation) return;
        this.stop(false); this.update({ phase: 'idle', current: 0, total: 0, error: 'Speech stopped. Try another voice or press Play again. Some voices need an internet connection.' });
      };
      this.update({ phase: 'playing', current: index + 1, total: chunks.length });
      try { this.engine.speak(utterance); }
      catch { utterance.onerror?.({} as SpeechSynthesisErrorEvent); }
    };
    this.engine.resume(); next();
  }
  pause() { this.paused = true; this.engine.pause(); this.update({ ...this.status, phase: 'paused' }); }
  resume() { this.paused = false; this.engine.resume(); this.update({ ...this.status, phase: 'playing' }); const next = this.next; this.next = undefined; next?.(); }
}
