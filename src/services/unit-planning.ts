import { parseCsvRows } from '@/utils/csv-parser';
import { executeLearningContent } from './learning-content.service';
import type { PlannerWeekSource } from './planner-parser';
import type { WeeklyPlanData } from './planner.service';

export type ResourceKind = 'presentation' | 'text' | 'activity' | 'copywork' | 'quiz' | 'assignment';
export interface PlanningCard { id: string; front: string; back: string; tags: string[]; week: string; kind: string; tier: 'CORE' | 'REFERENCE' | 'SUPPORTING' }
export interface UnitResource { id: string; kind: ResourceKind; title: string; content: string; url: string; week: string; date: string; minutes: number; optional: boolean; approved: boolean; paragraphs: number; targets: string[]; skills: string; }
export interface UnitPlan { id: string; course: string; number: string; title: string; startDate: string; endDate: string; knowledge: string; skills: string; essentialQuestion: string; classIds: string[]; cards: PlanningCard[]; resources: UnitResource[]; vocabularyApproved: boolean; }
export interface UnitRecord { $id: string; teacherId: string; dataJson: string; updatedAt: string }
export interface LessonSlot { planningItemId?: string; existingTextId?: string; isRoutine?: boolean; isCopywork?: boolean; assignedReading?: boolean; activityType?: string; publish?: boolean; givenBy?: string; dueDate?: string; id: string; resourceId?: string; title: string; kind: ResourceKind; content: string; url: string; minutes: number; optional: boolean; status: 'planned' | 'completed' | 'partial' | 'skipped'; }
export const courseCode = (value: string) => value.startsWith('WL') ? 'WL' : value;
export interface PlanningRelease { $id:string; unitId:string; releaseAt:string; status:string; lastError:string }
export const readUnits = () => executeLearningContent<{ units: UnitRecord[]; releases:PlanningRelease[] }>({ action: 'readPlanningUnits' });
export const saveUnit = (unit: UnitPlan) => executeLearningContent<{ unit: UnitRecord }>({ action: 'savePlanningUnit', unit });
export const unpackUnit = (record: UnitRecord): UnitPlan => ({ ...JSON.parse(record.dataJson), id: record.$id });
export const blankResource = (): UnitResource => ({ id: crypto.randomUUID(), kind: 'activity', title: '', content: '', url: '', week: '', date: '', minutes: 10, optional: false, approved: false, paragraphs: 5, targets: [], skills: '' });

