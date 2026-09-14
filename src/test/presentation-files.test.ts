import { describe,it,expect,vi } from 'vitest';
// @ts-expect-error Separately deployed backend module
import { presentationFileAction, ownsPlannerPresentation } from '../../functions/learning-content/src/presentation-files.js';
const context=()=>({
  body:{action:'uploadPresentationFile',classId:'class',title:'Slides',name:'slides.pptx',data:btoa('PK\x03\x04test'),linkId:'link'},profile:{role:'teacher'},userId:'teacher',memberClassIds:new Set<string>(),databaseId:'main',endpoint:'https://example.com/v1',projectId:'project',
  db:{getDocument:vi.fn().mockResolvedValue({$id:'class',teacherId:'teacher'}),createDocument:vi.fn().mockResolvedValue({$id:'link'})},
  storage:{createFile:vi.fn().mockResolvedValue({}),deleteFile:vi.fn().mockResolvedValue({})},tokens:{createFileToken:vi.fn().mockResolvedValue({secret:'temporary'})}
});
describe('class PowerPoint files',()=>{
  it('stores planner attachments privately without creating class posts',async()=>{
    const c=context();c.body.action='uploadPlannerPresentation';
    const result=await presentationFileAction(c);
    expect(ownsPlannerPresentation('teacher',result.url)).toBe(true);
    expect(ownsPlannerPresentation('other',result.url)).toBe(false);
    expect(c.db.createDocument).not.toHaveBeenCalled();
    c.profile.role='student';await expect(presentationFileAction(c)).rejects.toThrow('Only teachers');
  });
  it('shares one stored file across selected classes, deduplicating selections',async()=>{
    const c=context();
    const result=await presentationFileAction({...c,body:{...c.body,classIds:['blue','red','blue']}});
    expect(result.links).toHaveLength(2);
    expect(c.storage.createFile).toHaveBeenCalledTimes(1);
    expect(c.db.createDocument.mock.calls.map(call=>call[3].classId)).toEqual(['blue','red']);
    expect(c.db.createDocument.mock.calls[0][3].url).toBe(c.db.createDocument.mock.calls[1][3].url);
  });
  it('uploads privately and creates a class reference, not a permanent public URL',async()=>{
    const c=context();await presentationFileAction(c);
    expect(c.storage.createFile.mock.calls[0][0].permissions).toEqual([]);
    expect(c.db.createDocument.mock.calls[0][3]).toMatchObject({teacherId:'teacher',classId:'class',url:expect.stringMatching(/^presentation-file:/)});
  });
  it('rejects students and other teachers uploading to the class',async()=>{
    const c=context();c.profile.role='student';await expect(presentationFileAction(c)).rejects.toThrow('Only teachers');
    c.profile.role='teacher';c.userId='other';await expect(presentationFileAction(c)).rejects.toThrow('own this class');
    expect(c.storage.createFile).not.toHaveBeenCalled();
  });
  it('rejects invalid and oversized files',async()=>{
    const c=context();c.body.data=btoa('not a powerpoint');await expect(presentationFileAction(c)).rejects.toThrow('valid PowerPoint');
    c.body.data='A'.repeat(7000001);await expect(presentationFileAction(c)).rejects.toThrow('5 MB');
  });
  it('cleans up an uploaded file when its class entry cannot be saved',async()=>{
    const c=context();c.db.createDocument.mockRejectedValue(new Error('save failed'));await expect(presentationFileAction(c)).rejects.toThrow('save failed');expect(c.storage.deleteFile).toHaveBeenCalled();
  });
  it('requires class membership before issuing a short-lived download URL',async()=>{
    const c=context();c.body.action='downloadPresentationFile';c.profile.role='student';c.db.getDocument.mockResolvedValue({teacherId:'teacher',classId:'class',url:'presentation-file:abc'});
    await expect(presentationFileAction(c)).rejects.toThrow('not available');expect(c.tokens.createFileToken).not.toHaveBeenCalled();
    c.memberClassIds.add('class');expect((await presentationFileAction(c)).url).toContain('/abc/download?');
    expect(Date.parse(c.tokens.createFileToken.mock.calls[0][0].expire)-Date.now()).toBeLessThanOrEqual(300000);
  });
});
