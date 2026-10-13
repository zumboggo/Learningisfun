import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readingDiscussion } from '@/services/reading-discussion.service';
import { buildReadingParticipationCsv, exportReadingParticipation } from '@/services/reading-participation-export';
import { ReadingParticipationExport } from '@/components/reports/ReadingParticipationExport';
import { downloadCsv } from '@/services/report.service';
vi.mock('@/services/reading-discussion.service', () => ({ readingDiscussion: vi.fn() }));
vi.mock('@/services/report.service', () => ({ downloadCsv: vi.fn() }));
const read = vi.mocked(readingDiscussion);
const counts = (id: string, name: string, question: number, replies: number) => ({ id, name, question, replies, thought: 7, connection: 4 });
beforeEach(() => vi.clearAllMocks());
it('exports separate totals, zero counts, stable student IDs, and escaped spreadsheet fields', () => {
  const csv = buildReadingParticipationCsv('c', 'Class, Blue', [{ id: 'zero', name: 'No posts', email: 'zero@example.com' }], [
    { textId: 't1', title: 'A "story"\ncontinued', students: [counts('a', '=Formula', 2, 3), counts('b', '=Formula', 1, 0)] },
    { textId: 't2', title: 'Second', students: [counts('a', '=Formula', 1, 2)] },
  ]);
  expect(csv.startsWith('\uFEFF')).toBe(true);
  expect(csv).toContain("'=Formula,,a,Student total,All assigned readings,,3,5,8");
  expect(csv).toContain("'=Formula,,b,Student total,All assigned readings,,1,0,1");
  expect(csv).toContain('No posts,zero@example.com,zero,Student total,All assigned readings,,0,0,0');
  expect(csv).toContain('"A ""story""\ncontinued"');
  expect(csv).toContain('No posts,zero@example.com,zero,Text breakdown,Second,t2,0,0,0');
});
it('loads only this class, deduplicates texts, and uses the fresh teacher roster', async () => {
  read.mockResolvedValueOnce({ readings: [{ classId: 'c', textId: 't' }, { classId: 'other', textId: 'private' }, { classId: 'c', textId: 't' }] });
  read.mockResolvedValueOnce({ teacher: true, title: 'Story', participation: [counts('fresh', 'New student', 0, 0)] });
  const csv = await exportReadingParticipation('c', 'Class', [{ id: 'old', name: 'Left class' }]);
  expect(read).toHaveBeenCalledTimes(2);
  expect(read).toHaveBeenLastCalledWith('readReadingDiscussion', 't', 'c');
  expect(csv).toContain('New student,,fresh');
  expect(csv).not.toContain('Left class');
});
it('exports zero totals when the class has no assigned texts', async () => {
  read.mockResolvedValueOnce({ readings: [] });
  expect(await exportReadingParticipation('c', 'Class', [{ id: 's', name: 'Student' }])).toContain('Student,,s,Student total,All assigned readings,,0,0,0');
});
it('does not download partial grades when a reading fails to load', async () => {
  read.mockResolvedValueOnce({ readings: [{ classId: 'c', textId: 't' }] }).mockRejectedValueOnce(new Error('Reading unavailable'));
  render(<ReadingParticipationExport classId="c" className="Class" students={[]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Export text participation CSV' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Reading unavailable');
  expect(downloadCsv).not.toHaveBeenCalled();
});
it('downloads a named per-class CSV after a successful click', async () => {
  read.mockResolvedValueOnce({ readings: [] });
  render(<ReadingParticipationExport classId="c" className="Ethics Blue" students={[{id:'s',name:'Student'}]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Export text participation CSV' }));
  await waitFor(() => expect(downloadCsv).toHaveBeenCalledWith(expect.stringMatching(/^Ethics-Blue-text-participation-.*\.csv$/), expect.stringContaining('Student,,s,Student total')));
});
it('rejects a discussion response without teacher access', async () => {
  read.mockResolvedValueOnce({ readings: [{ classId: 'c', textId: 't' }] }).mockResolvedValueOnce({ teacher: false, participation: [] });
  await expect(exportReadingParticipation('c', 'Class', [])).rejects.toThrow('Only the class teacher');
});

it('keeps account emails on totals and text rows when server participation replaces names', async () => {
  read.mockResolvedValueOnce({ readings: [{ classId: 'c', textId: 't' }] });
  read.mockResolvedValueOnce({ teacher: true, title: 'Story', participation: [counts('s', 'Nickname', 2, 1)] });
  const csv = await exportReadingParticipation('c', 'Class', [{ id: 's', name: 'Old name', email: 'student@example.com' }]);
  expect(csv).toContain('Student,Email,Student ID');
  expect(csv).toContain('Nickname,student@example.com,s,Student total');
  expect(csv).toContain('Nickname,student@example.com,s,Text breakdown');
});
