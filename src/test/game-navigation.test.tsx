import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup,within,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const auth=vi.hoisted(()=>({user:{$id:'u',role:'student',name:'User'},isTeacher:false,isParent:false,viewAsStudent:false,logout:vi.fn(),setViewAsStudent:vi.fn()}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('@/hooks/useSyncStatus',()=>({useSyncStatus:()=>({})}));
vi.mock('@/hooks/useOnlineStatus',()=>({useOnlineStatus:()=>true}));
vi.mock('@/components/layout/SyncIndicator',()=>({SyncIndicator:()=>null}));
import {AppLayout} from '@/components/layout/AppLayout';
afterEach(cleanup);
it('puts The Game in student floating navigation and marks it active',()=>{auth.isTeacher=false;auth.isParent=false;render(<MemoryRouter initialEntries={['/game']}><AppLayout>Library</AppLayout></MemoryRouter>);const link=screen.getByRole('link',{name:'The Game'});expect(link).toHaveAttribute('href','/game');expect(link).toHaveClass('student-floating-nav-item-active');expect(link.closest('nav')).toHaveClass('student-floating-nav');});
it('puts The Game in the teacher sidebar and mobile menu',()=>{auth.isTeacher=true;auth.isParent=false;render(<MemoryRouter><AppLayout>Library</AppLayout></MemoryRouter>);expect(screen.getAllByRole('link',{name:'The Game'})).toHaveLength(2);});
it('does not add game access to parent navigation',()=>{auth.isTeacher=false;auth.isParent=true;render(<MemoryRouter><AppLayout>Library</AppLayout></MemoryRouter>);expect(screen.queryByRole('link',{name:'The Game'})).not.toBeInTheDocument();});
it('puts Planner last in student navigation and marks it active',()=>{auth.isTeacher=false;auth.isParent=false;render(<MemoryRouter initialEntries={['/brainstorming']}><AppLayout>Planner</AppLayout></MemoryRouter>);const link=screen.getByRole('link',{name:'Planner'});expect(link).toHaveAttribute('href','/brainstorming');expect(link).toHaveAttribute('aria-current','page');expect(link.closest('nav')?.lastElementChild).toBe(link);});
it('keeps Planner out of parent navigation',()=>{auth.isTeacher=false;auth.isParent=true;render(<MemoryRouter><AppLayout>Home</AppLayout></MemoryRouter>);expect(screen.queryByRole('link',{name:'Planner'})).not.toBeInTheDocument();});
it.each([
  ['/planning', 'Planning', 'Weekly plans', 'Brainstorming boards'],
  ['/teacher-access', 'Settings', 'Settings', 'Data'],
])('groups %s in the teacher menu and switches views', (path, section, current, other) => {
  auth.isTeacher = true;
  auth.isParent = false;
  render(<MemoryRouter initialEntries={[path]}><AppLayout>Content</AppLayout></MemoryRouter>);
  const sidebar = within(screen.getByRole('navigation', {name: 'Teacher sidebar'}));
  expect(sidebar.getByRole('link', {name: section})).toHaveAttribute('aria-current', 'page');
  expect(sidebar.queryByRole('link', {name: /^(Weekly|Planner|Data)$/})).toBeNull();
  const views = within(screen.getByRole('navigation', {name: section + ' views'}));
  expect(views.getByRole('link', {name: current})).toHaveAttribute('aria-current', 'page');
  fireEvent.click(views.getByRole('link', {name: other}));
  expect(views.getByRole('link', {name: other})).toHaveAttribute('aria-current', 'page');
  expect(sidebar.getByRole('link', {name: section})).toHaveAttribute('aria-current', 'page');
});
