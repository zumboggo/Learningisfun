import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isWorkshopPath, workshopLocation } from './workshop-context';
import { animatedCall } from './animated-stories';
const cache = new Map<string, {at: number; data: any}>(), pending = new Map<string, Promise<any>>();

export async function readAnimatedLibrary(userId: string, workshop = workshopLocation()) {
  const key = userId + (workshop ? ':workshop' : ':teaching');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60000) return hit.data;
  let request = pending.get(key);
  if (!request) {
    request = animatedCall('animatedLibrary', {workshop}).then(data => {
      if (!Array.isArray(data?.assignments) || !Array.isArray(data?.drafts)) throw Error('Invalid episode library response');
      cache.set(key, {at: Date.now(), data});
      return data;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
  }
  return request;
}
export function invalidateAnimatedLibrary(userId: string) {
  cache.delete(userId + ':teaching'); cache.delete(userId + ':workshop');
  window.dispatchEvent(new Event('animated-library-changed'));
}
export function useAnimatedLibrary(userId: string) {
  const location = useLocation(), workshop = isWorkshopPath(location.pathname, location.search);
  const key = userId + (workshop ? ':workshop' : ':teaching');
  const [state, setState] = useState<{key: string; data: any} | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => {
      if (!userId) return;
      void readAnimatedLibrary(userId, workshop).then(data => { if (active) setState({key, data}); }).catch(() => {});
    };
    load(); window.addEventListener('animated-library-changed', load);
    return () => { active = false; window.removeEventListener('animated-library-changed', load); };
  }, [userId, workshop, key]);
  return state?.key === key ? state.data : cache.get(key)?.data || null;
}
