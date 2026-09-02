import { describe,expect,it } from 'vitest';
import { parsePlannerSource,plannerDiff } from '@/services/planner-parser';
import { createWeeklyPlan } from '@/services/planner.service';

const source=`§6 READING QUEUES
--- WL ---
Unit 1: Epic Tales & Timeless Voices
· Beowulf opening
§7 PRESENTATIONS
[Sep 7-11]
  WL  Kennings
§8 WEEKLY PLANS
[WEEK] Sep 7-11   Monday 07 Sep 2026   Semester 1
CALENDAR: Assembly Wednesday
[BLOCK] WL-B World Literature Blue
UNIT Unit 1: Epic Tales and Timeless Voices
STD RL.1
GOAL Cite evidence.
[DAY] Tue 08 Sep
I: OPEN · Kennings
W: Close reading
Y: Plan response
C: Closing quiz. ‣ DUE: Analysis 1 • Vocabulary
[BLOCK] WL-R World Literature Red
UNIT Unit 1: Epic Tales and Timeless Voices
GOAL Cite evidence.
[DAY] Wed 09 Sep
I: OPEN · Kennings
W: Close reading
Y: Plan response
C: Exit ticket.`;

describe('planner source parser',()=>{
 it('extracts week, blocks, dates, activities, due work, presentations, and unit-number text queues',()=>{const parsed=parsePlannerSource(source);expect(parsed.weeks).toHaveLength(1);const week=parsed.weeks[0];expect(week.startDate).toBe('2026-09-07');expect(week.calendar).toBe('Assembly Wednesday');expect(week.blocks).toHaveLength(2);expect(week.blocks[0].days[0]).toMatchObject({iso:'2026-09-08',daytype:'OPEN',due:['Analysis 1','Vocabulary']});expect(week.blocks[0].presentationCandidates).toEqual(['Kennings']);expect(week.blocks[0].textQueue).toEqual(['Beowulf opening']);});
 it('reports only changed weeks during a re-import',()=>{const before=parsePlannerSource(source),after=parsePlannerSource(source.replace('Close reading','QFT'));expect(plannerDiff(before,after)).toEqual(['Sep 7-11']);expect(plannerDiff(before,before)).toEqual([]);});
 it('uses one flashcard readiness task per logical course without duplicating section work',()=>{const week=parsePlannerSource(source).weeks[0],plan=createWeeklyPlan(week,{});expect(plan.preparation.map(task=>task.label)).toEqual(['Flashcards updated · World Literature']);expect(plan.courses[0].texts.map(text=>text.title)).toEqual(['Beowulf opening']);expect(plan.courses[0].presentations.map(item=>item.title)).toEqual(['Kennings']);});
});
