import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {useState} from 'react';
const call=vi.hoisted(()=>vi.fn());
vi.mock('@/services/animated-stories',()=>({animatedCall:call}));
vi.mock('@/components/teachers/AIAllowance',()=>({default:()=>null}));
import Panel from '@/components/animated/EpisodeAuthoringPanel';
const original=JSON.parse(readFileSync('public/stories/animated/demo.json','utf8'));
function Harness(){const [pack,setPack]=useState(original);return <><Panel pack={pack} onChange={p=>setPack((current:any)=>({...current,...p}))}/><output aria-label="Current story">{pack.script}</output></>}
afterEach(()=>{cleanup();call.mockReset()});
it('discusses an idea and includes the conversation and unsent refinements in generation',async()=>{
 call.mockImplementation(async(action)=>action==='chatEpisode'?{reply:'Let’s make trust the central conflict.'}:action==='generateEpisodeDraft'?{pack:{...original,title:'Trust',script:'story 2\nlabel opening\nI: The promise matters.\nend',authoring:{generated:true}},errors:[]}:{});
 render(<Harness/>);
 expect(screen.queryByRole('textbox',{name:'Story script'})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Your episode idea or revision'),{target:{value:'A story about trust'}});
 fireEvent.click(screen.getByRole('button',{name:'Send ↗'}));
 await screen.findByText('Let’s make trust the central conflict.');
 fireEvent.change(screen.getByLabelText('Your episode idea or revision'),{target:{value:'Set it in a library.'}});
 fireEvent.click(screen.getByRole('button',{name:/Create episode/}));
 await screen.findByText('Your episode is ready. Play the preview, or describe a change here.');
 const request=call.mock.calls.find(([action])=>action==='generateEpisodeDraft')![1];
 expect(request.messages.map((m:any)=>m.content)).toEqual(['A story about trust','Let’s make trust the central conflict.','Set it in a library.']);
 expect(screen.getByLabelText('Current story')).toHaveTextContent('The promise matters.');
 expect(screen.getByRole('button',{name:/Revise episode/})).toBeEnabled();
});
it('keeps the prior episode and the prompt when generation fails',async()=>{
 call.mockImplementation(async(action)=>{if(action==='generateEpisodeDraft')throw Error('The AI draft did not pass playback checks.');return {}});
 render(<Harness/>);fireEvent.change(screen.getByLabelText('Your episode idea or revision'),{target:{value:'An impossible adventure'}});fireEvent.click(screen.getByRole('button',{name:/Create episode/}));
 await screen.findByText('The AI draft did not pass playback checks.');expect(screen.getByLabelText('Current story').textContent).toBe(original.script);expect(screen.getByLabelText('Your episode idea or revision')).toHaveValue('An impossible adventure');
});
it('keeps manual character creation and background upload in separate tabs',async()=>{
 call.mockResolvedValue({});render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Characters'}));expect(screen.getByText('Create a character · reusable in your classes')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Backgrounds'}));await waitFor(()=>expect(screen.getByLabelText('Upload background')).toBeInTheDocument());expect(screen.getByRole('button',{name:'Generate background'})).toBeDisabled();
});
