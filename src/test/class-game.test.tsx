import 'fake-indexeddb/auto';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
const auth=vi.hoisted(()=>({user:{$id:'student',role:'student'}}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn(async()=>({attempts:[],leaderboard:[],preview:false}))}));
import {db} from '@/db/schema';
import {stoneDb,newAttempt,extendAttempt,STONE_CLASS_ID} from '@/services/stone.service';
import ClassGamePage from '@/pages/ClassGamePage';
beforeEach(async()=>{await db.classes.clear();await db.class_members.clear();await stoneDb.attempts.clear();auth.user={$id:'student',role:'student'};});
afterEach(cleanup);
async function seed(classId:string){await db.classes.put({$id:classId,name:'Section',courseName:'Renamed course',schoolYear:'2026',teacherId:'teacher',joinCode:'',joinCodeActive:false,parentCode:'',parentCodeActive:false,linksJson:'[]',status:'active',createdAt:''});await db.class_members.put({$id:'member',classId,userId:'student',role:'student',joinedAt:''});}
function open(classId:string){return render(<MemoryRouter initialEntries={[`/classes/${classId}/game`]}><Routes><Route path="/classes/:classId/game" element={<ClassGamePage/>}/></Routes></MemoryRouter>);}
it('shows a member’s best completed score and excludes other accounts and previews',async()=>{
 await seed(STONE_CLASS_ID);
 const choices=['listen','needs','paid','bargain','investigate','balance','preserve','delegate','publish','council'];
 await stoneDb.attempts.bulkPut([extendAttempt(newAttempt('student',STONE_CLASS_ID,false),choices),newAttempt('student',STONE_CLASS_ID,false),extendAttempt(newAttempt('other',STONE_CLASS_ID,false),choices)]);
 open(STONE_CLASS_ID);expect(await screen.findByText(/Your highest score:/)).toBeInTheDocument();expect(screen.getByRole('link',{name:'Play / replay'})).toHaveAttribute('href',`/classes/${STONE_CLASS_ID}/teaching-stone`);
});
it('shows an honest empty library for other classes without leaking the Ethics episode',async()=>{
 await seed('world-section-one');open('world-section-one');
 expect(await screen.findByText(/No episodes have been assigned/)).toBeInTheDocument();expect(screen.queryByText('The Grain We Keep')).not.toBeInTheDocument();
});
it('denies nonmembers even if the class is cached',async()=>{
 await seed(STONE_CLASS_ID);auth.user={$id:'outsider',role:'student'};open(STONE_CLASS_ID);
 expect(await screen.findByRole('alert')).toHaveTextContent('Sign in with this class');expect(screen.queryByText('The Grain We Keep')).not.toBeInTheDocument();
});
