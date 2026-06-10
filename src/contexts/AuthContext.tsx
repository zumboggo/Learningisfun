import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@/types';
import * as authService from '@/services/auth.service';
import * as syncService from '@/services/sync.service';
import * as classService from '@/services/class.service';
import * as readingService from '@/services/reading.service';
import * as flashcardService from '@/services/flashcard.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserData = useCallback(async (userId: string) => {
    await classService.syncClassesFromServer(userId);
    await readingService.syncReadingsFromServer();
    await flashcardService.syncDecksFromServer();
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

  const loginHandler = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
    syncService.setupSyncListeners();
    void syncUserData(u.$id);
  }, [syncUserData]);

  const registerHandler = useCallback(async (email: string, password: string, name: string) => {
    const u = await authService.register(email, password, name);
    setUser(u);
    syncService.setupSyncListeners();
  }, []);

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
