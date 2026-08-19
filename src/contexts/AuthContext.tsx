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
import { client, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';

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

  const syncUserData = useCallback(async (userId: string) => {
    // Order matters: classes and memberships first, since the discussion pull
    // is driven by which classes this user is in.
    await classService.syncClassesFromServer(userId);
    await classSessionService.syncMyClassSessionsFromServer(userId);

    await flashcardService.syncDecksFromServer();
    const memberships = await (await import('@/db/schema')).db.class_members.where('userId').equals(userId).toArray();
    const taught = await (await import('@/db/schema')).db.classes.where('teacherId').equals(userId).toArray();
    const classIds = [...new Set([...memberships.map(m => m.classId), ...taught.map(c => c.$id)])];
    const cachedUser = await authService.getCachedUser();
    const isTeacher = cachedUser?.role === 'teacher' || cachedUser?.role === 'admin';
    await Promise.all([
      quizService.syncQuizzesFromServer(classIds),
      writingService.syncWritingFromServer(classIds, userId, isTeacher),
      textService.syncTextsFromServer(classIds, userId, isTeacher),
    ]);
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
    const refresh = () => { if (document.visibilityState === 'visible') void syncUserData(user.$id); };
    document.addEventListener('visibilitychange', refresh);
    const collections = [COLLECTIONS.classes, COLLECTIONS.class_members,
      COLLECTIONS.quiz_assignments, COLLECTIONS.quizzes, COLLECTIONS.quiz_questions,
      COLLECTIONS.writing_prompt_assignments, COLLECTIONS.writing_prompts, COLLECTIONS.peer_reviews,
      COLLECTIONS.text_assignments, COLLECTIONS.texts, COLLECTIONS.text_annotations,
      COLLECTIONS.text_discussion_posts, COLLECTIONS.text_discussion_votes];
    const unsubscribe = client.subscribe(collections.map(id => `databases.${DATABASE_ID}.collections.${id}.documents`), () => void syncUserData(user.$id));
    return () => { document.removeEventListener('visibilitychange', refresh); unsubscribe(); };
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
