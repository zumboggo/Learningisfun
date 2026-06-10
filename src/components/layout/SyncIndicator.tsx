interface SyncIndicatorProps {
  pending: number;
  failed: number;
  lastSyncAt: string | null;
  isSyncing: boolean;
  online: boolean;
  syncNow?: () => Promise<void>;
}

export function SyncIndicator({ pending, failed, isSyncing, online, syncNow }: SyncIndicatorProps) {
  const getStatusColor = () => {
    if (!online) return 'bg-gray-400';
    if (failed > 0) return 'bg-red-500';
    if (isSyncing || pending > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!online) return 'Offline';
    if (isSyncing) return 'Syncing…';
    if (failed > 0) return `${failed} failed`;
    if (pending > 0) return `${pending} pending`;
    return 'Synced';
  };

  return (
    <button
      onClick={syncNow ? () => void syncNow() : undefined}
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
      title={getStatusText()}
    >
      <span className={`w-2 h-2 rounded-full ${getStatusColor()} ${isSyncing ? 'animate-pulse' : ''}`} />
      <span className="hidden sm:inline">{getStatusText()}</span>
    </button>
  );
}
