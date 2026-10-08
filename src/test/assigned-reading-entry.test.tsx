import { useEffect, useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TextsPage } from '@/pages/TextsPage';
import { TextMaterialLink } from '@/pages/ClassDetailPage';
import { assignedReadingLink } from '@/utils/assigned-reading-link';
const fixture=vi.hoisted(()=>({
 classes:[{$id:'blue',name:'Blue',courseName:'Literature'},{$id:'red',name:'Red',courseName:'Literature'}],
 texts:[{$id:'essay',title:'Assigned essay',createdAt:'2026-10-05',author:'Author'},{$id:'copy',title:'Copywork only',createdAt:'2026-10-05'}],
 assignments:[{textId:'essay',classId:'blue',assignedAt:'2026-10-05',isAssignedReading:true},{textId:'essay',classId:'red',assignedAt:'2026-10-05',isAssignedReading:true},{textId:'copy',classId:'blue',assignedAt:'2026-10-05',isCopywork:true}],
}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'student'},isTeacher:false})}));
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
it('Texts titles default to discussion and offer the correct class links for shared readings',async()=>{
 render(<MemoryRouter><TextsPage/></MemoryRouter>);
 fireEvent.click(await screen.findByRole('button',{name:/Week of/}));
 expect(await screen.findByRole('link',{name:/^Assigned essay/})).toHaveAttribute('href','/discussions/texts/essay/blue');
 expect(screen.getByRole('link',{name:/Discussion · .*Red/})).toHaveAttribute('href','/discussions/texts/essay/red');
 expect(screen.getByRole('link',{name:/^Copywork only/})).toHaveAttribute('href','/texts/copy');
});
it('class reading titles open their own discussion even when an external source exists',()=>{
 const item={kind:'text',date:'2026-10-05',text:{$id:'essay',title:'Assigned essay',externalUrl:'https://example.org/article',contentMode:'link'},assignment:{classId:'red',isAssignedReading:true}} as Parameters<typeof TextMaterialLink>[0]['item'];
 render(<MemoryRouter><TextMaterialLink item={item}/></MemoryRouter>);
 expect(screen.getByRole('link')).toHaveAttribute('href','/discussions/texts/essay/red');
 expect(screen.getByRole('link')).not.toHaveAttribute('target','_blank');
});
it('copywork-only and unassigned texts retain their existing reading destination',()=>{
 expect(assignedReadingLink('text',[])).toBe('/texts/text');
 expect(assignedReadingLink('text',[{classId:'class',isAssignedReading:false}])).toBe('/texts/text');
 expect(assignedReadingLink('text',[{classId:'copy',isAssignedReading:false},{classId:'reading',isAssignedReading:true}])).toBe('/discussions/texts/text/reading');
});
