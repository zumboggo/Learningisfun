import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {PlannerResourceTray} from '@/components/planner/PlannerResourceTray';
import {routineNames,routineSlot} from '@/services/planner-routines';
afterEach(cleanup);
it('keeps TQE and debate visible and other routines collapsed, draggable and placeable',()=>{
 const place=vi.fn();
 render(<PlannerResourceTray resources={[]} week="2026-09-21" lessons={[]} onSelect={()=>{}} onAdd={()=>{}} onPlace={place} items={routineNames.map(name=>({...routineSlot(name),course:'WL'}))}/>);
 expect(screen.getByRole('button',{name:'TQE'})).toBeVisible();
 expect(screen.getByRole('button',{name:'Pop-up Debate'})).toBeVisible();
 const other=screen.getByText('Text Rendering',{exact:true});
 const details=other.closest('details')!;
 expect(details).not.toHaveAttribute('open');
 expect(other.closest('[draggable]')).toHaveAttribute('draggable','true');
 fireEvent.click(details.querySelector('summary')!);
 details.open=true;
 fireEvent.click(screen.getByRole('button',{name:'Add Text Rendering to a lesson'}));
 expect(place).toHaveBeenCalledWith(expect.objectContaining({title:'Text Rendering'}));
});
it('reveals matching optional routines when searching',()=>{
 render(<PlannerResourceTray resources={[]} week="2026-09-21" lessons={[]} onSelect={()=>{}} onAdd={()=>{}} items={routineNames.map(name=>({...routineSlot(name),course:'WL'}))}/>);
 fireEvent.change(screen.getByLabelText('Search weekly resources'),{target:{value:'Microlabs'}});
 expect(screen.getByText('Microlabs',{exact:true}).closest('details')).toHaveAttribute('open');
});
