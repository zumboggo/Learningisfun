import { describe, expect, it } from 'vitest';
import { assignedReadingPrompt,readingWeekMonday } from '@/services/assigned-reading-export';
import type { LearningText, TextAssignment } from '@/types';
const classes=[{$id:'b',courseName:'Renamed course',name:'Blue',canvasCourseId:'21824'},{$id:'r',courseName:'World Lit',name:'Red',canvasCourseId:'21695'}];
const text=(id:string,status='published',externalUrl='')=>({$id:id,title:'Reading '+id,status,externalUrl}) as LearningText;
const assignment=(classId:string,textId:string,dueDate='2026-09-15',assigned=true)=>({classId,textId,isAssignedReading:assigned,dueDate}) as TextAssignment;
const base='https://zumboggo.github.io/Learningisfun/#/planning';
describe('compact Canvas reading export',()=>{
  it('matches the exact format with course IDs, per-reading dates and optional sources',()=>{
    const result=assignedReadingPrompt(classes,[text('one'),text('two','published','https://example.com/source')],[assignment('b','one'),assignment('r','two','2026-09-17')],base,'2026-09-15');
    expect(result.prompt).toBe('Canvas readings — week of 2026-09-14\n\n21695\n- Reading two | https://zumboggo.github.io/Learningisfun/#/texts/two | 09-17 | src:https://example.com/source\n\n21824\n- Reading one | https://zumboggo.github.io/Learningisfun/#/texts/one | 09-15');
    expect(result.count).toBe(2);
  });
  it('filters by due-date week, excludes undated/optional/draft items and deduplicates',()=>{
    const a=assignment('b','one');
    const result=assignedReadingPrompt(classes,[text('one'),text('draft','draft')],[a,a,assignment('b','one','2026-09-21'),assignment('b','one',''),assignment('r','one','2026-09-15',false),assignment('r','draft')],base,'2026-09-14');
    expect(result.count).toBe(1);expect(result.prompt).not.toContain('21695');
  });
  it('refuses to silently omit classes that need a stored Canvas ID',()=>{
    expect(()=>assignedReadingPrompt([{...classes[0],canvasCourseId:''}],[text('one')],[assignment('b','one')],base,'2026-09-14')).toThrow('Canvas course ID');
  });
  it('normalizes year-boundary weeks and rejects invalid dates',()=>{
    expect(readingWeekMonday('2027-01-01')).toBe('2026-12-28');
    expect(()=>readingWeekMonday('2026-02-30')).toThrow();
  });
});
