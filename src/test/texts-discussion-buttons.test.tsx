import { useEffect, useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TextsPage } from '@/pages/TextsPage';

const fixture=vi.hoisted(()=>({
  classes:[{$id:'blue',name:'Blue',courseName:'Literature'},{$id:'red',name:'Red',courseName:'Literature'}],
  texts:[{$id:'essay',title:'Assigned essay',createdAt:'2026-10-05',author:'Author'},{$id:'copy',title:'Copywork only',createdAt:'2026-10-05'}],
  assignments:[{textId:'essay',classId:'blue',assignedAt:'2026-10-05',isAssignedReading:true},{textId:'essay',classId:'red',assignedAt:'2026-10-05',isAssignedReading:true},{textId:'copy',classId:'blue',assignedAt:'2026-10-05',isCopywork:true}],
}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'student'},isTeacher:false})}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn(async()=>({readings:[
  {id:'blue-essay',textId:'essay',classId:'blue',title:'Assigned essay',available:true,questionCount:0,replyCount:0},
  {id:'red-essay',textId:'essay',classId:'red',title:'Assigned essay',available:true,questionCount:0,replyCount:1},
]}))}));
vi.mock('@/db/schema',()=>({db:{
  classes:{get:async(id:string)=>fixture.classes.find(c=>c.$id===id)},
  class_members:{where:()=>({equals:()=>({toArray:async()=>[{classId:'blue'},{classId:'red'}]})})},
  text_assignments:{where:()=>({anyOf:()=>({toArray:async()=>fixture.assignments}),equals:(id:string)=>({toArray:async()=>fixture.assignments.filter(a=>a.textId===id)})})},
  texts:{where:()=>({anyOf:()=>({toArray:async()=>fixture.texts})})},
}}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:(query:()=>Promise<unknown>,deps:unknown[])=>{
  const [value,setValue]=useState<unknown>();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{let active=true;void query().then(result=>{if(active)setValue(result);});return()=>{active=false;};},deps);
  return value;
}}));
afterEach(cleanup);

it('places class-specific Discussion buttons beneath the student text, with activity shades',async()=>{
  render(<MemoryRouter><TextsPage/></MemoryRouter>);
  const week=await screen.findByRole('button',{name:/Week of/});fireEvent.click(week);
  await screen.findByText('Assigned essay');
  const buttons=await screen.findAllByRole('link',{name:/Discussion for Assigned essay/});
  expect(buttons).toHaveLength(2);
  expect(buttons[0]).toHaveAttribute('href','/discussions/texts/essay/blue');expect(buttons[0]).toHaveClass('bg-purple-100');
  expect(buttons[1]).toHaveAttribute('href','/discussions/texts/essay/red');expect(buttons[1]).toHaveClass('bg-purple-800');
  expect(screen.getByRole('link',{name:/^Assigned essay/}).contains(buttons[0])).toBe(false);
  expect(screen.queryByRole('link',{name:'Discussion for Copywork only'})).not.toBeInTheDocument();
});
