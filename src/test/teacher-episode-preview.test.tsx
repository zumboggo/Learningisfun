import 'fake-indexeddb/auto';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
const auth=vi.hoisted(()=>({user:{$id:'teacher',role:'teacher'}}));
const remote=vi.hoisted(()=>vi.fn());
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:remote}));
import {db} from '@/db/schema';
import {stoneDb} from '@/services/stone.service';
import TeachingStonePage from '@/pages/TeachingStonePage';
beforeEach(async()=>{await db.classes.clear();await db.class_members.clear();await stoneDb.attempts.clear();remote.mockClear();auth.user={$id:'teacher',role:'teacher'};await db.classes.put({$id:'literature',name:'Section',courseName:'World Literature',teacherId:'teacher'} as any);});
afterEach(cleanup);
function open(){render(<MemoryRouter initialEntries={['/classes/literature/game/preview/teaching-stone']}><Routes><Route path="/classes/:classId/game/preview/teaching-stone" element={<TeachingStonePage teacherPreview/>}/></Routes></MemoryRouter>);}
it('opens an unassigned episode for its teacher with local, unranked attempts and no backend reads',async()=>{open();expect(await screen.findByRole('button',{name:'Begin a new life'})).toBeInTheDocument();expect(screen.getByText('Teacher preview · not ranked')).toBeInTheDocument();expect(remote).not.toHaveBeenCalled();const attempts=await stoneDb.attempts.toArray();expect(attempts).toHaveLength(1);expect(attempts[0]).toMatchObject({preview:true,pending:false,userId:'teacher',classId:'literature'});});
it.each([['student','student'],['other-teacher','teacher'],['parent','parent']])('rejects %s without contacting the backend',async(id,role)=>{auth.user={$id:id,role};open();expect(await screen.findByRole('alert')).toHaveTextContent('Only this class’s teacher');expect(remote).not.toHaveBeenCalled();expect(await stoneDb.attempts.count()).toBe(0);});
