# Offline Synchronization Design

## Architecture Overview

EduSpark uses a local-first architecture where all data is stored in IndexedDB first, then synchronized to Appwrite Cloud when online.

```
┌─────────────────┐     ┌─────────────────┐
│   React UI      │     │  Appwrite Cloud  │
│                 │     │                 │
│  ┌───────────┐  │     │  ┌───────────┐  │
│  │ Dexie DB  │◄─┼─────┼──┤ Database  │  │
│  │ (IndexedDB)│  │     │  └───────────┘  │
│  └─────┬─────┘  │     │  ┌───────────┐  │
│        │        │     │  │ Functions │  │
│  ┌─────▼─────┐  │     │  └───────────┘  │
│  │ Sync Queue│──┼─────┼──►              │
│  └───────────┘  │     │                 │
└─────────────────┘     └─────────────────┘
```

## Sync Queue

### Queue Structure

Every local change is added to the sync queue:

```typescript
interface SyncOperation {
  id?: number;            // Auto-increment primary key
  operationId: string;    // UUID for idempotency
  userId: string;         // User who made the change
  deviceId: string;       // Device that made the change
  entityType: string;     // 'annotation', 'question', 'vote', etc.
  entityId: string;       // ID of the affected entity
  operationType: 'create' | 'update' | 'delete';
  timestamp: number;      // When the change was made
  localVersion: number;   // Local version number
  payload: unknown;       // Full entity data
  retryCount: number;     // Number of retry attempts
  syncStatus: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  error?: string;         // Last error message
}
```

### Queue Processing

```typescript
async function processQueue(): Promise<void> {
  if (isSyncing || !isOnline()) return;
  isSyncing = true;

  try {
    // Get pending operations ordered by timestamp
    const pending = await db.sync_queue
      .where('syncStatus')
      .anyOf('pending', 'failed')
      .and(op => op.retryCount < MAX_RETRIES)
      .sortBy('timestamp');

    for (const op of pending) {
      await db.sync_queue.update(op.id, { syncStatus: 'syncing' });
      try {
        await executeSyncOperation(op);
        await db.sync_queue.update(op.id, { syncStatus: 'synced' });
      } catch (err) {
        await db.sync_queue.update(op.id, {
          syncStatus: op.retryCount + 1 >= MAX_RETRIES ? 'failed' : 'pending',
          retryCount: op.retryCount + 1,
          error: err.message,
        });
      }
    }

    await db.app_metadata.put({ key: 'lastSyncAt', value: new Date().toISOString() });
  } finally {
    isSyncing = false;
  }
}
```

## Sync Triggers

### Automatic Triggers

1. **App opens** - Initial sync on page load
2. **Online restored** - `window.addEventListener('online', ...)`
3. **Tab visible** - `document.addEventListener('visibilitychange', ...)`
4. **After local change** - Debounced 2 seconds

### Manual Trigger

- User presses "Sync" button in the UI

## Data Flow

### Write Path (Local → Cloud)

1. User performs action (e.g., creates annotation)
2. Data written to IndexedDB with `syncStatus: 'local'`
3. Sync operation added to queue
4. UI updates immediately via Dexie `liveQuery`
5. When online, sync engine processes queue
6. Operation sent to Appwrite (API or Function)
7. On success, marked as `syncStatus: 'synced'`
8. On failure, retry with backoff

### Read Path (Cloud → Local)

1. On sync trigger, pull changes from Appwrite
2. Compare with local data using timestamps
3. Merge according to conflict rules
4. Update IndexedDB
5. UI reacts to IndexedDB changes

## Idempotency

### Why Idempotency Matters

Network failures can cause:
- Operations sent but response lost
- Operations partially applied
- Duplicate retries

### How We Ensure Idempotency

1. **Unique Operation IDs** - Each operation has a UUID
2. **Server-side dedup** - Appwrite Functions check operationId
3. **Client-side dedup** - Reviews use `operationId` as document ID
4. **Idempotent writes** - Using `$id` for document creation

```typescript
// Example: Idempotent review creation
const reviewId = generateId(); // UUID
await databases.createDocument(
  DATABASE_ID,
  COLLECTIONS.card_reviews,
  reviewId, // Use as document ID for idempotency
  { userId, cardId, rating, operationId: reviewId }
);
```

## Conflict Resolution

### Rules by Entity Type

#### Additive Records
**Entities:** reviews, votes, annotations, questions

