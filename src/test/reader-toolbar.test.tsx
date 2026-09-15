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
    fireEvent.click(screen.getByRole('button',{name:/TQE/}));expect(onPanel).toHaveBeenCalledWith('tqe');
    fireEvent.click(screen.getByRole('button',{name:'Larger text'}));expect(onSize).toHaveBeenCalledWith(24);
  });
  it('uses an accessible pencil to add notes and hides it in pure reading mode',()=>{
    const onAnnotate=vi.fn();
    const props={article:true,paragraph:{$id:'p',textId:'t',sortOrder:0,content:'Read calmly.'},index:0,onAnnotate,onHighlight:vi.fn()};
    const {rerender}=render(<ParagraphCard {...props} readOnly={false}/>);
    fireEvent.click(screen.getByRole('button',{name:'Add annotation to paragraph 1'}));expect(onAnnotate).toHaveBeenCalledWith('');
    expect(screen.queryByText('Annotate paragraph 1')).not.toBeInTheDocument();
    rerender(<ParagraphCard {...props} readOnly/>);
    expect(screen.queryByRole('button',{name:/Add annotation/})).not.toBeInTheDocument();
  });
});
