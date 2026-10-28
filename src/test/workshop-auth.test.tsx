import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HashRouter, Link } from 'react-router-dom';
const mocks = vi.hoisted(() => ({
  user: { $id: 'participant', role: 'teacher' },
  request: vi.fn(), sync: vi.fn(),
}));
vi.mock('@/lib/appwrite', () => ({ client: {}, DATABASE_ID: '', COLLECTIONS: {} }));
vi.mock('@/services/auth.service', () => ({ getCachedUser: async () => mocks.user, getCurrentUser: async () => mocks.user }));
vi.mock('@/services/sync.service', () => ({ setupSyncListeners: vi.fn() }));
vi.mock('@/services/class.service', () => ({ syncClassesFromServer: vi.fn() }));
vi.mock('@/services/class-material-refresh.service', () => ({ syncClassMaterials: mocks.sync }));
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: mocks.request }));
vi.mock('@/services/flashcard-cache', () => ({ invalidateDeckCards: vi.fn() }));
vi.mock('@/services/private-episode-content', () => ({ clearPrivateEpisodeMemory: vi.fn() }));
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { WORKSHOP_CLASS_ID } from '@/services/workshop-context';
function Workspace() {
  const { user, isTeacher, workshopMode, workshopAccess } = useAuth();
  return <><p>{user?.role} / {isTeacher ? 'teaching' : 'learning'} / {workshopMode ? 'workshop' : 'normal'}</p><p>{workshopAccess ? 'Access checked' : 'Checking'}</p><Link to={`/classes/${WORKSHOP_CLASS_ID}`}>Workshop</Link><Link to="/classes">My classes</Link></>;
}
beforeEach(async () => {
  window.location.hash = '#/classes'; mocks.request.mockReset(); mocks.sync.mockReset();
  mocks.request.mockResolvedValue({ classId: WORKSHOP_CLASS_ID, owner: false, enrolled: true, eligible: true });
  await db.classes.clear(); await db.class_members.clear();
});
afterEach(() => { cleanup(); window.location.hash = ''; });
it('changes only the participant view, syncs its materials on entry, and returns to the same teacher account', async () => {
  render(<HashRouter><AuthProvider><Workspace /></AuthProvider></HashRouter>);
  await screen.findByText('Access checked'); expect(screen.getByText('teacher / teaching / normal')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Workshop' }));
  await screen.findByText('student / learning / workshop');
  await waitFor(() => expect(mocks.sync).toHaveBeenCalledWith([WORKSHOP_CLASS_ID], 'participant', false, true, expect.any(Array)));
  expect(mocks.user.role).toBe('teacher');
  fireEvent.click(screen.getByRole('link', { name: 'My classes' }));
  await screen.findByText('teacher / teaching / normal');
});
