import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus, processQueue } from '@/services/sync.service';
import { useOnlineStatus } from './useOnlineStatus';

interface SyncState {
  pending: number;
  failed: number;
  lastSyncAt: string | null;
  isSyncing: boolean;
}

export function useSyncStatus(): SyncState & { syncNow: () => Promise<void> } {
  const [state, setState] = useState<SyncState>({
    pending: 0,
    failed: 0,
    lastSyncAt: null,
    isSyncing: false,
  });
  const online = useOnlineStatus();

  const refresh = useCallback(async () => {
    const status = await getSyncStatus();
    setState(prev => ({
      ...prev,
      pending: status.pending,
      failed: status.failed,
      lastSyncAt: status.lastSyncAt,
    }));
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const syncNow = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      await processQueue();
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
      await refresh();
    }
  }, [refresh]);

  return { ...state, syncNow };
}
