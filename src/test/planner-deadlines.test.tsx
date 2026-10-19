import {describe,it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import {parsePlannerSource} from '@/services/planner-parser';
import {PlannerDueLists} from '@/components/planner/PlannerDueLists';

const source=`§4  ASSIGNMENTS DUE — CURRENT CANVAS
 Fri 2026-12-18 23:59 WL-B 10 pts Blue essay
 Group: Minor | Assignment | ID 1
 https://lifeplus.instructure.com/courses/21695/assignments/1
 Sat 2026-12-19 07:59 AP 5 pts Weekend task
 Group: Minor | Assignment | ID 2
 https://lifeplus.instructure.com/courses/20636/assignments/2
 Mon 2026-12-21 23:59 AP 10 pts Holiday deadline
 Group: Minor | Assignment | ID 3
 https://lifeplus.instructure.com/courses/20636/assignments/3
 Fri 2026-12-18 23:59 AP 10 pts Weekly Quiz
§5 QUIZZES
 Fri 2026-12-18 23:59 AP 10 pts Quiz
§8 LESSONS
[WEEK] Dec 14-18  Monday 14 Dec 2026
 [BLOCK] AP AP Language
 UNIT Unit 2
 [DAY] Tue 15 Dec
 I: Lesson
§12 UNPUBLISHED
 Fri 2026-12-18 23:59 AP 10 pts Unpublished essay
`;
describe('planner deadline inventory',()=>{
 it('uses actual section deadlines, including weekends and a following non-teaching week',()=>{
  const {weeks}=parsePlannerSource(source);
  expect(weeks[0].deadlines?.map(item=>item.title)).toEqual(['Blue essay','Weekend task','Holiday deadline']);
  render(<PlannerDueLists week={weeks[0]} classCode="AP"/>);
  expect(screen.getByText('Weekend task')).toBeInTheDocument();
  expect(screen.getByText('Holiday deadline')).toBeInTheDocument();
  expect(screen.queryByText('Blue essay')).not.toBeInTheDocument();
  expect(screen.getByText('Due this week:')).toBeInTheDocument();
  expect(screen.getByText('Due Next week:')).toBeInTheDocument();
 });
 it('handles the next calendar week across a year boundary',()=>{
  const changed=source.replaceAll('2026-12-21','2027-01-01').replace('[WEEK] Dec 14-18  Monday 14 Dec 2026','[WEEK] Dec 28-Jan 1  Monday 28 Dec 2026');
  expect(parsePlannerSource(changed).weeks[0].deadlines?.map(item=>item.title)).toEqual(['Holiday deadline']);
 });
});
