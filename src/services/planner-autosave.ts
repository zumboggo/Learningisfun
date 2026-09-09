import type { WeeklyPlanData, WeeklyPlanRecord } from './planner.service';

export interface PlannerDraft { data: WeeklyPlanData; ready: boolean }
export type SaveState = 'saved' | 'local' | 'saving' | 'error';
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** One serialized writer per open week. Local recovery never contains credentials. */
export class PlannerAutosave {
  draft: PlannerDraft;
  record?: WeeklyPlanRecord;
  state: SaveState = 'saved';
  error = '';
  private revision = 0;
  private savedRevision = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private running?: Promise<void>;
  private notify = () => {};
  private localFailed = false;
  private key: string;
  private storage: StorageLike;
  private send: (draft: PlannerDraft, id?: string) => Promise<WeeklyPlanRecord>;
  constructor(key: string, initial: PlannerDraft, record: WeeklyPlanRecord | undefined, storage: StorageLike, send: (draft: PlannerDraft, id?: string) => Promise<WeeklyPlanRecord>) {
    this.key = key; this.storage = storage; this.send = send;
    this.draft = initial; this.record = record;
    try {
      const value = storage.getItem(key);
      if (value) { const parsed = JSON.parse(value); if (parsed.data?.week?.key === initial.data.week.key && Array.isArray(parsed.data.lessons)) { this.draft = parsed; this.revision = 1; this.state = 'local'; } }
      if (!this.revision && (!record || (record.planJson && JSON.parse(record.planJson).cardEditorVersion !== initial.data.cardEditorVersion))) {
        this.revision = 1; this.state = 'local'; storage.setItem(key, JSON.stringify(this.draft));
      }
    } catch { this.localFailed = true; this.state = 'error'; this.error = 'Local recovery is unavailable; keep this page open until saved online.'; }
  }
  subscribe(notify: () => void) { this.notify = notify; this.schedule(); return () => { this.notify = () => {}; clearTimeout(this.timer); if (this.pending) void this.flush().catch(() => {}); }; }
  update(draft: PlannerDraft) {
    this.draft = draft; this.revision++; this.localFailed = false;
    try { this.storage.setItem(this.key, JSON.stringify(draft)); }
    catch { this.localFailed = true; }
    this.state = this.localFailed ? 'error' : 'local';
    this.error = this.localFailed ? 'Could not save on this device. Keep this page open until saved online.' : '';
    this.notify(); this.schedule();
  }
  private schedule() { clearTimeout(this.timer); if (this.revision > this.savedRevision) this.timer = setTimeout(() => { void this.flush().catch(() => {}); }, 4000); }
  async flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.running) { await this.running; if (this.revision > this.savedRevision) return this.flush(); return; }
    if (this.savedRevision === this.revision && this.record) return;
    const revision = this.revision, snapshot = this.draft;
    this.state = 'saving'; this.notify();
    this.running = (async () => {
      try {
        this.record = await this.send(snapshot, this.record?.$id);
        this.savedRevision = revision;
        if (this.revision === revision) {
          try { this.storage.removeItem(this.key); } catch { /* Recovery remains available. */ }
          this.state = 'saved'; this.error = '';
        } else this.state = this.localFailed ? 'error' : 'local';
      } catch (cause) { this.state = 'error'; this.error = `${cause instanceof Error ? cause.message : 'Could not save online.'} ${this.localFailed ? 'Keep this page open.' : 'Changes remain on this device. Retry when connected.'}`; throw cause; }
      finally { this.running = undefined; this.notify(); }
    })();
    await this.running;
    if (this.revision > this.savedRevision) this.schedule();
  }
  get pending() { return this.revision > this.savedRevision; }
  acceptRecord(record: WeeklyPlanRecord) { this.record = record; }
}
