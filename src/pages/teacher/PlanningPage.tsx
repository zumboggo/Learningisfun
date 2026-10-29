import { Navigate } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { functions } from '@/lib/appwrite';
import markup from '@/features/planning/editor.html?raw';
import styles from '@/features/planning/editor.css?raw';
import editor from '@/features/planning/editor.js?raw';
import merge from '@/features/planning/merge.js?raw';
import sync from '@/features/planning/sync.js?raw';

// Keep the established editor's styles and print layout isolated from app chrome.
// No separate login, service worker, or public editor URL is introduced.
export function PlanningPage() {
  const { user, isTeacher } = useAuth();
  const frame = useRef<HTMLIFrameElement>(null);
  const userId = user?.$id;
  const canPlan = !!user && ['student', 'teacher', 'admin'].includes(user.role);
  const document = useMemo(() => {
    if (!userId || !canPlan) return '';
    const script = `window.PLANNING_USER=${JSON.stringify(userId)};window.PLANNING_ORIGIN=${JSON.stringify(window.location.origin)};\n${editor}\n${merge}\n${sync}`.replace(/<\/script/gi, '<\\/script');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Planning</title><style>${styles}</style></head><body>${isTeacher ? markup : markup.replace(' brainstorming', ' planner')}<script>${script}</script></body></html>`;
  }, [userId, canPlan, isTeacher]);

  useEffect(() => {
    if (!userId || !canPlan) return;
    let active = true;
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const request = event.data;
      if (request?.type !== 'planning-request' || typeof request.id !== 'string') return;
      if (!['list', 'save', 'delete'].includes(request.action)) return;
      const target = frame.current?.contentWindow;
      try {
        const execution = await functions.createExecution('teacher-planning', JSON.stringify({
          action: request.action, deviceId: request.deviceId, payload: request.payload,
        }));
        const data = JSON.parse(execution.responseBody || '{}');
        if (execution.status === 'failed' || execution.responseStatusCode >= 400 || data.error) {
          throw new Error(data.error || 'Could not sync planning. Your local boards are safe.');
        }
        if (active) target?.postMessage({ type: 'planning-response', id: request.id, data }, window.location.origin);
      } catch (error) {
        if (active) target?.postMessage({ type: 'planning-response', id: request.id,
          error: error instanceof Error ? error.message : 'Could not sync planning.' }, window.location.origin);
      }
    };
    window.addEventListener('message', receive);
    return () => { active = false; window.removeEventListener('message', receive); };
  }, [userId, canPlan]);

  if (!userId || !canPlan) return <Navigate to="/dashboard" replace />;
  return <iframe key={userId} ref={frame} srcDoc={document} title="Private planning boards"
    allow="clipboard-write" className="w-full border-0" style={{ height: 'calc(100dvh - 130px)', minHeight: 540 }} />;
}
