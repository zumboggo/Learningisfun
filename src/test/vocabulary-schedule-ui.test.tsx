import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import VocabularySchedule from '@/components/teachers/VocabularySchedule';
const request=vi.hoisted(()=>vi.fn());
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:request}));
afterEach(()=>{cleanup();request.mockReset()});
it('previews CSV rows and holiday-aware releases before activation',async()=>{
 request.mockImplementation(async b=>{if(b.action==='listPrivateVocabulary')return {lists:[]};if(b.action==='savePrivateVocabulary')return {value:b.value,revision:1};throw Error(b.action)});
 const {container}=render(<VocabularySchedule classId="own-class"/>);const details=container.querySelector('details')!;details.open=true;fireEvent(details,new Event('toggle'));
 const upload=screen.getByLabelText(/Import CSV/);await waitFor(()=>expect(upload).not.toBeDisabled());
 const file=new File([''], 'vocabulary.csv',{type:'text/csv'});Object.defineProperty(file,'text',{value:async()=> 'Term,Definition,Example\na,A,One\nb,B,Two\nc,C,Three\nd,D,Four\ne,E,Five'});fireEvent.change(upload,{target:{files:[file]}});
 await screen.findByText('Preview / edit 5 vocabulary rows');fireEvent.change(screen.getByLabelText('First teaching week'),{target:{value:'2027-01-04'}});fireEvent.change(screen.getByLabelText('Words per week'),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/Weeks to skip/),{target:{value:'2027-01-11'}});
 expect(screen.getByText('2027-01-01 08:00')).toBeVisible();expect(screen.getByText('2027-01-18')).toBeVisible();expect(screen.queryByRole('cell',{name:'2027-01-11'})).not.toBeInTheDocument();
 const activate=screen.getByRole('button',{name:'Save & activate schedule'});expect(activate).toBeDisabled();expect(request.mock.calls.some(([b])=>b.action==='savePrivateVocabulary')).toBe(false);fireEvent.click(screen.getByLabelText('I reviewed the rows and release dates.'));fireEvent.click(activate);await screen.findByText(/Schedule active/);const saved=request.mock.calls.find(([b])=>b.action==='savePrivateVocabulary')![0];expect(saved.value).toMatchObject({classId:'own-class',wordsPerWeek:2,active:true,skipWeeks:['2027-01-11']});expect(saved.value.cards[0].back).toBe('A\n\nOne');
});
it('displays row-specific import errors and blocks activation',async()=>{
 request.mockResolvedValue({lists:[]});const {container}=render(<VocabularySchedule classId="own-class"/>);const details=container.querySelector('details')!;details.open=true;fireEvent(details,new Event('toggle'));const upload=screen.getByLabelText(/Import CSV/);await waitFor(()=>expect(upload).not.toBeDisabled());const file=new File([''],'bad.csv');Object.defineProperty(file,'text',{value:async()=> 'Term,Definition\nmissing,'});fireEvent.change(upload,{target:{files:[file]}});expect(await screen.findByText('Row 2: Term and Definition are required.')).toBeVisible();expect(screen.getByRole('button',{name:'Save & activate schedule'})).toBeDisabled();
});
