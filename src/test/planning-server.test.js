import { test } from 'vitest';
import assert from 'node:assert/strict';
import { handlePlanning, validatePayload } from '../../functions/teacher-planning/src/handler.js';
const payload = JSON.stringify({ device: 'Laptop', library: { currentId: 'board', boards: [{ id: 'board', data: { title: 'Private lesson', rowCount: 8, columnCount: 10, rows: Array(10).fill(''), cards: Array(100).fill(''), notes: ['', ''], footerNote: '' } }] } });
function fixture() {
  const docs = new Map(); const calls = [];
  const db = {
    async getDocument(database, collection, id) { return { role: id.startsWith('student') ? 'student' : id === 'parent' ? 'parent' : 'teacher' }; },
    async updateDocument(database, collection, id, data) { if (!docs.has(id)) throw { code: 404 }; docs.set(id, { ...docs.get(id), ...data }); },
    async createDocument(database, collection, id, data, permissions) { docs.set(id, { $id: id, ...data, permissions }); },
    async deleteDocument(database, collection, id) { docs.delete(id); },
    async listDocuments(database, collection, queries) { calls.push(queries); const q = queries.map(JSON.parse).find(q => q.attribute === 'ownerId'); return { documents: [...docs.values()].filter(d => d.ownerId === q.values[0]) }; },
  };
  return { db, docs, calls };
}
test('anonymous and parent calls cannot reach private data', async () => {
  const { db, docs } = fixture();
  for (const action of ['list', 'save', 'delete']) {
    await assert.rejects(handlePlanning({ db, userId: '', body: { action } }), { code: 401 });
    await assert.rejects(handlePlanning({ db, userId: 'parent', body: { action } }), { code: 403 });
  }
  assert.equal(docs.size, 0);
});
test('students and teachers sharing a device ID cannot read, replace or delete each other’s plans', async () => {
  const { db, docs } = fixture();
  const invoke = (userId, action, extra = {}) => handlePlanning({ db, userId, body: { action, deviceId: 'same-device', payload, ...extra } });
  await invoke('alice', 'save'); await invoke('student-bob', 'save', { ownerId: 'alice' });
  assert.equal(docs.size, 2);
  assert.deepEqual([...docs.values()].map(d => d.permissions), [['read("user:alice")'], ['read("user:student-bob")']]);
  assert.equal((await invoke('alice', 'list')).documents.length, 1);
  await invoke('student-bob', 'delete', { ownerId: 'alice' });
  assert.equal(docs.size, 1); assert.equal([...docs.values()][0].ownerId, 'alice');
  await invoke('alice', 'save'); assert.equal(docs.size, 1);
});
test('rejects malformed and oversized backups before database writes', () => {
  for (const input of ['invalid', '{}', 'x'.repeat(950001), JSON.stringify({ device: 'x', library: { boards: [null] } })]) {
    assert.throws(() => validatePayload(input));
  }
  assert.equal(validatePayload(payload), payload);
});

test('students can save, update, list and delete their own private boards', async () => {
  const { db, docs } = fixture();
  const invoke = (userId, action) => handlePlanning({ db, userId, body: { action, deviceId: 'phone', payload } });
  await invoke('student-one', 'save');
  await invoke('student-two', 'save');
  await invoke('student-one', 'save');
  assert.equal(docs.size, 2);
  assert.equal((await invoke('student-one', 'list')).documents.length, 1);
  await invoke('student-one', 'delete');
  assert.equal((await invoke('student-one', 'list')).documents.length, 0);
  assert.equal((await invoke('student-two', 'list')).documents.length, 1);
});
