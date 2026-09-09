import { describe, expect, it } from 'vitest';
import { createWeeklyPlan } from '@/services/planner.service';
import { populateSlots } from '@/services/unit-planning';
import { migrateCardEditor, projectCardMaterials } from '@/services/planner-editor';
// @ts-expect-error Backend is deployed as JavaScript.
import { slotAgenda } from '../../functions/learning-content/src/planning.js';

function fixture() { return populateSlots(createWeeklyPlan({key:'Week',startDate:'2026-09-07',header:'',calendar:'',blocks:[{code:'AP',label:'AP',title:'AP',unit:'1',std:'',goal:'Read',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'Tue',iso:'2026-09-08',daytype:'',I:'Model',W:'',Y:'',C:'',due:[]}]}]},{}),[]); }
describe('one-source weekly editing',()=>{
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
