import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyTextLink, sharedReadingDestination, textShareContent } from '@/utils/text-share';
afterEach(()=>vi.unstubAllGlobals());
describe('share reading links',()=>{
  it('uses the deployed base path and escapes formatted titles',()=>{
    const result=textShareContent('reading','A & <B>','https://zumboggo.github.io/Learningisfun/?old=1#/texts');
    expect(result.url).toBe('https://zumboggo.github.io/Learningisfun/#/texts/reading');
    expect(result.html).toContain('A &amp; &lt;B&gt;</a>');
    expect(result.plain).toBe(`A & <B>\n${result.url}`);
  });
  it('only returns internal reading destinations after sign-in',()=>{
    expect(sharedReadingDestination({from:'/texts/reading'})).toBe('/texts/reading');
    for(const from of ['//example.com','https://example.com','/login','/texts/a/../login'])expect(sharedReadingDestination({from})).toBeUndefined();
  });
  it('copies both HTML and plain text where supported',async()=>{
    const write=vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator',{clipboard:{write}});
    vi.stubGlobal('ClipboardItem',class {data:Record<string,Blob>;constructor(data:Record<string,Blob>) {this.data=data;}});
    await copyTextLink('reading','Reading title');
    expect(Object.keys(write.mock.calls[0][0][0].data)).toEqual(['text/html','text/plain']);
  });
  it('falls back to title plus URL when rich copying is blocked',async()=>{
    const writeText=vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator',{clipboard:{write:vi.fn().mockRejectedValue(Error('Blocked')),writeText}});
    vi.stubGlobal('ClipboardItem',class {});
    await copyTextLink('reading','Reading title');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Reading title\n'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#/texts/reading'));
  });
});
