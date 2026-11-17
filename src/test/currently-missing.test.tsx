import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CurrentlyMissing } from '@/components/classes/CurrentlyMissing';
import { STONE_CLASS_ID } from '@/services/stone.service';

const mocks = vi.hoisted(() => ({ entries: [] as unknown[], readings: vi.fn(), library: vi.fn(), invalidate: vi.fn() }));
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => mocks.entries }));
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: mocks.readings }));
vi.mock('@/services/use-animated-library', () => ({ readAnimatedLibrary: mocks.library, invalidateAnimatedLibrary: mocks.invalidate }));
vi.mock('@/services/ethics-portfolio.service', () => ({ localEntries: vi.fn(), readPortfolio: vi.fn() }));
vi.mock('@/components/GameLaunchLink', async () => ({ GameLaunchLink: (await import('react-router-dom')).Link }));
vi.mock('@/components/WorkshopLink', async () => ({ WorkshopLink: (await import('react-router-dom')).Link }));

afterEach(cleanup);

it('links to unfinished reading discussions and opens only explicitly assigned, unsubmitted Ethics notebooks', async () => {
 mocks.entries = [{ submitted: true, source: { kind: 'episode-notes', format: 'animated', episode: 'done' } }];
 mocks.readings.mockResolvedValue({ readings: [
  { id: 'reading', textId: 'text', classId: STONE_CLASS_ID, title: 'A reading', questions: 0, replies: 1, quoteRequired: true, assignedReplies: 0 },
 ] });
 mocks.library.mockResolvedValue({ assignments: [
  { id: 'active', assignmentId: 'active-assignment', classId: STONE_CLASS_ID, title: 'Assigned notebook', notebookAssigned: true },
  { id: 'resource', assignmentId: 'resource-assignment', classId: STONE_CLASS_ID, title: 'Optional episode' },
  { id: 'done', assignmentId: 'new-edition', classId: STONE_CLASS_ID, title: 'Already submitted', notebookAssigned: true },
 ] });
 render(<MemoryRouter><CurrentlyMissing classId={STONE_CLASS_ID} userId="student" /></MemoryRouter>);
 fireEvent.click(screen.getByRole('button', { name: 'Currently Missing' }));
 const panel = within(screen.getByRole('region', { name: 'Currently Missing' }));
 expect(await panel.findByRole('link', { name: /A reading/ })).toHaveAttribute('href', `/discussions/texts/text/${STONE_CLASS_ID}`);
 expect(panel.getByText('1 reply with a quote left')).toBeVisible();
 expect(panel.getByRole('link', { name: /Assigned notebook/ })).toHaveAttribute('href', '/game/play/active-assignment?notebook=1');
 expect(panel.queryByText('Optional episode')).toBeNull();
 expect(panel.queryByText('Already submitted')).toBeNull();
 mocks.readings.mockResolvedValue({ readings: [] });
 mocks.library.mockResolvedValue({ assignments: [] });
 fireEvent(window, new CustomEvent('class-materials-refreshed', { detail: STONE_CLASS_ID }));
 expect(await panel.findByText('You’re all caught up.')).toBeVisible();
});
