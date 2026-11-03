import {beforeEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {RhetoricalSituation} from '@/components/texts/RhetoricalSituation';
import {executeLearningContent} from '@/services/learning-content.service';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
const responses={writer:'',audience:'',purpose:'',exigence:'',context:'',message:''};
beforeEach(()=>{cleanup();vi.clearAllMocks();vi.mocked(executeLearningContent).mockResolvedValue({responses,updatedAt:null});});
it('loads only on expansion, saves all six fields, and keeps work when collapsed',async()=>{
 render(<RhetoricalSituation textId="t" classId="c"/>);
 expect(executeLearningContent).not.toHaveBeenCalled();
 const toggle=screen.getByRole('button',{name:/Rhetorical Situation/});expect(toggle).toHaveAttribute('aria-expanded','false');fireEvent.click(toggle);
 await screen.findByRole('textbox',{name:'Writer / speaker'});expect(screen.getAllByRole('textbox')).toHaveLength(6);
 fireEvent.change(screen.getByLabelText('Exigence'),{target:{value:'The council is about to vote.'}});
 fireEvent.click(toggle);fireEvent.click(toggle);expect(screen.getByLabelText('Exigence')).toHaveValue('The council is about to vote.');
 const saved={...responses,exigence:'The council is about to vote.'};vi.mocked(executeLearningContent).mockResolvedValueOnce({responses:saved,updatedAt:'now'});
 fireEvent.click(screen.getByRole('button',{name:'Save practice'}));
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Practice saved'));
 expect(executeLearningContent).toHaveBeenLastCalledWith({action:'saveRhetoricalSituation',textId:'t',classId:'c',responses:saved});
});
it('reloads saved responses and retains new writing after a failed save',async()=>{
 vi.mocked(executeLearningContent).mockResolvedValueOnce({responses:{...responses,audience:'Voters'},updatedAt:'now'});
 render(<RhetoricalSituation textId="t" classId="c"/>);fireEvent.click(screen.getByRole('button',{name:/Rhetorical Situation/}));
 await waitFor(()=>expect(screen.getByLabelText('Audience')).toHaveValue('Voters'));
 fireEvent.change(screen.getByLabelText('Purpose'),{target:{value:'Persuade them to oppose the proposal.'}});
 vi.mocked(executeLearningContent).mockRejectedValueOnce(new Error('Connection lost. Try again.'));
 fireEvent.click(screen.getByRole('button',{name:'Save practice'}));await screen.findByRole('alert');
 expect(screen.getByLabelText('Purpose')).toHaveValue('Persuade them to oppose the proposal.');expect(screen.getByRole('button',{name:'Save practice'})).toBeEnabled();
});
it('retries load failures without presenting an empty form that could overwrite saved work',async()=>{
 vi.mocked(executeLearningContent).mockRejectedValueOnce(new Error('Offline'));
 render(<RhetoricalSituation textId="t" classId="c"/>);fireEvent.click(screen.getByRole('button',{name:/Rhetorical Situation/}));await screen.findByRole('alert');expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Try again'}));await screen.findByLabelText('Message');
});
