import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { WORKSHOP_CLASS_ID, isWorkshopPath, workshopLink, workshopPayload } from '@/services/workshop-context';
import WorkshopPage from '@/pages/WorkshopPage';
const mocks = vi.hoisted(() => ({ find: vi.fn(), join: vi.fn(), access: null as object | null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { $id: 'teacher', role: 'teacher' }, workshopAccess: mocks.access }) }));
vi.mock('@/services/class.service', () => ({ findClassByJoinCode: mocks.find, joinClass: mocks.join }));
beforeEach(() => { mocks.find.mockReset(); mocks.join.mockReset(); mocks.access = null; window.location.hash = ''; });
afterEach(() => { cleanup(); window.location.hash = ''; });
const mount = () => render(<MemoryRouter initialEntries={['/workshop']}><Routes><Route path="/workshop" element={<WorkshopPage />} /><Route path="/classes/:id" element={<p>Workshop materials</p>} /></Routes></MemoryRouter>);
it('validates the target before enrollment and opens the workshop after joining', async () => {
  mocks.find.mockResolvedValueOnce({ $id: 'ordinary-class' }).mockResolvedValue({ $id: WORKSHOP_CLASS_ID });
  mocks.join.mockResolvedValue({ $id: WORKSHOP_CLASS_ID });
  mount(); fireEvent.change(screen.getByLabelText('Workshop class code'), { target: { value: 'abc123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Join workshop' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Lifeplus Workshop class code');
  expect(mocks.join).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Join workshop' }));
  await screen.findByText('Workshop materials');
  expect(mocks.join).toHaveBeenCalledWith('teacher', 'ABC123', 'student');
});
it('keeps enrollment errors visible without changing the teacher account', async () => {
  mocks.find.mockResolvedValue({ $id: WORKSHOP_CLASS_ID }); mocks.join.mockRejectedValue(Error('Invalid or expired class code'));
  mount(); fireEvent.change(screen.getByLabelText('Workshop class code'), { target: { value: 'abc123' } }); fireEvent.click(screen.getByRole('button', { name: 'Join workshop' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid or expired'));
});
it('carries workshop context through learning links and leaves teaching navigation and queued context intact', () => {
  window.location.hash = `#/classes/${WORKSHOP_CLASS_ID}`;
  expect(workshopLink('/texts/guide?paragraph=2')).toBe(`/texts/guide?paragraph=2&workshop=${WORKSHOP_CLASS_ID}`);
  expect(workshopLink('/classes')).toBe('/classes'); expect(workshopLink('/settings')).toBe('/settings');
  expect(workshopPayload({ action: 'readTexts' })).toMatchObject({ workshop: true });
  expect(workshopPayload({ action: 'mutate', workshop: false })).toMatchObject({ workshop: false });
  expect(workshopPayload({ action: 'readGeneralPlanner' })).not.toHaveProperty('workshop');
  expect(isWorkshopPath(`/discussions/texts/guide/${WORKSHOP_CLASS_ID}`)).toBe(true);
  expect(isWorkshopPath('/texts/guide', `?classId=${WORKSHOP_CLASS_ID}`)).toBe(true);
  expect(isWorkshopPath('/classes/other')).toBe(false);
  window.location.hash = '#/classes'; expect(workshopLink('/texts/guide')).toBe('/texts/guide');
});
