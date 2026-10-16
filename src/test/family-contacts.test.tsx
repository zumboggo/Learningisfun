import {afterEach,beforeEach,test,expect,vi} from 'vitest';
import {render,screen,cleanup,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
const auth=vi.hoisted(()=>({user:{$id:'student-a',role:'student'},isTeacher:false}));
const remote=vi.hoisted(()=>vi.fn());
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:remote}));
import FamilyContactsPage from '@/pages/FamilyContactsPage';
import {FAMILY_CONTACT_CLASS_ID,familyContactsTsv} from '@/services/family-contacts.service';
const values=['9','Example Student','','M','Example','Example Parent','00123456789','parent@example.com','','',''];
function open(classId=FAMILY_CONTACT_CLASS_ID){return render(<MemoryRouter initialEntries={[`/classes/${classId}/family-contacts`]}><Routes><Route path="/classes/:classId/family-contacts" element={<FamilyContactsPage/>}/></Routes></MemoryRouter>)}
beforeEach(()=>{remote.mockReset();auth.user={$id:'student-a',role:'student'};auth.isTeacher=false;vi.spyOn(window,'scrollTo').mockImplementation(()=>{});});
afterEach(()=>{cleanup();vi.restoreAllMocks()});
test('students review and confirm before saving their own response, then sensitive inputs clear',async()=>{
 remote.mockResolvedValueOnce({teacher:false,response:null}).mockResolvedValueOnce({saved:true,response:{userId:'student-a',values,updatedAt:'2026-10-16T01:00:00Z'}});
 open();
 fireEvent.change(await screen.findByLabelText(/Full name as shown/),{target:{value:values[1]}});
 fireEvent.change(screen.getByLabelText(/Parent 1 · Full name/),{target:{value:values[5]}});
 fireEvent.change(screen.getByLabelText(/Parent 1 · Mobile phone/),{target:{value:values[6]}});
 fireEvent.click(screen.getByRole('button',{name:'Review my details →'}));
 expect(screen.getByRole('button',{name:'Save my details'})).toBeDisabled();
 expect(remote).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('checkbox'));
 fireEvent.click(screen.getByRole('button',{name:'Save my details'}));
 expect(await screen.findByText('Your details are saved.')).toBeInTheDocument();
 expect(screen.queryByText('Example Parent')).not.toBeInTheDocument();
 expect(remote.mock.calls[1][0]).toMatchObject({action:'saveFamilyContacts',classId:FAMILY_CONTACT_CLASS_ID,confirmed:true});
 expect(remote.mock.calls[1][0]).not.toHaveProperty('userId');
});
test('student reads only own existing response, with no table or export controls',async()=>{
 remote.mockResolvedValue({teacher:false,response:{userId:'student-a',values,updatedAt:'2026-10-16T01:00:00Z'}});open();
 expect(await screen.findByLabelText(/Full name as shown/)).toHaveValue('Example Student');
 expect(screen.queryByRole('table')).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Copy rows for Excel'})).not.toBeInTheDocument();
 expect(remote).toHaveBeenCalledWith({action:'readFamilyContacts',classId:FAMILY_CONTACT_CLASS_ID,preview:true});
});
test('teacher mode shows response table and copies only matching Excel columns',async()=>{
 auth.user={$id:'owner',role:'teacher'};auth.isTeacher=true;
 const rows=[{userId:'student-a',values,updatedAt:'2026-10-16T01:00:00Z'}];remote.mockResolvedValue({teacher:true,rows});
 const writeText=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{value:{writeText},configurable:true});
 open();expect(await screen.findByRole('table')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Copy rows for Excel'}));
 await waitFor(()=>expect(writeText).toHaveBeenCalledWith(familyContactsTsv(rows)));
 expect(screen.queryByLabelText(/Full name as shown/)).not.toBeInTheDocument();
});
test('different classes never contact the backend; failed access never renders private data',async()=>{
 const first=open('different-class');expect(screen.getByRole('alert')).toHaveTextContent('only for Gr. 9');expect(remote).not.toHaveBeenCalled();first.unmount();
 remote.mockRejectedValue(new Error('Not enrolled'));open();expect(await screen.findByRole('alert')).toHaveTextContent('Could not open');expect(screen.queryByRole('table')).not.toBeInTheDocument();expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
test('switching from teacher mode clears the private table before loading a blank preview',async()=>{
 auth.user={$id:'owner',role:'teacher'};auth.isTeacher=true;
 remote.mockResolvedValueOnce({teacher:true,rows:[{userId:'student-a',values,updatedAt:'2026-10-16T01:00:00Z'}]}).mockResolvedValueOnce({teacher:false,preview:true,response:null});
 const view=open();await screen.findByRole('table');auth.isTeacher=false;
 view.rerender(<MemoryRouter initialEntries={[`/classes/${FAMILY_CONTACT_CLASS_ID}/family-contacts`]}><Routes><Route path="/classes/:classId/family-contacts" element={<FamilyContactsPage/>}/></Routes></MemoryRouter>);
 expect(screen.queryByText('Example Parent')).not.toBeInTheDocument();
 expect(await screen.findByText(/Student preview/)).toBeInTheDocument();
 expect(remote).toHaveBeenLastCalledWith({action:'readFamilyContacts',classId:FAMILY_CONTACT_CLASS_ID,preview:true});
});
