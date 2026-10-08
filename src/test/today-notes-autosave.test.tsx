import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TodayNotesPage } from '@/pages/TodayNotesPage';
const mocks=vi.hoisted(()=>({save:vi.fn(),user:{$id:'teacher'}}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:mocks.user})}));
vi.mock('@/db/schema',()=>({db:{classes:{get:vi.fn(async()=>({name:'AP Language'}))},class_sessions:{get:vi.fn()}}}));
vi.mock('@/services/class-session.service',()=>({getOrCreateTodayNotes:vi.fn(async()=>({$id:'session',classId:'class',discussionType:'notes',sessionDate:'2026-10-08',notesMarkdown:'Original'})),saveTodayNotes:mocks.save}));
beforeEach(()=>{vi.useFakeTimers();localStorage.clear();mocks.save.mockReset().mockResolvedValue(undefined);});
afterEach(()=>{cleanup();vi.useRealTimers();});
async function mount(){const view=render(<MemoryRouter initialEntries={['/classes/class/notes']}><Routes><Route path="/classes/:classId/notes" element={<TodayNotesPage/>}/></Routes></MemoryRouter>);await act(async()=>{});return view;}
function type(text:string){const editor=screen.getByLabelText("Today's class notes");editor.innerHTML=text;fireEvent.input(editor);}
it('stores local recovery immediately and queues only changed content every 30 seconds',async()=>{
 await mount();type('New notes');expect(localStorage.getItem('today-notes:teacher:session')).toBe('New notes');expect(mocks.save).not.toHaveBeenCalled();
 await act(async()=>vi.advanceTimersByTime(30000));expect(mocks.save).toHaveBeenCalledExactlyOnceWith('session','teacher','New notes');
 await act(async()=>vi.advanceTimersByTime(90000));expect(mocks.save).toHaveBeenCalledTimes(1);
 expect(localStorage.getItem('today-notes:teacher:session')).toBeNull();
});
it('recovers unsaved writing including an intentionally cleared note',async()=>{
 localStorage.setItem('today-notes:teacher:session','');await mount();expect(screen.getByLabelText("Today's class notes")).toHaveTextContent('');
 await act(async()=>vi.advanceTimersByTime(30000));expect(mocks.save).toHaveBeenCalledWith('session','teacher','');
});
it('retains changes typed during a save and retries failures',async()=>{
 let finish!:()=>void;mocks.save.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
 await mount();type('First');await act(async()=>vi.advanceTimersByTime(30000));type('Second');
 await act(async()=>finish());expect(localStorage.getItem('today-notes:teacher:session')).toBe('Second');
 mocks.save.mockRejectedValueOnce(Error('offline'));await act(async()=>vi.advanceTimersByTime(30000));expect(localStorage.getItem('today-notes:teacher:session')).toBe('Second');
 await act(async()=>vi.advanceTimersByTime(30000));expect(mocks.save).toHaveBeenLastCalledWith('session','teacher','Second');expect(localStorage.getItem('today-notes:teacher:session')).toBeNull();
});
it('flushes on leaving the editor',async()=>{const view=await mount();type('Before leaving');await act(async()=>view.unmount());expect(mocks.save).toHaveBeenCalledWith('session','teacher','Before leaving');});
