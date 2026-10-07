import { expect, it, vi } from 'vitest';
vi.mock('@/lib/appwrite',()=>({FUNCTION_IDS:{learningContent:''}}));
vi.mock('@/db/schema',()=>({db:{
 text_paragraphs:{where:()=>({equals:()=>({sortBy:async()=>[{$id:'p1',content:'First'},{$id:'p2',content:'Second'}]})})},
 texts:{get:async()=>({teacherId:'teacher'})},
 text_annotations:{where:()=>({equals:()=>({count:async()=>1})})},
 transaction:async(...args:unknown[])=>(args.at(-1) as ()=>Promise<void>)(),
}}));
vi.mock('@/services/sync.service',()=>({addToQueue:vi.fn()}));
import { updateTextParagraphs } from '@/services/text.service';
it('prevents inserted picture paragraphs from moving existing student annotations',async()=>{
 await expect(updateTextParagraphs('text','teacher',['First','![A](reading-image:text:img_0123456789_01234567890123456789)','Second'])).rejects.toThrow('notes stay attached');
});
