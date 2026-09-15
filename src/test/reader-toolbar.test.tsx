import { afterEach,describe,it,expect,vi } from 'vitest';
import { cleanup,render,screen,fireEvent } from '@testing-library/react';
import { ReaderToolbar } from '@/components/texts/ReaderToolbar';
import { ParagraphCard } from '@/pages/TextReaderPage';
afterEach(cleanup);
describe('calm reader controls',()=>{
  it('puts article and original first and hides collapsed tools',()=>{
    const onPanel=vi.fn(),onSize=vi.fn();
    render(<ReaderToolbar mode="article" panel={null} onArticle={vi.fn()} onOriginal={vi.fn()} onPanel={onPanel} size={22} onSize={onSize}><p>Hidden controls</p></ReaderToolbar>);
    expect(screen.getAllByRole('button').slice(0,2).map(b=>b.textContent)).toEqual(['Article Mode','Original Text']);
    expect(screen.queryByText('Hidden controls')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:/Support/}));expect(onPanel).toHaveBeenCalledWith('support');
    fireEvent.click(screen.getByRole('button',{name:'Larger text'}));expect(onSize).toHaveBeenCalledWith(24);
  });
  it('keeps paragraph numbers but removes annotation controls',()=>{
    const onAnnotate=vi.fn();
    const props={article:true,paragraph:{$id:'p',textId:'t',sortOrder:0,content:'Read calmly.'},index:0,onAnnotate,onHighlight:vi.fn()};
    const {rerender}=render(<ParagraphCard {...props} readOnly={false}/>);
    expect(screen.getByLabelText('Paragraph 1')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Add annotation to paragraph 1'})).not.toBeInTheDocument();
    expect(screen.queryByText('Annotate paragraph 1')).not.toBeInTheDocument();
    rerender(<ParagraphCard {...props} readOnly/>);
    expect(screen.queryByRole('button',{name:/Add annotation/})).not.toBeInTheDocument();
  });
});
