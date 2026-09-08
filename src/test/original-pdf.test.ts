import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error Independently deployed server module.
import { originalPdfAction, ownsPdf, authorizeTextMutation } from '../../functions/learning-content/src/original-pdf.js';

function context() {
  return { body: { action: 'uploadOriginalPdf', data: btoa('%PDF-1.4\nExample'), name: 'Reading.pdf' }, profile: { role: 'teacher' }, userId: 'teacher', memberClassIds: new Set<string>(), databaseId: 'main', endpoint: 'https://example.com/v1', projectId: 'project', storage: { createFile: vi.fn().mockResolvedValue({}) }, tokens: { createFileToken: vi.fn().mockResolvedValue({ secret: 'short-lived-token' }) }, db: { getDocument: vi.fn(), listDocuments: vi.fn().mockResolvedValue({ documents: [] }) } };
}
describe('private original PDFs', () => {
  it('stores exact bytes privately and reuses the same ID on retries', async () => {
    const c = context();
    const first = await originalPdfAction(c);
    c.storage.createFile.mockRejectedValueOnce({ code: 409 });
    expect(await originalPdfAction(c)).toEqual(first);
    expect(ownsPdf('teacher', first.fileId)).toBe(true);
    expect(ownsPdf('other', first.fileId)).toBe(false);
    expect(c.storage.createFile.mock.calls[0][0].permissions).toEqual([]);
    expect(new TextDecoder().decode(await c.storage.createFile.mock.calls[0][0].file.toUint8Array())).toBe('%PDF-1.4\nExample');
  });
  it('rejects student uploads, invalid headers and oversized uploads', async () => {
    const c = context(); c.profile.role = 'student';
    await expect(originalPdfAction(c)).rejects.toThrow('Only teachers');
    c.profile.role = 'teacher'; c.body.data = btoa('Not PDF');
    await expect(originalPdfAction(c)).rejects.toThrow('valid PDF');
    c.body.data = 'a'.repeat(7000001);
    await expect(originalPdfAction(c)).rejects.toThrow('5 MB');
    expect(c.storage.createFile).not.toHaveBeenCalled();
  });
  it('requires current class access and published status before issuing a short-lived URL', async () => {
    const c = context(); const { fileId } = await originalPdfAction(c);
    Object.assign(c.body, { action: 'readOriginalPdf', textId: 'text' });
    c.db.getDocument.mockResolvedValue({ $id: 'text', teacherId: 'teacher', originalPdfId: fileId, status: 'published' });
    c.profile.role = 'student'; c.userId = 'student'; c.memberClassIds.add('class');
    await expect(originalPdfAction(c)).rejects.toThrow('not available');
    expect(c.tokens.createFileToken).not.toHaveBeenCalled();
    c.db.listDocuments.mockResolvedValue({ documents: [{ classId: 'class' }] });
    const { url } = await originalPdfAction(c);
    expect(url).toContain('/view?project=project&token=short-lived-token');
    expect(Date.parse(c.tokens.createFileToken.mock.calls[0][0].expire) - Date.now()).toBeLessThanOrEqual(300000);
    c.db.getDocument.mockResolvedValue({ $id: 'text', teacherId: 'teacher', originalPdfId: fileId, status: 'draft' });
    await expect(originalPdfAction(c)).rejects.toThrow('not available');
  });
  it('denies forged cross-teacher file references even on an owned text', async () => {
    const c = context(); const { fileId } = await originalPdfAction(c);
    Object.assign(c.body, { action: 'readOriginalPdf', textId: 'text' });
    c.userId = 'other'; c.db.getDocument.mockResolvedValue({ $id: 'text', teacherId: 'other', originalPdfId: fileId });
    await expect(originalPdfAction(c)).rejects.toThrow('No original PDF');
  });
  it('blocks upsert impersonation and reassignment of another teacher’s reading', async () => {
    const c = context();
    c.db.getDocument.mockResolvedValue({ teacherId: 'other', textId: 'other-text' });
    await expect(authorizeTextMutation({ ...c, collection: 'texts', id: 'existing', data: { teacherId: 'teacher' } })).rejects.toThrow('Only the text owner');
    await expect(authorizeTextMutation({ ...c, collection: 'text_assignments', id: 'assignment', data: { textId: 'other-text', classId: 'my-class' } })).rejects.toThrow('Only the text owner');
  });
});
