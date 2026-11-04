import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {CitationBuilder} from '@/pages/CitationBuilder';
afterEach(cleanup);
it('assembles by selection and swaps two misplaced pieces without dragging',()=>{
 const change=vi.fn();render(<CitationBuilder pieces={['Book.','Author.']} onChange={change}/>);
 const click=(name:string|RegExp)=>fireEvent.click(screen.getByRole('button',{name}));
 click('Book.');click(/^1 Place/);click('Author.');click(/^2 Place/);expect(change).toHaveBeenLastCalledWith('Book. Author.');
 click(/^2 Author/);click(/^1 Book/);expect(change).toHaveBeenLastCalledWith('Author. Book.');
});
it('accepts dragged pieces and does not submit an incomplete citation',()=>{
 const change=vi.fn();render(<CitationBuilder pieces={['Year.','Title.']} onChange={change}/>);
 const data=new Map<string,string>();const dataTransfer={setData:(k:string,v:string)=>data.set(k,v),getData:(k:string)=>data.get(k)||''};
 for(const [source,slot] of [['Title.',/^1 Place/] as const,['Year.',/^2 Place/] as const]){
 fireEvent.dragStart(screen.getByRole('button',{name:source}),{dataTransfer});fireEvent.drop(screen.getByRole('button',{name:slot}),{dataTransfer});}
 expect(change.mock.calls).toEqual([[''],['Title. Year.']]);
});
