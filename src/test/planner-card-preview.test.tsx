import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {PlannerCardPreview} from '@/components/planner/PlannerCardPreview';
import {PlannerResourceTray} from '@/components/planner/PlannerResourceTray';
import type {LessonSlot} from '@/services/unit-planning';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const item:LessonSlot={id:'text',kind:'text',title:'A long article title that should never be shortened in its expanded view',content:'Full description\nSecond paragraph',url:'https://example.com/article',minutes:10,optional:false,status:'planned'};
it('expands bank cards without selecting or changing their placement',()=>{
 const preview=vi.fn(),select=vi.fn();
 render(<PlannerResourceTray resources={[]} week="2026-09-21" lessons={[]} items={[{...item,course:'AP'}]} onSelect={select} onPreview={preview} onAdd={()=>{}}/>);
 fireEvent.click(screen.getByTitle(item.title));
 expect(preview).toHaveBeenCalledWith(expect.objectContaining({id:item.id,content:item.content}));
 expect(select).not.toHaveBeenCalled();
});
it('shows and copies the full title, description and link, with separate actions',async()=>{
 const copy=vi.fn().mockResolvedValue(undefined),close=vi.fn(),edit=vi.fn(),place=vi.fn();
 vi.stubGlobal('navigator',{clipboard:{writeText:copy}});
 render(<PlannerCardPreview item={item} onClose={close} onEdit={edit} onPlace={place}/>);
 expect(screen.getByRole('heading',{name:item.title})).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Copy card text'}));
 await waitFor(()=>expect(copy).toHaveBeenCalledWith([item.title,item.content,item.url].join('\n\n')));
 fireEvent.click(screen.getByRole('button',{name:'Edit card'}));expect(edit).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Add to a lesson'}));expect(place).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Close dialog'}));expect(close).toHaveBeenCalledOnce();
});
