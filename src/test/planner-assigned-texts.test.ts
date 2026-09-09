import { describe, expect, it } from 'vitest';
import { addAssignedTexts } from '@/services/planner-assigned-texts';
import { createWeeklyPlan } from '@/services/planner.service';
import { projectCardMaterials } from '@/services/planner-editor';
import { placePlannerCard } from '@/services/planner-cards';
import type { LearningText, TextAssignment } from '@/types';

const plan=()=>createWeeklyPlan({key:'week',startDate:'2026-09-07',header:'',calendar:'',blocks:['WL-B','WL-R','AP'].map(code=>({code,label:code,title:code,unit:'',std:'',goal:'',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'Tuesday',iso:'2026-09-08',daytype:'',I:'',W:'',Y:'',C:'',due:[]}]}))},{'WL-B':'blue','WL-R':'red',AP:'ap'});
const text=(id:string,status='published')=>({$id:id,title:id,author:'Author',status,createdAt:'2026-08-01'} as LearningText);
const assignment=(textId:string,classId:string,date='2026-09-09')=>({$id:textId+classId,textId,classId,assignedAt:date} as TextAssignment);
describe('assigned readings in weekly planning',()=>{
  it('uses assigned week, includes older texts, and deduplicates the two World Lit sections',()=>{
    const data=addAssignedTexts(plan(),[text('poem'),text('old'),text('next'),text('archived','archived'),text('other')],[assignment('poem','blue'),assignment('poem','red'),assignment('old','blue','2026-09-06'),assignment('next','blue','2026-09-14'),assignment('archived','blue'),assignment('other','elsewhere')],'https://example.com/Learningisfun/#/planner');
    expect(data.weeklyResources).toHaveLength(1);
    expect(data.weeklyResources![0]).toMatchObject({course:'WL',existingTextId:'poem',url:'https://example.com/Learningisfun/#/texts/poem'});
  });
  it('preserves edits and respects removal when the assignment syncs again',()=>{
    const texts=[text('poem')],assignments=[assignment('poem','blue')];
    const data=addAssignedTexts(plan(),texts,assignments,'https://example.com/');
    data.weeklyResources![0].title='My planning title';
    expect(addAssignedTexts(data,texts,assignments,'https://example.com/').weeklyResources![0].title).toBe('My planning title');
    data.dismissedAssignedTexts=[data.weeklyResources![0].id];data.weeklyResources=[];
    expect(addAssignedTexts(data,texts,assignments,'https://example.com/').weeklyResources).toHaveLength(0);
  });
  it('keeps a placed reading in the agenda without requesting a duplicate class text',()=>{
    const data=addAssignedTexts(plan(),[text('poem')],[assignment('poem','blue')],'https://example.com/');
    const resource=data.weeklyResources![0];
    const placed=placePlannerCard(data,{slot:{...resource,planningItemId:resource.id}},data.lessons[0].id,0);
    const projected=projectCardMaterials(placed);
    expect(projected.lessons[0].slots![0].title).toBe('poem');
    expect(projected.courses[0].texts).toHaveLength(0);
  });
});
