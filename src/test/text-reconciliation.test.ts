import { beforeEach, expect, it, vi } from 'vitest';
import type { TextParagraph } from '@/types';
type Cached = Pick<TextParagraph,'$id'|'textId'> & Partial<TextParagraph>;
type Pending = {entityId:string;syncStatus:string};
const state = vi.hoisted(() => ({local:[] as Cached[],pending:[] as Pending[]}));
vi.mock('@/db/schema', () => ({db:{
  transaction: async (...args:unknown[]) => (args.at(-1) as ()=>Promise<void>)(),
  sync_queue:{where:()=>({equals:()=>({filter:(predicate:(row:Pending)=>boolean)=>({toArray:async()=>state.pending.filter(predicate)})})})},
  text_paragraphs:{
    where:()=>({equals:(id:string)=>({toArray:async()=>state.local.filter(row=>row.textId===id)})}),
    bulkDelete:async(ids:string[])=>{state.local=state.local.filter(row=>!ids.includes(row.$id));},
    bulkPut:async(rows:Cached[])=>{for(const row of rows){state.local=state.local.filter(r=>r.$id!==row.$id);state.local.push(row);}},
  },
}}));
import { reconcileTextParagraphs } from '@/services/text.service';
beforeEach(()=>{state.local=[];state.pending=[];});
it('refresh cannot resurrect pending deletions or overwrite pending edits',async()=>{
  state.local=[{$id:'edited',textId:'text',content:'My latest edit'},{$id:'stale',textId:'text'}];
  state.pending=[{entityId:'edited',syncStatus:'pending'},{entityId:'deleted',syncStatus:'pending'}];
  await reconcileTextParagraphs('text',[{$id:'edited',textId:'text',content:'Old text'},{$id:'deleted',textId:'text',content:'Deleted'},{$id:'new',textId:'text',content:'New'}] as TextParagraph[]);
  expect(state.local.map(row=>row.$id).sort()).toEqual(['edited','new']);
  expect(state.local.find(row=>row.$id==='edited')?.content).toBe('My latest edit');
});
it('removes obsolete cached duplicate IDs while preserving unrelated texts',async()=>{
  state.local=[{$id:'duplicate',textId:'text'},{$id:'other',textId:'other'}];
  await reconcileTextParagraphs('text',[{$id:'kept',textId:'text',content:'Original'}] as TextParagraph[]);
  expect(state.local.map(row=>row.$id).sort()).toEqual(['kept','other']);
});
