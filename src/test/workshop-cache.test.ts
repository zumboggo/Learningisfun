import { beforeEach, expect, it, vi } from 'vitest';
const remote = vi.hoisted(() => vi.fn());
vi.mock('@/services/animated-stories', () => ({ animatedCall: remote }));
import { invalidateAnimatedLibrary, readAnimatedLibrary } from '@/services/use-animated-library';
beforeEach(() => { invalidateAnimatedLibrary('teacher'); remote.mockReset(); });
it('separates pending requests and cached episode lists when the same teacher switches views', async () => {
  remote.mockImplementation(async (_action, payload) => ({ assignments: [{ id: payload.workshop ? 'workshop-assignment' : 'own-assignment' }], drafts: payload.workshop ? [] : [{ id: 'private-draft' }] }));
  const [own, workshop] = await Promise.all([readAnimatedLibrary('teacher', false), readAnimatedLibrary('teacher', true)]);
  expect(own.drafts).toHaveLength(1); expect(workshop.drafts).toEqual([]);
  expect(workshop.assignments[0].id).toBe('workshop-assignment');
  expect(await readAnimatedLibrary('teacher', false)).toEqual(own);
  expect(await readAnimatedLibrary('teacher', true)).toEqual(workshop);
  expect(remote).toHaveBeenCalledTimes(2);
});
