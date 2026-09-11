import { describe,it,expect } from 'vitest';
// @ts-expect-error Server functions are JavaScript deployed independently.
import { fridayRelease, validateUnit, planningAction } from '../../functions/learning-content/src/planning.js';
describe('planning authorization',()=>{
  it('uses the same release boundary as the client',()=>expect(fridayRelease('2026-09-07')).toBe('2026-09-04T00:00:00.000Z'));
  it('rejects unsafe links and unprepared approved copywork',()=>{
    const unit={id:'unit',course:'WL',startDate:'2026-09-08',classIds:[],cards:[],resources:[{id:'r',kind:'text',title:'Text',url:'javascript:alert(1)'}]};
    expect(()=>validateUnit(unit)).toThrow('Links');
    unit.resources=[{id:'r',kind:'copywork',title:'Copywork',url:''}];
    Object.assign(unit.resources[0],{approved:true});
    expect(()=>validateUnit(unit)).toThrow('Approved copywork');
  });
  it('rejects students and parents requesting private units',async()=>{
    for(const role of ['student','parent','substitute'])await expect(planningAction({body:{action:'readPlanningUnits'},profile:{role}})).rejects.toThrow('Teacher role');
  });
  it('rejects another teacher’s unit without writing',async()=>{
    const unit={id:'unit',course:'WL',startDate:'2026-09-08',classIds:[],cards:[],resources:[]};
    await expect(planningAction({body:{action:'savePlanningUnit',unit},profile:{role:'teacher'},userId:'a',db:{getDocument:async()=>({teacherId:'b'})},databaseId:'main'})).rejects.toThrow('Not your unit');
  });
  it('rejects requests for another class’s released materials',async()=>{
    await expect(planningAction({body:{action:'readPlanningMaterials',classId:'other'},profile:{role:'student'},memberClassIds:new Set(['own'])})).rejects.toThrow('Not your class');
  });
});