/** Dates are interpreted as China calendar dates, independent of the browser timezone. */
export function precedingFriday(week: string): string {
  const date = new Date(`${week}T00:00:00Z`);
  const weekday = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - ((weekday + 6) % 7) - 3);
  return `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

export function importVocabulary(csv: string, weeks: PlannerWeekSource[], existing: UnitPlan[] = []): UnitPlan[] {
  const records = parseCsvRows(csv.replace(/^\uFEFF/,''));
  const headers = records.shift()?.map(value=>value.toLowerCase()) || [];
  if (!['front','back','tags'].every(value=>headers.includes(value))) throw new Error('Expected front, back and tags columns.');
  // The same term may belong to different courses: do not use deck-import deduplication here.
  const rows = records.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]||''])));
  const result = structuredClone(existing);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (const row of rows) {
    const raw = row.tags || '', course = raw.match(/^(AP|ETH|WL)\b/)?.[1];
    if (!course) throw new Error(`Missing course tag for ${row.front}`);
    const number = raw.match(/\bU(\d+)\b/)?.[1] || 'all';
    const label = raw.match(/wk:([A-Za-z]{3}) (\d{1,2})/) ;
    const week = label ? weeks.find(item => Number(item.startDate.slice(5,7)) === months.indexOf(label[1]) + 1 && Number(item.startDate.slice(8,10)) === Number(label[2]))?.startDate : '';
    const tier = /\bREFERENCE\b/.test(raw) ? 'REFERENCE' : /\bCORE\b/.test(raw) ? 'CORE' : 'SUPPORTING';
    if (tier === 'CORE' && !week) throw new Error(`Cannot match the teaching week for ${row.front}. Import the annual calendar first.`);
    let unit = result.find(item => item.course === course && item.number === number);
    if (!unit) {
      const matching = weeks.filter(item => item.blocks.some(block => courseCode(block.code) === course && (number === 'all' || block.unit.match(/Unit\s+(\d+)/i)?.[1] === number)));
      const block = matching.flatMap(item => item.blocks).find(item => courseCode(item.code) === course);
      unit = { id: crypto.randomUUID(), course, number, title: block?.unit || `${course} · ${number === 'all' ? 'Year reference' : `Unit ${number}`}`, startDate: matching.flatMap(item => item.blocks.filter(block => courseCode(block.code) === course).flatMap(block => block.days.map(day => day.iso))).filter(Boolean).sort()[0] || week || '', endDate: matching.at(-1)?.startDate || week || '', knowledge: '', skills: block?.std || '', essentialQuestion: '', classIds: [], cards: [], resources: [], vocabularyApproved: false };
      result.push(unit);
    }
    const tags = raw.split(/\s+/);
    const card: PlanningCard = { id: `${course}-${number}-${tier}-${row.front.trim().toLowerCase()}`, front: row.front, back: row.back, tags, week: week || '', tier, kind: raw.match(/\b(TERM|CONCEPT|NAME|WORD)\b/)?.[1] || 'TERM' };
    const index = unit.cards.findIndex(item => item.id === card.id);
    if (index < 0) unit.cards.push(card); else unit.cards[index] = card;
    unit.vocabularyApproved = false;
  }
  return result;
}

/** Import only source facts and resource briefs, never instructions to change external services. */
export function importPlanningBrief(text:string, units:UnitPlan[], weeks:PlannerWeekSource[]):UnitPlan[] {
  const next=structuredClone(units);
  for(const part of text.split(/(?=^PART [345] —)/m)) {
    const head=part.match(/^PART \d+ — (AP LANGUAGE|ETHICS AND LEADERSHIP|WORLD LITERATURE) · UNIT (\d+)/);
    if(!head)continue;
    const course=head[1].startsWith('AP')?'AP':head[1].startsWith('ETHICS')?'ETH':'WL';
    const unit=next.find(item=>item.course===course&&item.number===head[2]);if(!unit)continue;
    const intro=part.split(/\n--- /)[0];
    const skills=intro.match(/SKILL TARGETS[^\n]*\n([\s\S]*?)(?=\n {4}KNOWLEDGE TARGETS)/)?.[1]?.trim();
    const knowledge=intro.match(/KNOWLEDGE TARGETS[^\n]*\n((?:\s+K\d[^\n]*\n|\s{10,}[^\n]*\n)+)/)?.[1]?.trim();
    if(skills&&!unit.skills.startsWith('S1'))unit.skills=skills;
    if(knowledge&&!unit.knowledge)unit.knowledge=knowledge;
  }
  const sections=text.split(/(?=^--- (?:AP|ETH|WL) U\d+ W\d+ ·)/m).slice(1);
  for(const section of sections) {
    const heading=section.split('\n')[0], match=heading.match(/^--- (AP|ETH|WL) U(\d+) W(\d+) ·/);
    if(!match)continue;
    const unit=next.find(item=>item.course===match[1]&&item.number===match[2]);if(!unit)continue;
    const dates=[...new Set(unit.cards.filter(card=>card.tier==='CORE').map(card=>card.week))].sort();
    const week=dates[Number(match[3])-1];if(!week)continue;
    const lessons=weeks.find(item=>item.startDate===week)?.blocks.find(block=>courseCode(block.code)===unit.course)?.days||[];
    const date=lessons[0]?.iso||week;
    const focus=heading.replace(/^.*? · (?:[^·]* ·)*?/, '').replace(/-+.*$/,'').trim();
    const presentation=section.match(/\n {2}PRESENTATION\s+([\s\S]*?)(?=\n {2}COPYWORK|\n---|$)/)?.[1]?.trim();
    const copywork=section.match(/\n {2}COPYWORK\s+([\s\S]*?)(?=\n {2}UNIT TOTAL|\n={5}|$)/)?.[1]?.trim();
    for(const [kind,content] of [['presentation',presentation],['copywork',copywork]] as const) {
      if(!content)continue;
      const resourceId=`brief-${unit.course}-${unit.number}-${week}-${kind}`;
      if(unit.resources.some(item=>item.id===resourceId))continue;
      unit.resources.push({...blankResource(),id:resourceId,kind,title:`${kind==='copywork'?'Copywork':'Presentation'} · ${focus||week}`,content,week,date:kind==='copywork'?(lessons.at(-1)?.iso||week):date,minutes:kind==='copywork'?0:15});
    }
  }
  return next;
}

export function resourcesForWeek(units: UnitPlan[], code: string, week: string) {
  return units.filter(unit => unit.course === courseCode(code)).flatMap(unit => unit.resources).filter(resource => resource.week === week);
}
export function resourceSlot(resource: UnitResource): LessonSlot {
  return { id: crypto.randomUUID(), publish: resource.approved, resourceId: resource.id, title: resource.title, kind: resource.kind, content: resource.content, url: resource.url, minutes: resource.kind === 'assignment' ? 0 : resource.minutes, optional: resource.optional, status: 'planned' };
}
export function applyUnitPublication(data:WeeklyPlanData,units:UnitPlan[]):WeeklyPlanData {
  const next=structuredClone(data);
  const resources=new Map(units.flatMap(unit=>unit.resources).map(resource=>[resource.id,resource]));
  for(const course of next.courses) {
    // Regenerate only unit-derived selections; preserve earlier manual selections.
    course.texts=course.texts.filter(item=>!item.resourceId);
    course.presentations=course.presentations.filter(item=>!item.resourceId);
    for(const lesson of next.lessons.filter(item=>item.classCode===course.classCode)) {
      for(const slot of lesson.slots||[]) {
        const resource=resources.get(slot.resourceId||'');
        if(!resource?.approved)continue;
        if(slot.kind==='text')course.texts.push({resourceId:resource.id,title:slot.title,date:lesson.date,url:slot.url,publish:true,content:slot.content});
        if(slot.kind==='presentation')course.presentations.push({resourceId:resource.id,title:slot.title,date:lesson.date,url:slot.url,publish:true,givenBy:'teacher'});
      }
    }
  }
  return next;
}
/** Only initialize a lesson once. Subsequent unit edits cannot overwrite manual placements. */
export function populateSlots(data: WeeklyPlanData, units: UnitPlan[]): WeeklyPlanData {
  const next = structuredClone(data);
  next.unitSnapshot ||= structuredClone(units);
  for (const lesson of next.lessons) {
    if (lesson.slots) continue;
    const classDays=next.lessons.filter(item=>item.classCode===lesson.classCode).map(item=>item.date).sort();
    const resources = resourcesForWeek(units, lesson.classCode, data.week.startDate).filter(item => {
      if(item.kind==='presentation'||item.kind==='copywork')return false;
      if(!item.date)return lesson.date===classDays[0];
      if(classDays.includes(item.date))return item.date===lesson.date;
      if(item.kind==='assignment')return lesson.date===([...classDays].reverse().find(date=>date<=item.date)||classDays[0]);
      const other=next.week.blocks.find(block=>courseCode(block.code)===courseCode(lesson.classCode)&&block.days.some(day=>day.iso===item.date));
      const index=other?.days.findIndex(day=>day.iso===item.date)??-1;
      return index>=0 && classDays[index]===lesson.date;
    });
    const due: LessonSlot[] = lesson.due.map((title, index) => ({ id: `${lesson.id}-due-${index}`, title, kind: /quiz/i.test(title) ? 'quiz' : 'assignment', content: '', url: '', minutes: 0, optional: false, status: 'planned' }));
    const sourceActivities = ([['I do', lesson.iDo], ['We do', lesson.weDo], ['They do', lesson.theyDo], ['Check', lesson.check]] as const).filter(([,content])=>content.trim()).map(([title,content]):LessonSlot=>({id:crypto.randomUUID(),title,content,activityType:title,kind:/quiz/i.test(content)?'quiz':'activity',url:'',minutes:10,optional:false,status:'planned'}));
    const all = [...due, ...resources.map(resourceSlot), ...sourceActivities];
    lesson.slots = all; lesson.overflow = [];
  }
  return next;
}
