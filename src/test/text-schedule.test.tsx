import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { textAssignmentAvailable, textReleaseAt, textSchedule } from '@/services/text-schedule';
import { ClassReadingDate } from '@/components/texts/ClassReadingDate';
afterEach(cleanup);
describe('reading deadlines and release dates',()=>{
  it.each(['2026-09-14','2026-09-16','2026-09-20'])('releases %s at 8am China time on the previous Friday',date=>{
    expect(textReleaseAt(date)).toBe('2026-09-11T00:00:00.000Z');
  });
  it('handles year boundaries and rejects invalid dates',()=>{
    expect(textReleaseAt('2027-01-01')).toBe('2026-12-25T00:00:00.000Z');
    expect(()=>textReleaseAt('2026-02-30')).toThrow();
  });
  it('opens at the exact boundary and keeps undated legacy texts visible',()=>{
    const assignment={dueDate:'2026-09-14'};
    expect(textAssignmentAvailable(assignment,Date.parse('2026-09-10T23:59:59Z'))).toBe(false);
    expect(textAssignmentAvailable(assignment,Date.parse('2026-09-11T00:00:00Z'))).toBe(true);
    expect(textAssignmentAvailable({})).toBe(true);
    expect(textAssignmentAvailable({dueDate:''})).toBe(true);
    expect(textAssignmentAvailable({dueDate:'bad'})).toBe(false);
  });
  it('uses posted week without a date and due week when one is chosen',()=>{
    expect(textSchedule('','2026-09-11T02:00:00Z')).toEqual({dueDate:'',assignedAt:'2026-09-11T02:00:00Z'});
    expect(textSchedule('2026-09-14').assignedAt).toBe('2026-09-14T12:00:00+08:00');
  });
  it('keeps different sections independent',()=>{
    const now=Date.parse('2026-09-11T10:00:00Z');
    expect(textAssignmentAvailable({dueDate:'2026-09-14'},now)).toBe(true);
    expect(textAssignmentAvailable({dueDate:'2026-09-21'},now)).toBe(false);
  });
  it('opens an accessible calendar and allows clearing a deadline',()=>{
    function Form(){const [value,setValue]=useState('');return <ClassReadingDate name="World Lit Blue" value={value} onChange={setValue}/>;}
    render(<Form/>);
    fireEvent.click(screen.getByRole('button',{name:'Set reading due date for World Lit Blue'}));
    fireEvent.change(screen.getByLabelText('Reading due date for World Lit Blue'),{target:{value:'2026-09-14'}});
    expect(screen.getByText(/Available Sep 11/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Clear'}));
    expect(screen.getByText('Available immediately, in the week posted.')).toBeInTheDocument();
  });
});
