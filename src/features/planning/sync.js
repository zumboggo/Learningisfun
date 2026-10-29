// Requests are handled by the signed-in React host using its existing SDK session.
(() => {
  const pending = new Map();
  function request(action, extra = {}) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error('Connection timed out. Your boards remain saved on this device.')); }, 30000);
      pending.set(id, { resolve, reject, timeout });
      parent.postMessage({ type: 'planning-request', id, action, ...extra }, window.PLANNING_ORIGIN);
    });
  }
  window.addEventListener('message', event => {
    if (event.origin !== window.PLANNING_ORIGIN || event.source !== parent || event.data?.type !== 'planning-response') return;
    const item = pending.get(event.data.id);
    if (!item) return;
    clearTimeout(item.timeout); pending.delete(event.data.id);
    if (event.data.error) item.reject(new Error(event.data.error)); else item.resolve(event.data.data);
  });
  const prefix = 'learning-planning:' + window.PLANNING_USER;
  let deviceId = localStorage.getItem(prefix + ':device');
  if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem(prefix + ':device', deviceId); }
  const status = $('#cloud-status');
  const BACKUP_DELAY = 1000;
  let timer, busy = false, applying = false;
  let observed = JSON.parse(JSON.stringify(library));
  let backedUp = '';
  let clock = Date.now();
  for (const board of library.boards) for (const stamp of Object.values(board.versions || {})) clock = Math.max(clock, Number(String(stamp).split(':')[0]) || 0);
  const content = () => JSON.stringify({ boards: library.boards, deleted: library.deleted || {} });
  $('#device-name').value = localStorage.getItem(prefix + ':name') || 'My device';
  function schedule() {
    if (applying) return;
    const stamp = String(clock = Math.max(Date.now(), clock + 1)).padStart(16, '0') + ':' + deviceId;
    library.deleted ||= {};
    for (const board of library.boards) {
      const before = observed.boards.find(b => b.id === board.id);
      const fields = planningFields(board.data), old = before ? planningFields(before.data) : {};
      board.versions ||= {};
      for (const [key, value] of Object.entries(fields)) {
        if (JSON.stringify(value) !== JSON.stringify(old[key])) board.versions[key] = stamp;
      }
    }
    for (const old of observed.boards) if (!library.boards.some(b => b.id === old.id)) library.deleted[old.id] = stamp;
    observed = JSON.parse(JSON.stringify(library));
    try { localStorage.setItem(prefix, JSON.stringify(library)); } catch { status.textContent = 'Storage unavailable — export to keep your work'; }
    clearTimeout(timer);
    if (content() !== backedUp) {
      status.textContent = navigator.onLine ? 'Saved locally · syncing…' : 'Offline · saved on this device';
      timer = setTimeout(backup, BACKUP_DELAY);
    }
  }
  async function backup() {
    clearTimeout(timer);
    if (busy || !navigator.onLine) return;
    busy = true;
    try {
      const { documents } = await request('list');
      // Do not replace an open editor or a focused text input while typing.
      if (document.querySelector('dialog[open]') || ['TEXTAREA', 'INPUT'].includes(document.activeElement?.tagName)) {
        if (content() !== backedUp) await upload();
        return;
      }
      const before = content();
      for (const doc of documents) {
        let remote;
        try { remote = JSON.parse(doc.payload).library; } catch { continue; }
        if (!remote?.boards?.every(b => typeof b.id === 'string' && validBoard(b.data))) continue;
        remote.boards.forEach(b => { b.data = normalizeBoard(b.data); mergeAdditionalNotes(b.data); });
        planningMerge(library, remote);
        for (const board of remote.boards) for (const stamp of Object.values(board.versions || {})) clock = Math.max(clock, Number(String(stamp).split(':')[0]) || 0);
      }
      if (!library.boards.length) library.boards.push({ id: newId(), data: blankBoard() });
      if (content() !== before) {
        applying = true;
        if (!library.boards.some(b => b.id === currentId)) currentId = library.boards[0].id;
        state = library.boards.find(b => b.id === currentId).data;
        $('#title').value = state.title;
        observed = JSON.parse(JSON.stringify(library));
        render(); refreshBoards(); applying = false;
      }
      if (content() !== backedUp) await upload();
      status.textContent = 'Synced to your account';
    } catch (error) {
      status.textContent = 'Saved locally · sync will retry';
      $('#cloud-message').textContent = error.message;
    } finally { applying = false; busy = false; }
  }
  async function upload() {
    const snapshot = content();
    const payload = JSON.stringify({ version: 2, device: $('#device-name').value.trim().slice(0,60) || 'My device', savedAt: new Date().toISOString(), library });
    if (new TextEncoder().encode(payload).length > 950000) throw new Error('Boards are too large to sync. Export a backup.');
    await request('save', { deviceId, payload });
    backedUp = snapshot;
    status.textContent = content() === backedUp ? 'Synced to your account' : 'Saved locally · syncing…';
  }
  async function listBackups() {
    const list = $('#cloud-backups'); list.replaceChildren();
    $('#cloud-message').textContent = 'Loading saved devices…';
    try {
      const { documents } = await request('list');
      for (const doc of documents) {
        const backup = JSON.parse(doc.payload);
        if (!backup.library?.boards?.every(b => validBoard(b.data))) continue;
        const row = document.createElement('div');
        const restore = document.createElement('button');
        restore.textContent = 'Restore ' + (backup.device || 'device') + ' · ' + new Date(doc.updatedAt).toLocaleString();
        restore.onclick = () => {
          if (!save()) { toast('Export your work before restoring: local storage is full.'); return; }
          const original = JSON.parse(JSON.stringify(library));
          let count = 0;
          for (const board of backup.library.boards) {
            const data = normalizeBoard(board.data);
            if (library.boards.some(b => JSON.stringify(b.data) === JSON.stringify(data))) continue;
            library.boards.push({ id: newId(), data }); count++;
          }
          preserveOverflow();
          library.boards.forEach(board => mergeAdditionalNotes(board.data));
          if (!save()) { library = original; state = library.boards.find(b => b.id === currentId).data; toast('Restore could not be saved. Free device space and retry.'); return; }
          refreshBoards(); toast('Restored ' + count + ' boards. Existing boards kept.');
        };
        row.append(restore);
        if (doc.deviceId !== deviceId) {
          const remove = document.createElement('button'); remove.textContent = 'Delete backup';
          remove.onclick = async () => {
            if (!confirm('Delete this device’s cloud backup? Local boards on that device will remain.')) return;
            try { await request('delete', { deviceId: doc.deviceId }); await listBackups(); }
            catch (error) { $('#cloud-message').textContent = error.message; }
          };
          row.append(remove);
        }
        list.append(row);
      }
      $('#cloud-message').textContent = documents.length ? 'Restore adds boards to this device.' : 'No saved devices yet.';
    } catch (error) { $('#cloud-message').textContent = error.message; }
  }
  window.brainstormingSaved = schedule;
  $('#device-name').onchange = event => { localStorage.setItem(prefix + ':name', event.target.value); schedule(); };
  $('#cloud-open').onclick = () => { $('#cloud-dialog').showModal(); void listBackups(); };
  $('#cloud-save').onclick = backup;
  $('#save-board').addEventListener('click', () => { void backup(); });
  $('#cloud-list').onclick = listBackups;
  window.addEventListener('online', () => { void backup(); });
  window.addEventListener('offline', () => { status.textContent = 'Offline · saved on this device'; });
  window.addEventListener('focus', () => { void backup(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void backup(); });
  document.addEventListener('focusout', () => { clearTimeout(timer); timer = setTimeout(backup, BACKUP_DELAY); });
  setInterval(() => { if (!document.hidden) void backup(); }, 10000);
  void backup();
})();
