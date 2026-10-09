import 'fake-indexeddb/auto';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const auth=vi.hoisted(()=>({user:{$id:'student',role:'student'}}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn(async()=>({attempts:[],leaderboard:[],preview:false}))}));
import {db} from '@/db/schema';
import {STONE_CLASS_ID} from '@/services/stone.service';
import {AP_CLASS_ID} from '../../functions/learning-content/src/episode-catalog.js';
import GamePage from '@/pages/GamePage';
import {gameDisplayKey} from '@/services/game-display';
beforeEach(async()=>{await db.classes.clear();await db.class_members.clear();auth.user={$id:'student',role:'student'};localStorage.clear();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-14T00:00:00Z'));for(const id of [STONE_CLASS_ID,AP_CLASS_ID,'foreign'])await db.classes.put({$id:id,name:'Section',courseName:id===STONE_CLASS_ID?'Ethics':'AP',teacherId:id==='foreign'?'someone':'teacher'} as any);});
afterEach(()=>{cleanup();vi.useRealTimers();});
function open(){return render(<MemoryRouter><GamePage/></MemoryRouter>);}
it('shows only a student’s released class episodes and remembers the window preference per account',async()=>{
 await db.class_members.put({$id:'m',classId:AP_CLASS_ID,userId:'student',role:'student',joinedAt:''});open();
 expect(await screen.findByText('The Ride That Wouldn’t Autocorrect')).toBeInTheDocument();expect(screen.queryByText('The Grain We Keep')).not.toBeInTheDocument();
 const setting=screen.getByRole('checkbox');expect(setting).toBeChecked();fireEvent.click(setting);expect(localStorage.getItem(gameDisplayKey('student'))).toBe('window');expect(localStorage.getItem(gameDisplayKey('other'))).toBeNull();
});
it('shows the teacher both episodes once, without requiring student membership',async()=>{auth.user={$id:'teacher',role:'teacher'};open();expect(await screen.findByText('The Grain We Keep')).toBeInTheDocument();expect(await screen.findByText('The Ride That Wouldn’t Autocorrect')).toBeInTheDocument();expect(screen.getAllByText('The Grain We Keep')).toHaveLength(1);});
it('does not expose cached episodes through expired memberships',async()=>{await db.class_members.put({$id:'m',classId:STONE_CLASS_ID,userId:'student',role:'student',joinedAt:'',expiresAt:'2026-10-01T00:00:00Z'});open();expect(await screen.findByText(/No episodes are available/)).toBeInTheDocument();expect(screen.queryByText('The Grain We Keep')).not.toBeInTheDocument();});
it('does not give parent accounts a game library',async()=>{auth.user={$id:'teacher',role:'parent'};open();expect(await screen.findByRole('alert')).toHaveTextContent('available to students and class teachers');});