**Rule:** Preserve both valid records, deduplicate by operationId

```typescript
// Both records preserved if they have different operationIds
// Duplicate if same operationId (idempotent retry)
```

#### Editable Personal Content
**Entities:** notes, personal decks, annotations

**Rule:** Prefer newest valid version

```typescript
function resolvePersonal<T extends { updatedAt: string }>(local: T, remote: T): T {
  return new Date(local.updatedAt) > new Date(remote.updatedAt) ? local : remote;
}
```

**Exception:** If edits occurred on different devices, preserve local copy and mark conflict

#### Teacher-Published Content
**Entities:** readings, teacher decks

**Rule:** Teacher's server version is authoritative

```typescript
function resolveTeacherContent<T>(local: T, remote: T): T {
  return remote; // Teacher is always authoritative
}
```

**Exception:** Student review history and personal notes are preserved

### Conflict UI

When a conflict is detected:
1. `syncStatus` is set to `'conflict'`
2. UI shows conflict indicator
3. User can review both versions
4. User chooses which to keep
5. Resolution is synced

## Retry Strategy

### Retry Limits

- **Max retries:** 5
- **Backoff:** Exponential with jitter
- **Base delay:** 1 second
- **Max delay:** 30 seconds

### Retry Logic

```typescript
function getRetryDelay(retryCount: number): number {
  const base = Math.min(1000 * Math.pow(2, retryCount), 30000);
  const jitter = Math.random() * 1000;
  return base + jitter;
}
```

### Failed Operations

After max retries:
1. `syncStatus` set to `'failed'`
2. Error message stored
3. UI shows failure indicator
4. User can manually retry
5. Admin can view failed operations

## Pull Strategy

### Incremental Pull

```typescript
async function pullChanges(userId: string): Promise<void> {
  const lastSync = await getLastSyncTime(userId);

  // Pull changes since last sync
  const changes = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.annotations,
    [
      Query.equal('userId', userId),
      Query.greaterThan('updatedAt', lastSync),
    ]
  );

  // Merge into local DB
  for (const doc of changes.documents) {
    const local = await db.annotations.get(doc.$id);
    if (!local || local.syncStatus === 'synced') {
      await db.annotations.put({ ...doc, syncStatus: 'synced' });
    } else if (local.syncStatus === 'local') {
      // Conflict: both modified
      const resolved = resolveConflict(local, doc, 'annotation');
      await db.annotations.put({ ...resolved, syncStatus: 'conflict' });
    }
  }
}
```

## Offline Indicators

### UI Indicators

| State | Indicator |
|-------|-----------|
| Online, synced | Green dot + "Synced" |
| Online, pending | Yellow dot + "Syncing…" |
| Online, failed | Red dot + "X failed" |
| Offline | Gray dot + "Offline" |
| Conflict | Orange dot + "Needs attention" |

### Status Bar

```tsx
function SyncIndicator({ pending, failed, isSyncing, online }) {
  const color = !online ? 'gray' : failed > 0 ? 'red' : isSyncing ? 'yellow' : 'green';
  const text = !online ? 'Offline' : isSyncing ? 'Syncing…' : `${pending} pending`;
  return <div className={`bg-${color}-500`}>{text}</div>;
}
```

## Background Sync

### Browser Support

Background Sync API support varies:
- Chrome: ✓
- Firefox: ✗
- Safari: ✗

### Our Approach

We do NOT rely solely on Background Sync. Instead:
1. Attempt sync on app open
2. Attempt sync when online restored
3. Attempt sync when tab visible
4. Attempt sync after local change
5. Allow manual sync button

This ensures sync works across all browsers.

## Testing Sync

### Test Scenarios

1. **Offline create** - Create annotation offline, verify it syncs when online
2. **Duplicate retry** - Simulate network failure, verify no duplicates
3. **Conflict resolution** - Edit same annotation on two devices
4. **Queue persistence** - Close app, reopen, verify queue preserved
5. **Large queue** - Queue 100 operations, verify all process
6. **Concurrent edits** - Edit same entity simultaneously

### Test Utilities

```typescript
// Simulate offline
Object.defineProperty(navigator, 'onLine', { value: false });

// Simulate network failure
vi.spyOn(databases, 'createDocument').mockRejectedValue(new Error('Network error'));

// Verify queue state
const pending = await db.sync_queue.where('syncStatus').equals('pending').count();
expect(pending).toBe(1);
```
