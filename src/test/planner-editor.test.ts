import { describe, expect, it } from 'vitest';
import { createWeeklyPlan } from '@/services/planner.service';
import { populateSlots } from '@/services/unit-planning';
import { migrateCardEditor, projectCardMaterials } from '@/services/planner-editor';
// @ts-expect-error Backend is deployed as JavaScript.
import { slotAgenda } from '../../functions/learning-content/src/planning.js';

function fixture() { return populateSlots(createWeeklyPlan({key:'Week',startDate:'2026-09-07',header:'',calendar:'',blocks:[{code:'AP',label:'AP',title:'AP',unit:'1',std:'',goal:'Read',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'Tue',iso:'2026-09-08',daytype:'',I:'Model',W:'',Y:'',C:'',due:[]}]}]},{}),[]); }
describe('one-source weekly editing',()=>{
  it('publishes an attached bank resource only to checked classes, preserving vocabulary',()=>{
    const plan=fixture();plan.lessons[0].classId='ap';
    plan.courses.push({...structuredClone(plan.courses[0]),classCode:'WL-R'});
    plan.lessons.push({...structuredClone(plan.lessons[0]),id:'red',classCode:'WL-R',classId:'red'});
    plan.weeklyResources=[{id:'ppt',kind:'presentation',title:'Weekly vocab',content:'Keep all vocabulary',url:'presentation-file:private',course:'AP',publishClassIds:['ap','red'],minutes:10,optional:false,status:'planned'}];
    const projected=projectCardMaterials(plan);
    expect(projected.courses.map(c=>c.presentations.length)).toEqual([1,1]);
    expect(projected.weeklyResources![0].content).toBe('Keep all vocabulary');
    plan.weeklyResources[0].publishClassIds=['red'];
    expect(projectCardMaterials(plan).courses.map(c=>c.presentations.length)).toEqual([0,1]);
  });
  it('imports legacy materials and extras once, preserving dates and notes',()=>{
    const plan=fixture();
    plan.courses[0].texts.push({title:'Essay',url:'https://example.com',date:'2026-09-09',publish:true});
    plan.courses[0].presentations.push({title:'Talk',url:'',date:'2026-09-08',publish:false,givenBy:'Alex'});
    plan.courses[0].intention='Private intention';
    plan.extras.push({id:'extra',courseCode:'AP',label:'Debate',target:'Evaluate',lessonDates:['2026-09-08']});
    const migrated=migrateCardEditor(plan);
    expect(migrated.lessons[0].overflow).toHaveLength(2);
    expect(migrated.lessons[0].slots).toHaveLength(2);
    expect(migrateCardEditor(migrated)).toEqual(migrated);
    const saved=projectCardMaterials(migrated);
    expect(saved.courses[0].texts[0]).toMatchObject({resourceId:'Essay',title:'Essay',date:'2026-09-09',publish:true});
    expect(saved.courses[0].presentations[0].givenBy).toBe('Alex');
    expect(saved.courses[0].intention).toBe('Private intention');
    expect(saved.extras).toHaveLength(0);
  });
  it('projects card edits and removals without resurrecting old choices',()=>{
    const plan=migrateCardEditor(fixture());
    plan.lessons[0].slots!.push({id:'text',kind:'text',title:'New title',content:'',url:'https://example.com',minutes:5,optional:false,status:'planned',publish:true});
    const saved=projectCardMaterials(plan);expect(saved.courses[0].texts[0].title).toBe('New title');
    saved.lessons[0].slots=saved.lessons[0].slots!.filter(slot=>slot.id!=='text');
    expect(projectCardMaterials(saved).courses[0].texts).toEqual([]);
  });
  it('keeps private cards out of student agendas',()=>{
    const plan=fixture();plan.lessons[0].slots![0].publish=false;
    expect(slotAgenda(plan.lessons[0])).not.toContain('Model');
    plan.lessons[0].slots![0].publish=true;
    expect(slotAgenda(plan.lessons[0])).toContain('Model');
  });
});

it('publishes a repeated shared resource only once per date, but retains different due dates',()=>{
  const plan=fixture();const first=plan.lessons[0];
  first.slots=[{id:'one',kind:'text',title:'Essay',content:'Read',url:'https://example.com',minutes:5,optional:false,status:'planned'}];
  first.slots.push({...first.slots[0],id:'two'});
  plan.lessons.push({...structuredClone(first),id:'later',date:'2026-09-10'});
  const projected=projectCardMaterials(plan);
  expect(projected.courses[0].texts.map(t=>t.date)).toEqual(['2026-09-08','2026-09-10']);
  expect(first.slots).toHaveLength(2);
  expect(projected.lessons[0].slots).toHaveLength(2);
  expect(projectCardMaterials(projected)).toEqual(projected);
});
