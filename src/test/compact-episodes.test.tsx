import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EpisodeCards } from '@/components/EpisodeCards';
vi.mock('@/services/use-animated-library',()=>({useAnimatedLibrary:()=>({assignments:[
 {assignmentId:'fri',id:'dinner-with-the-tyrant',classId:'class',title:'Dinner with the Tyrant',date:'2026-11-06',versionId:'v1',best:88},
 {assignmentId:'tue',id:'new-story',classId:'class',title:'A new story',date:'2026-11-03',versionId:'v2',assessmentMode:'none',completed:true},
 {assignmentId:'other',id:'other',classId:'other',title:'Other class',date:'2026-11-03'},
 {assignmentId:'later',id:'later',classId:'class',title:'Next week',date:'2026-11-10'},
]})}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:()=>[]}));
vi.mock('../../functions/learning-content/src/episode-catalog.js',()=>({assignedEpisodes:()=>[]}));
vi.mock('@/components/GameLaunchLink',()=>({GameLaunchLink:({to,children,...props}:any)=><a href={to} {...props}>{children}</a>}));
vi.mock('@/components/animated/EpisodePublicSharing',()=>({default:()=> <button>Make public</button>}));
afterEach(cleanup);
it('keeps weekly episodes in date order with working destinations, student results and no teacher actions',()=>{
 render(<MemoryRouter><EpisodeCards classId="class" userId="student" week="2026-11-02" compact/></MemoryRouter>);
 const cards=screen.getAllByRole('article');
 expect(cards).toHaveLength(2);
 expect(within(cards[0]).getByRole('heading', {name:'A new story'})).toBeVisible();
 expect(screen.getByText('Story complete')).toBeVisible();
 expect(screen.getByText('Highest score: 88/100')).toBeVisible();
 expect(screen.getByRole('link',{name:/Play \/ replay Dinner/})).toHaveAttribute('href','/game/play/fri');
 expect(screen.queryByText('Make public')).not.toBeInTheDocument();
});
it('keeps teacher sharing in a disclosure and falls back if artwork fails',()=>{
 const {container}=render(<MemoryRouter><EpisodeCards classId="class" userId="teacher" week="2026-11-02" compact preview/></MemoryRouter>);
 const menu=screen.getByLabelText('Sharing options for Dinner with the Tyrant').closest('details')!;
 expect(menu.open).toBe(false);
 fireEvent.click(screen.getByLabelText('Sharing options for Dinner with the Tyrant'));
 expect(menu.open).toBe(true);
 expect(within(menu).getByText('Make public')).toBeVisible();
 const img=container.querySelector('img')!;
 expect(img.src).toContain('dinner-with-the-tyrant.webp');
 fireEvent.error(img);
 expect(container.querySelector('img')).toBeNull();
});
