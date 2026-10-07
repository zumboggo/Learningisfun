import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MarkdownPasteEditor } from '@/components/common/MarkdownPasteEditor';
import { htmlToMarkdown } from '@/utils/rich-text';
import { hostReadingImages } from '@/services/reading-image.service';
import { Markdown, countMarkdownWords } from '@/components/common/Markdown';
import { executeLearningContent } from '@/services/learning-content.service';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
vi.mock('@/lib/appwrite',()=>({functions:{createExecution:vi.fn()}}));
afterEach(()=>{cleanup();vi.resetAllMocks();});
const fileId='img_0123456789_01234567890123456789';
describe('illustrated readings',()=>{
 it('keeps picture order and captions, including lazy and relative images',()=>{
   const result=htmlToMarkdown('<p>Before.</p><figure><img data-src="/photo.jpg" alt="A meeting"><figcaption>Photo credit: Example</figcaption></figure><p>After.</p>','https://example.org/article',true);
   expect(result).toBe('Before.\n\n![A meeting](https://example.org/photo.jpg)\n*Photo credit: Example*\n\nAfter.');
 });
 it('keeps an inline picture within its original paragraph',()=>{
   expect(htmlToMarkdown('<p>Before<img src="https://example.org/a.png" alt="A">after</p>',undefined,true)).toBe('Before ![A](https://example.org/a.png) after');
 });
 it('does not silently drop an image without a usable source',()=>{
   expect(htmlToMarkdown('<img src="/photo.jpg">',undefined,true)).toContain('Image could not be copied');
   expect(htmlToMarkdown('<img src="javascript:alert(1)">',undefined,true)).not.toContain('javascript');
 });
 it('copies each distinct source once and stores durable references',async()=>{
   vi.mocked(executeLearningContent).mockResolvedValue({fileId});
   const result=await hostReadingImages('![A](https://x.test/a.jpg)\n\n![Again](https://x.test/a.jpg)','text');
   expect(executeLearningContent).toHaveBeenCalledTimes(1);
   expect(result).toBe(`![A](reading-image:text:${fileId})\n\n![Again](reading-image:text:${fileId})`);
   await hostReadingImages(result,'text');
   expect(executeLearningContent).toHaveBeenCalledTimes(1);
 });
 it('fails the save with actionable feedback when an image cannot be copied',async()=>{
   vi.mocked(executeLearningContent).mockRejectedValue(new Error('Blocked'));
   await expect(hostReadingImages('![Meeting](https://x.test/a.jpg)','text')).rejects.toThrow('Could not save picture “Meeting”');
 });
 it('renders a stored image through an authorized short-lived URL',async()=>{
   vi.mocked(executeLearningContent).mockResolvedValue({url:'https://storage.test/image?token=temporary'});
   render(<Markdown content={`Before ![Meeting](reading-image:text:${fileId}) after`}/>);
   const image=await screen.findByRole('img',{name:'Meeting'});
   expect(image).toHaveAttribute('src','https://storage.test/image?token=temporary');
   expect(image).toHaveAttribute('referrerpolicy','no-referrer');
   expect(screen.getByText('Before', {exact:false})).toBeInTheDocument();
 });
 it('does not count picture URLs or alt text as words to read',()=>{
   expect(countMarkdownWords('Two words ![Long alternative description](https://x.test/a.jpg)')).toBe(2);
 });
 it('rejects active image URLs',async()=>{
   render(<Markdown content='![Unsafe](javascript:alert)'/>);
   await waitFor(()=>expect(screen.queryByRole('img')).not.toBeInTheDocument());
   expect(await screen.findByText(/Picture unavailable/)).toBeInTheDocument();
 });
});

it('the reading editor preserves pasted article pictures at the cursor',()=>{
 const changed=vi.fn();
 render(<MarkdownPasteEditor images baseUrl="https://example.org/article" value="" onChange={changed} preview={false}/>);
 fireEvent.paste(screen.getByRole('textbox'),{clipboardData:{getData:(type:string)=>type==='text/html'?'<p>Before</p><img src="/photo.jpg" alt="Meeting"><p>After</p>':'',files:[]}});
 expect(changed.mock.calls[0][0]).toContain('![Meeting](https://example.org/photo.jpg)');
 expect(screen.getByRole('button',{name:'Add picture'})).toBeInTheDocument();
});
it('picture controls stay limited to reading editors and disabled during saving',()=>{
 const {rerender}=render(<MarkdownPasteEditor value="" onChange={vi.fn()}/>);
 expect(screen.queryByRole('button',{name:'Add picture'})).not.toBeInTheDocument();
 rerender(<MarkdownPasteEditor images disabled value="" onChange={vi.fn()}/>);
 expect(screen.getByRole('textbox')).toBeDisabled();
 expect(screen.getByRole('button',{name:'Add picture'})).toBeDisabled();
});
