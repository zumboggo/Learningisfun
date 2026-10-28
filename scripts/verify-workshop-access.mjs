// Creates disposable accounts; does not publish posts, alter existing lessons, or call paid AI.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client, Databases, Functions, Users, Query } from 'node-appwrite';
import { allRows, recordId } from '../functions/learning-content/src/teacher-workspace.js';
import { WORKSHOP_CLASS_ID } from '../functions/learning-content/src/workshop-policy.js';
loadEnvFile(join(homedir(), '.config/learningisfun/appwrite.env'));
loadEnvFile(join(homedir(), '.config/learningisfun/teacher-onboarding.env'));
const endpoint = process.env.APPWRITE_ENDPOINT, project = process.env.APPWRITE_PROJECT_ID, databaseId = process.env.APPWRITE_DATABASE_ID || 'main';
const admin = new Client().setEndpoint(endpoint).setProject(project).setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(admin), users = new Users(admin), created = [], ownClasses = [];
async function call(client, body) {
  const execution = await new Functions(client).createExecution({ functionId: 'learning-content', body: JSON.stringify(body) });
  const value = JSON.parse(execution.responseBody || '{}');
  if (execution.responseStatusCode >= 400 || value.error) throw Object.assign(Error(value.error || 'Execution failed'), { code: execution.responseStatusCode });
  return value;
}
const deny = promise => assert.rejects(promise, error => [400, 401, 403, 404].includes(error.code));
async function temporary() {
  const id = 'wscheck-' + randomUUID().slice(0, 20);
  await users.create({ userId: id, email: id + '@example.invalid', password: randomUUID() + 'Aa1!', name: 'Temporary workshop check' });
  created.push(id);
  const session = await users.createSession({ userId: id });
  const jwt = await users.createJWT({ userId: id, sessionId: session.$id, duration: 900 });
  const client = new Client().setEndpoint(endpoint).setProject(project).setJWT(jwt.jwt);
  await call(client, { action: 'selfProfile' });
  return { id, client };
}
try {
  const workshop = await db.getDocument(databaseId, 'classes', WORKSHOP_CLASS_ID);
  const guide = (await allRows(db, databaseId, 'texts', [Query.equal('teacherId', workshop.teacherId), Query.equal('title', 'A Guide to Learning is Fun App')]))[0];
  assert(guide); assert.equal(guide.publicReadEnabled, false);
  const teacher = await temporary(), learner = await temporary();
  await call(teacher.client, { action: 'redeemTeacherInvitation', code: process.env.TEACHER_INVITATION_CODE });
  const reading = { action: 'readTexts', workshop: true, classIds: [WORKSHOP_CLASS_ID], textId: guide.$id, includeContent: true };
  assert.equal((await call(teacher.client, { action: 'readWorkshopAccess' })).enrolled, false);
  await deny(call(teacher.client, reading));
  await deny(call(teacher.client, { action: 'joinClass', classId: WORKSHOP_CLASS_ID, role: 'student', joinCode: 'WRONG1' }));
  for (const actor of [teacher, learner]) {
    for (let retry = 0; retry < 2; retry++) await call(actor.client, { action: 'joinClass', classId: WORKSHOP_CLASS_ID, role: 'student', joinCode: workshop.joinCode });
    assert.equal((await allRows(db, databaseId, 'class_members', [Query.equal('classId', WORKSHOP_CLASS_ID), Query.equal('userId', actor.id)])).length, 1);
    const text = await call(actor.client, reading); assert.equal(text.texts[0].$id, guide.$id); assert(text.paragraphs.length > 40);
    await call(actor.client, { action: 'saveReadingQuestionDraft', workshop: true, classId: WORKSHOP_CLASS_ID, textId: guide.$id, draftId: 'private-check', content: 'Temporary private workshop check. Not published.' });
    const discussion = await call(actor.client, { action: 'readReadingDiscussion', workshop: true, classId: WORKSHOP_CLASS_ID, textId: guide.$id });
    assert.equal(discussion.teacher, false); assert.equal(discussion.canWrite, true); assert.equal(discussion.notebook.length, 1);
    await deny(call(actor.client, { action: 'readTexts', workshop: true, classIds: ['88421c66-9cda-4002-8e15-086312b7805e'] }));
    await deny(call(actor.client, { action: 'updateClassDetails', workshop: true, classId: WORKSHOP_CLASS_ID, courseName: 'Blocked', name: 'Blocked' }));
    await deny(call(actor.client, { action: 'exportWritingResponses', workshop: true, classId: WORKSHOP_CLASS_ID }));
    await deny(call(actor.client, { action: 'scopedData', collection: 'classes', operation: 'update', id: WORKSHOP_CLASS_ID, data: { name: 'Blocked' } }));
  }
  await call(learner.client, { action: 'redeemTeacherInvitation', code: process.env.TEACHER_INVITATION_CODE });
  const preserved = await call(learner.client, { action: 'readReadingDiscussion', workshop: true, classId: WORKSHOP_CLASS_ID, textId: guide.$id });
  assert.equal(preserved.notebook.length, 1); assert.equal(preserved.teacher, false);
  for (const actor of [teacher, learner]) {
    assert.equal((await call(actor.client, { action: 'selfProfile' })).profile.role, 'teacher');
    assert.equal((await call(actor.client, { action: 'readTeacherPreferences' })).legacyPlanner, false);
  }
  const ownId = 'wscheck-' + randomUUID().slice(0, 20); ownClasses.push(ownId);
  await call(teacher.client, { action: 'scopedData', collection: 'classes', operation: 'create', id: ownId, data: { teacherId: teacher.id, courseName: 'Temporary access check', name: 'Private', schoolYear: '2026', status: 'active', joinCode: 'TEMP01', joinCodeActive: true, createdAt: new Date().toISOString() } });
  await call(teacher.client, { action: 'updateClassDetails', classId: ownId, courseName: 'Temporary access check', name: 'Still teaching' });
  await deny(call(learner.client, { action: 'joinClass', classId: ownId, role: 'student', joinCode: 'TEMP01' }));
  await deny(call(learner.client, { action: 'scopedData', collection: 'classes', operation: 'get', id: ownId }));
  const library = await call(teacher.client, { action: 'animatedLibrary', workshop: true });
  assert.equal(library.drafts.length, 0); assert(library.assignments.every(a => a.classId === WORKSHOP_CLASS_ID));
  console.log('PASS: teacher and learner enrollment, idempotent retries, private guide access, learner participation, preserved work after promotion, retained teacher tools, and denied foreign access and workshop management.');
} finally {
  for (const [collection, field] of [['reading_question_drafts', 'authorId'], ['class_members', 'userId'], ['teacher_workspace', 'ownerId']]) {
    if (!created.length) continue;
    for (const row of await allRows(db, databaseId, collection, [Query.equal(field, created)])) await db.deleteDocument(databaseId, collection, row.$id);
  }
  for (const id of ownClasses) await db.deleteDocument(databaseId, 'classes', id).catch(error => { if (error.code !== 404) throw error; });
  for (const id of created) {
    await db.deleteDocument(databaseId, 'reading_question_state', recordId('teacher-lock', id)).catch(error => { if (error.code !== 404) throw error; });
    await db.deleteDocument(databaseId, 'users', id).catch(error => { if (error.code !== 404) throw error; });
    await users.delete({ userId: id });
  }
  console.log('Disposable accounts, memberships, drafts, and private test class removed.');
}
