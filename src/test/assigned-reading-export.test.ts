import { describe, expect, it } from 'vitest';
import { assignedReadingPrompt } from '@/services/assigned-reading-export';
import type { LearningText, TextAssignment } from '@/types';
const classes=[{$id:'b',courseName:'World Lit',name:'Blue'},{$id:'r',courseName:'World Lit',name:'Red'}];
const text=(id:string,status='published')=>({$id:id,title:'Reading '+id,status,externalUrl:'https://example.com/original'}) as LearningText;
const assignment=(classId:string,textId:string,assigned=true)=>({classId,textId,isAssignedReading:assigned,dueDate:'2026-09-21'}) as TextAssignment;
describe('assigned reading prompt',()=>{
  it('groups sections, preserves release dates and app links, and deduplicates',()=>{
    const result=assignedReadingPrompt(classes,[text('one')],[assignment('b','one'),assignment('b','one'),assignment('r','one')],'https://zumboggo.github.io/Learningisfun/#/planning');
    expect(result.count).toBe(2);
    expect(result.prompt).toContain('"section": "Blue"');
    expect(result.prompt).toContain('"section": "Red"');
    expect(result.prompt).toContain('https://zumboggo.github.io/Learningisfun/#/texts/one');
    expect(result.prompt).toContain('2026-09-18T00:00:00.000Z');
    expect(result.prompt).toContain('Assigned Readings');
  });
  it('excludes optional, draft, archived, missing and other-class readings',()=>{
    expect(assignedReadingPrompt(classes,[text('optional'),text('draft','draft'),text('old','archived')],[assignment('b','optional',false),assignment('b','draft'),assignment('b','old'),assignment('b','missing'),assignment('other','optional')],'https://example.com').count).toBe(0);
  });
});
