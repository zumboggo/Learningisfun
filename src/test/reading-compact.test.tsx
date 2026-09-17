import { expect,it,vi } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExpandableContribution } from '@/components/discussions/ExpandableContribution';
import { contributionPreview } from '@/utils/contribution-preview';
import { ReadingDiscussionsList } from '@/components/texts/ReadingDiscussionsList';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:async()=>({readings:[
 {id:'1',textId:'t',classId:'blue',className:'Blue',title:'A reading',date:'2026-09-15',available:true},
 {id:'2',textId:'t',classId:'red',className:'Red',title:'A reading',date:'2026-09-15',available:true},
]})}));
it('shows five sentences, expands and collapses without losing text',()=>{
 const content='One. Two. Three. Four. Five. Six.';
 render(<ExpandableContribution content={content}/>);
 expect(contributionPreview(content)).toBe('One. Two. Three. Four. Five.…');
 fireEvent.click(screen.getByRole('button',{name:'Read more'}));
 expect(screen.getByText(content)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Show less'}));
 expect(screen.getByRole('button',{name:'Read more'})).toHaveAttribute('aria-expanded','false');
});
it('never collapses presentation text and bounds unpunctuated writing',()=>{
 const content='word '.repeat(300);
 expect(contributionPreview(content).length).toBeLessThanOrEqual(751);
 render(<ExpandableContribution content={content} present/>);
 expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
it('nests texts within weeks within distinct collapsed classes',async()=>{
 render(<MemoryRouter><ReadingDiscussionsList/></MemoryRouter>);
 const links=await screen.findAllByText('A reading');
 expect(links).toHaveLength(2);
 const week=links[0].closest('details')!;
 expect(week.querySelector('summary')).toHaveTextContent('Week of 2026-09-14');
 expect(week.parentElement!.closest('details')!.querySelector('summary')).toHaveTextContent('Blue');
 expect(week.parentElement!.closest('details')).not.toHaveAttribute('open');
});
