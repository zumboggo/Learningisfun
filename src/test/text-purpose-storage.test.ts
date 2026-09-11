import {beforeEach,expect,it,vi} from 'vitest';
import type {TextAssignment} from '@/types';
const state=vi.hoisted(()=>({rows:[] as TextAssignment[]}));
vi.mock('@/services/sync.service',()=>({addToQueue:vi.fn()}));
vi.mock('@/db/schema',()=>({db:{text_assignments:{where:()=>({equals:(id:string)=>({toArray:async()=>state.rows.filter(a=>a.textId===id)})}),put:async(a:TextAssignment)=>{state.rows=state.rows.filter(r=>r.$id!==a.$id);state.rows.push(a);},delete:async(id:string)=>{state.rows=state.rows.filter(r=>r.$id!==id);}}}}));
import {updateTextAssignments} from '@/services/text.service';
beforeEach(()=>{state.rows=[{$id:'b',textId:'t',classId:'blue',assignedAt:'2026-09-14',isCopywork:true,isAssignedReading:false},{$id:'r',textId:'t',classId:'red',assignedAt:'2026-09-15',isCopywork:false,isAssignedReading:true}];});
it('preserves another section’s purpose when only one section is changed',async()=>{
  await updateTextAssignments('t','teacher',[{classId:'blue',assignedAt:'2026-09-14',isCopywork:false,isAssignedReading:false},{classId:'red',assignedAt:'2026-09-15'}]);
  expect(state.rows.find(r=>r.classId==='blue')).toMatchObject({isCopywork:false,isAssignedReading:false});
  expect(state.rows.find(r=>r.classId==='red')).toMatchObject({isCopywork:false,isAssignedReading:true});
});
