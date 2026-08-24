import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import * as authService from '@/services/auth.service';
import * as syncService from '@/services/sync.service';
import * as classService from '@/services/class.service';
import * as classSessionService from '@/services/class-session.service';

import * as flashcardService from '@/services/flashcard.service';
import * as quizService from '@/services/quiz.service';
import * as writingService from '@/services/writing.service';
import * as textService from '@/services/text.service';
import * as presentationService from '@/services/presentation.service';
import { client, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { runCachedSync, SYNC_WINDOWS } from '@/services/sync-policy';

type SyncDomain = 'account' | 'sessions' | 'flashcards' | 'quizzes' | 'writing' | 'texts' | 'presentations';
const ALL_SYNC_DOMAINS: SyncDomain[] = ['account', 'sessions', 'flashcards', 'quizzes', 'writing', 'texts', 'presentations'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  viewAsStudent: boolean;
  setViewAsStudent: (value: boolean) => void;
  effectiveRole: 'student' | 'teacher' | 'parent' | 'admin' | null;
  isTeacher: boolean;
  isAdmin: boolean;
  isParent: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsStudent, setViewAsStudent] = useState(false);

  const effectiveRole = user ? (viewAsStudent ? 'student' : user.role) : null;
  const isTeacher = effectiveRole === 'teacher' || effectiveRole === 'admin';
  const isAdmin = effectiveRole === 'admin';
  const isParent = effectiveRole === 'parent';

  const syncUserData = useCallback(async (userId: string, force = false, requestedDomains: SyncDomain[] = ALL_SYNC_DOMAINS) => {
    const domains = new Set(requestedDomains);
    if (domains.has('account')) {
      await runCachedSync(`account:${userId}`, SYNC_WINDOWS.account, () => classService.syncClassesFromServer(userId), force);
    }
    const memberships = await db.class_members.where('userId').equals(userId).toArray();
    const taught = await db.classes.where('teacherId').equals(userId).toArray();
    const classIds = [...new Set([...memberships.map(m => m.classId), ...taught.map(c => c.$id)])];
    const cachedUser = await authService.getCachedUser();
    const isTeacher = cachedUser?.role === 'teacher' || cachedUser?.role === 'admin';
    const tasks: Promise<void>[] = [];
    if (domains.has('sessions')) tasks.push(runCachedSync(`sessions:${userId}`, SYNC_WINDOWS.catalog, () => classSessionService.syncClassSessionsFromServer(classIds), force));
    if (domains.has('flashcards')) tasks.push(runCachedSync(`flashcards:${userId}`, SYNC_WINDOWS.stableContent, () => flashcardService.syncDecksFromServer(classIds, userId, isTeacher), force));
    if (domains.has('quizzes')) tasks.push(runCachedSync(`quizzes:${userId}`, SYNC_WINDOWS.catalog, () => quizService.syncQuizzesFromServer(classIds), force));
    if (domains.has('writing')) tasks.push(runCachedSync(`writing:${userId}`, SYNC_WINDOWS.catalog, () => writingService.syncWritingFromServer(classIds), force));
    if (domains.has('texts')) tasks.push(runCachedSync(`texts:${userId}`, SYNC_WINDOWS.catalog, () => textService.syncTextsFromServer(classIds, userId, isTeacher), force));
    if (domains.has('presentations')) tasks.push(runCachedSync(`presentations:${userId}`, SYNC_WINDOWS.catalog, async () => { await presentationService.syncPresentationLinks(classIds); }, force));
    await Promise.all(tasks);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        syncService.setupSyncListeners();
        void syncUserData(currentUser.$id);
      }
    } catch {
      setUser(null);
    }
  }, [syncUserData]);

  useEffect(() => {
    const init = async () => {
      try {
        const cached = await authService.getCachedUser();
        if (cached) {
          setUser(cached);
          syncService.setupSyncListeners();
        }
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          void syncUserData(currentUser.$id);
        }
      } catch {
        // Offline - use cached
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [syncUserData]);

  useEffect(() => {
    if (!user || !DATABASE_ID) return;
    let timer: number | undefined;
    let disposed = false;
    const pendingDomains = new Set<SyncDomain>();
    const runSync = async (force = false) => {
      if (disposed || document.visibilityState !== 'visible') return;
      const domains = pendingDomains.size ? [...pendingDomains] : ALL_SYNC_DOMAINS;
      pendingDomains.clear();
      await syncUserData(user.$id, force, domains);
    };
    const scheduleSync = (delay = 5000, force = false) => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => void runSync(force), delay);
    };
    const refresh = () => { if (document.visibilityState === 'visible') scheduleSync(500, false); };
    document.addEventListener('visibilitychange', refresh);
    const domainCollections: Array<[SyncDomain, string[]]> = [
      ['account', [COLLECTIONS.classes, COLLECTIONS.class_members]],
      ['sessions', [COLLECTIONS.class_sessions]],
      ['flashcards', [COLLECTIONS.deck_assignments, COLLECTIONS.flashcard_decks, COLLECTIONS.flashcard_cards]],
      ['quizzes', [COLLECTIONS.quiz_assignments, COLLECTIONS.quizzes, COLLECTIONS.quiz_questions]],
      ['writing', [COLLECTIONS.writing_prompt_assignments, COLLECTIONS.writing_prompts]],
      ['texts', [COLLECTIONS.text_assignments, COLLECTIONS.texts]],
      ['presentations', [COLLECTIONS.presentation_links]],
    ];
    const collections = [...new Set(domainCollections.flatMap(([, ids]) => ids))];
    const unsubscribe = client.subscribe(collections.map(id => `databases.${DATABASE_ID}.collections.${id}.documents`), event => {
      const channels = event.channels.join(' ');
      for (const [domain, ids] of domainCollections) {
        if (ids.some(id => channels.includes(`collections.${id}.documents`))) pendingDomains.add(domain);
      }
      scheduleSync(5000, true);
    });
    return () => {
      disposed = true;
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
      unsubscribe();
    };
  }, [user, syncUserData]);

  const loginHandler = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
    syncService.setupSyncListeners();
    void syncUserData(u.$id);
    return u;
  }, [syncUserData]);

  const registerHandler = useCallback(async (email: string, password: string, name: string, role?: UserRole) => {
    const u = await authService.register(email, password, name, role || 'student');
    setUser(u);
    syncService.setupSyncListeners();
    void syncUserData(u.$id);
    return u;
  }, [syncUserData]);

  const logoutHandler = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login: loginHandler,
      register: registerHandler,
      logout: logoutHandler,
      refreshUser,
      viewAsStudent,
      setViewAsStudent,
      effectiveRole,
      isTeacher,
      isAdmin,
      isParent,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
