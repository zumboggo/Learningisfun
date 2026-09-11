import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {TextSource} from '@/components/texts/TextSource';
import {ParagraphCard} from '@/pages/TextReaderPage';
afterEach(cleanup);
it('renders the original source as a safe external link',()=>{
  render(<TextSource source="Magazine" url="https://example.com/article"/>);
  expect(screen.getByRole('link',{name:/Read original source/})).toHaveAttribute('href','https://example.com/article');
});
it('supports existing URL sources but never creates script links',()=>{
  const {rerender}=render(<TextSource source="https://example.com"/>);
  expect(screen.getByRole('link')).toHaveAttribute('href','https://example.com/');
  rerender(<TextSource source="Magazine" url="javascript:alert(1)"/>);
  expect(screen.queryByRole('link')).toBeNull();
});
it('does not render a stray zero when a paragraph has no TQE notes',()=>{
  const {container}=render(<ParagraphCard article density={0} index={0} paragraph={{$id:'p',textId:'t',sortOrder:0,content:'The article begins here.'}} readOnly onAnnotate={vi.fn()} onHighlight={vi.fn()}/>);
  expect(container.textContent).toBe('The article begins here.');
});
