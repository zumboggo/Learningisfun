import {createRef} from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
const remote=vi.hoisted(()=>vi.fn());
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:remote}));
import {connectEpisodeText,type TextField} from '@/services/episode-text-dom';
import EpisodeTextEditor from '@/components/EpisodeTextEditor';
afterEach(cleanup);
beforeEach(()=>{localStorage.clear();Element.prototype.scrollIntoView=vi.fn();remote.mockReset();remote.mockResolvedValue({revision:0,patches:{}});});
function open(preview=true){const ref=createRef<HTMLIFrameElement>();const view=render(<><EpisodeTextEditor iframeRef={ref} frameKey="one" classId="class" episode="own-english" version={4} preview={preview}/><iframe ref={ref} title="Story"/></>);const doc=ref.current!.contentDocument!;doc.body.innerHTML='<div class="passage" data-passage="Start"><p>The original line</p><button>Continue</button></div>';fireEvent.load(ref.current!);return {doc,view};}
it('edits by clicking text, preserves navigation, and applies saved text again after rerender',async()=>{
 const {doc}=open();const play=vi.fn();doc.querySelector('button')!.onclick=play;
 await waitFor(()=>expect(screen.getByRole('button',{name:'Edit text'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Edit text'}));
 fireEvent.click(doc.querySelector('p')!);fireEvent.change(screen.getByLabelText('Edit selected text'),{target:{value:'The revised line'}});
 fireEvent.click(doc.querySelector('button')!);expect(play).not.toHaveBeenCalled();expect(screen.getByLabelText('Edit selected text')).toHaveValue('The revised line');
 remote.mockImplementation(async request=>({revision:1,patches:{[request.key]:{original:request.original,text:request.text}}}));
 fireEvent.click(screen.getByRole('button',{name:'Save for this class'}));await screen.findByText(/Saved for this class/);
 expect(doc.querySelector('p')).toHaveTextContent('The revised line');expect(remote.mock.calls[1][0]).toMatchObject({action:'saveEpisodeText',classId:'class',revision:0,original:'The original line',text:'The revised line'});
 fireEvent.click(screen.getByRole('button',{name:'Done editing · resume play'}));fireEvent.click(doc.querySelector('button')!);expect(play).toHaveBeenCalledOnce();
});
it('keeps a failed draft for retry and allows restoring original wording before saving',async()=>{
 const {doc}=open();await waitFor(()=>expect(screen.getByRole('button',{name:'Edit text'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Edit text'}));fireEvent.click(doc.querySelector('p')!);
 fireEvent.change(screen.getByLabelText('Edit selected text'),{target:{value:'Unsaved revision'}});remote.mockRejectedValue(new Error('Save unavailable'));
 fireEvent.click(screen.getByRole('button',{name:'Save for this class'}));await screen.findByText('Save unavailable');expect(screen.getByLabelText('Edit selected text')).toHaveValue('Unsaved revision');expect(doc.querySelector('p')).toHaveTextContent('The original line');
 fireEvent.click(screen.getByRole('button',{name:'Restore original wording'}));expect(screen.getByLabelText('Edit selected text')).toHaveValue('The original line');
});
it('applies saved wording for students without exposing an editor',async()=>{
 let resolve:(value:unknown)=>void=()=>{};remote.mockImplementation(()=>new Promise(done=>{resolve=done;}));
 const {doc}=open(false);let fields:TextField[]=[];const controller=connectEpisodeText(doc,()=>({}),f=>fields=f);const field=fields[0];controller.disconnect();
 await act(async()=>resolve({revision:1,patches:{[field.key]:{original:field.original,text:'Shared teacher correction'}}}));
 expect(doc.querySelector('p')).toHaveTextContent('Shared teacher correction');expect(screen.queryByRole('button',{name:'Edit text'})).not.toBeInTheDocument();
});
it('uses cached shared wording offline without enabling publishing',async()=>{
 localStorage.setItem('episode-text:class:own-english:4',JSON.stringify({revision:1,patches:{}}));remote.mockRejectedValue(new Error('Offline'));open();
 expect(await screen.findByText(/Using the last saved text/)).toBeInTheDocument();expect(screen.getByRole('button',{name:'Edit text'})).toBeDisabled();expect(screen.getByRole('button',{name:'Reload saved text'})).toBeEnabled();
});
