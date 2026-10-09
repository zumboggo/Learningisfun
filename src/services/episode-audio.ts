// Static, optional episode audio: no credentials, analytics or backend requests.
export class EpisodeAudio {
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private loading: Promise<AudioBuffer> | null = null;
  private music: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private generation = 0;
  private disposed = false;
  private enabled = false;
  private level = 0.3;
  private lastClick = -Infinity;
  private url: string;
  constructor(url: string) { this.url = url; }
  async enable() {
    const generation = ++this.generation;
    if (this.disposed) return false;
    if (!this.context) {
      if (!window.AudioContext) throw new Error('Sound is unavailable in this browser.');
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = this.level;
      this.gain.connect(this.context.destination);
    }
    // Resume during the user's gesture, before downloading/decoding.
    await this.context.resume();
    if (!this.buffer) {
      this.loading ||= this.load().finally(() => { this.loading = null; });
      this.buffer = await this.loading;
    }
    if (generation !== this.generation || this.disposed || document.hidden) return false;
    if (!this.music) {
      this.music = this.context.createBufferSource();
      this.music.buffer = this.buffer;
      this.music.loop = true;
      this.music.connect(this.gain!);
      this.music.start();
    }
    this.enabled = true;
    return true;
  }
  private async load() {
    let cache: Cache | undefined;
    try { if ('caches' in window) cache = await caches.open('episode-audio-v1'); } catch { /* Optional cache. */ }
    let response: Response | undefined;
    try { response = await cache?.match(this.url); } catch { /* Fetch still works. */ }
    if (!response) {
      response = await fetch(this.url);
      if (!response.ok) throw new Error('The soundtrack could not be loaded. You can keep playing silently.');
      try { await cache?.put(this.url, response.clone()); } catch { /* Quota must not block play. */ }
    }
    return this.context!.decodeAudioData(await response.arrayBuffer());
  }
  setVolume(level: number) {
    this.level = Math.max(0, Math.min(1, level));
    if (this.gain) this.gain.gain.value = this.level;
  }
  click() {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running' || document.hidden) return;
    const now = context.currentTime;
    if (now - this.lastClick < 0.045) return;
    this.lastClick = now;
    const tone = context.createOscillator(), envelope = context.createGain();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(640, now);
    tone.frequency.exponentialRampToValueAtTime(430, now + 0.045);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.12, now + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    tone.connect(envelope); envelope.connect(this.gain!);
    tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
    tone.start(now); tone.stop(now + 0.065);
  }
  mute() {
    ++this.generation;
    this.enabled = false;
    if (this.music) { this.music.stop(); this.music.disconnect(); this.music = null; }
    // Silence any short click envelope immediately too.
    if (this.context?.state === 'running') void this.context.suspend().catch(() => {});
  }
  dispose() {
    this.disposed = true;
    this.mute();
    void this.context?.close().catch(() => {});
  }
}
