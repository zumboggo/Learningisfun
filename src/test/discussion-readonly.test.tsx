import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ClassSession, TextDiscussionPost } from '@/types';
const state=vi.hoisted(()=>({posts:[] as TextDiscussionPost[]}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'student'},isTeacher:false,isParent:false})}));
vi.mock('react-router-dom',()=>({useNavigate:()=>vi.fn()}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:(query:()=>unknown)=>String(query).includes('text_discussion_posts')?state.posts:String(query).includes('classes.get')?{courseName:'Class'}:[]}));
vi.mock('@/services/text-discussion.service',()=>({syncTextDiscussion:vi.fn(async()=>{}),voteOnPost:vi.fn(),addDiscussionPost:vi.fn()}));
import { RedditDiscussionPage } from '@/pages/RedditDiscussionPage';
const session={$id:'discussion',classId:'class',title:'Topic',status:'active'} as ClassSession;
function posts(locked:boolean){state.posts=[{ $id:'root',classSessionId:'discussion',classId:'class',content:'Root',parentId:'',locked,depth:0,createdAt:'2026-09-01',updatedAt:'2026-09-01',moderationStatus:'visible',score:0,anonymousLabel:'Peer 1'},{ $id:'child',classSessionId:'discussion',classId:'class',content:'Child',parentId:'root',locked:false,depth:1,createdAt:'2026-09-01',updatedAt:'2026-09-01',moderationStatus:'visible',score:0,anonymousLabel:'Peer 2'}] as TextDiscussionPost[];}
it('hides reply composers throughout a locked thread',()=>{
  posts(true);render(<RedditDiscussionPage session={session}/>);
  expect(screen.getByText('Child')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/↩ Reply/})).not.toBeInTheDocument();
});
it('finished discussions remain readable without voting or reply controls',()=>{
  posts(false);render(<RedditDiscussionPage session={{...session,status:'archived'} as ClassSession}/>);
  expect(screen.getByText('Root')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/↩ Reply/})).not.toBeInTheDocument();
  expect(screen.getAllByRole('button',{name:'Upvote'}).every(button=>button.hasAttribute('disabled'))).toBe(true);
});
