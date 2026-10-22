import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import StoryPlayer from '@/components/animated/StoryPlayer';

const original=JSON.parse(readFileSync('public/stories/animated/dinner-with-the-tyrant/episode.json','utf8'));
const pack={...original,script:`story 2
scene classroom
show Lin curious center
Lin: We need a reason.
choice reason
option ask "Ask for evidence." -> evidence
option listen "Listen to the other view." -> other
label evidence
Lin: Here is the evidence.
goto finish
label other
Lin: Here is another view.
label finish
end`};
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('records one legal choice with the numbered shortcut and preserves the same save shape',async()=>{
 const save=vi.fn();render(<StoryPlayer cinema pack={pack} initial={{steps:[null],quizzes:[],seed:19}} onProgress={save}/>);
 expect(screen.getByRole('button',{name:'Ask for evidence.'})).toBeInTheDocument();
 fireEvent.keyDown(document,{key:'2'});fireEvent.keyDown(document,{key:'2',repeat:true});
 await screen.findByText('Here is another view.');
 expect(save).toHaveBeenCalledOnce();expect(save.mock.calls[0][0]).toEqual({steps:[null,'listen'],quizzes:[],seed:19});
});
it('history and notebook panels preserve the cursor, contain focus and suspend choice shortcuts',async()=>{
 const save=vi.fn();render(<StoryPlayer cinema pack={pack} initial={{steps:[null],quizzes:[],seed:19}} onProgress={save} notebook={<label>My principle<textarea/></label>}/>);
 const opener=screen.getByRole('button',{name:'Recall the conversation'});opener.focus();fireEvent.click(opener);
 expect(screen.getByRole('dialog',{name:'History'})).toBeInTheDocument();
 fireEvent.keyDown(document,{key:'1'});expect(save).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Close History'}));expect(opener).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:'Notebook'}));
 const input=screen.getByRole('textbox');input.focus();fireEvent.change(input,{target:{value:'A principle'}});fireEvent.keyDown(input,{key:'2'});
 expect(save).not.toHaveBeenCalled();
 await act(async()=>fireEvent(screen.getByRole('dialog',{name:'Notebook'}),new Event('cancel',{cancelable:true})));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Ask for evidence.'})).toBeInTheDocument();
});
it('pauses scene motion from the toolbar and keeps keyboard selection separate from typing and modified keys',async()=>{
 const save=vi.fn();render(<StoryPlayer cinema pack={pack} initial={{steps:[null],quizzes:[],seed:19}} onProgress={save}/>);
 fireEvent.click(screen.getByRole('button',{name:'Pause scene motion'}));
 expect(screen.getByRole('button',{name:'Resume scene motion'})).toHaveAttribute('aria-pressed','true');
 fireEvent.keyDown(document,{key:'1',ctrlKey:true});expect(save).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Ask for evidence.'}));await waitFor(()=>expect(save).toHaveBeenCalledOnce());
});
