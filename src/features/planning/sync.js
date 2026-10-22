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
  const BACKUP_DELAY = 60000;
  let timer, busy = false, dirty = true, observed, backedUp;
  const content = () => JSON.stringify({ device: $('#device-name').value.trim() || 'My device', boards: library.boards });
  $('#device-name').value = localStorage.getItem(prefix + ':name') || 'My device';
  function schedule() {
    const current = content();
    if (current === observed) return;
    observed = current; dirty = current !== backedUp;
    clearTimeout(timer);
    if (dirty) {
      status.textContent = navigator.onLine ? 'Saved locally · cloud backup after 1 minute idle' : 'Offline · saved on this device';
      timer = setTimeout(backup, BACKUP_DELAY);
    }
  }
  async function backup() {
    clearTimeout(timer);
    if (busy) return;
    if (!dirty && content() === backedUp) return;
    if (!navigator.onLine) { status.textContent = 'Offline · saved on this device'; return; }
    busy = true; dirty = false; let success = false;
    const snapshot = content();
    status.textContent = 'Backing up…';
    try {
      const payload = JSON.stringify({ version: 1, device: $('#device-name').value.trim() || 'My device', savedAt: new Date().toISOString(), library });
      if (new TextEncoder().encode(payload).length > 950000) throw new Error('Backup is too large. Use Back up boards to save a file.');
      await request('save', { deviceId, payload });
      success = true; backedUp = snapshot; dirty = content() !== backedUp;
      status.textContent = dirty ? 'Saved locally · cloud backup pending' : 'Private cloud backup saved';
      $('#cloud-message').textContent = 'All boards on this device are backed up to your account.';
    } catch (error) {
      dirty = true; status.textContent = 'Saved locally · cloud backup needs attention';
      $('#cloud-message').textContent = error.message;
    } finally {
      busy = false;
      if (success && dirty) { clearTimeout(timer); timer = setTimeout(backup, BACKUP_DELAY); }
    }
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
  window.addEventListener('online', () => { if (dirty) void backup(); });
  window.addEventListener('offline', () => { status.textContent = 'Offline · saved on this device'; });
  schedule();
})();
