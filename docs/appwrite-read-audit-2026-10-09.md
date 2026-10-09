# Appwrite read-budget audit — October 9, 2026

## Confirmed console usage

Personal projects organization, Learning is fun project, Free plan; current cycle September 24–October 24. Console estimates can lag up to four hours.

| Metric | Used | Included |
|---|---:|---:|
| Database reads | 501,300 | 500,000 |
| Database writes | 3,200 | 250,000 |
| Storage | 286.42 MB | 2 GB |
| Bandwidth | 407.51 MB | 5 GB |
| Function executions | 10,800 | 750,000 |
| Monthly active users | 63 | 75,000 |
| Realtime messages | 34,800 | 2,000,000 |

The console explicitly reports API access suspended because of database reads. Smaller artwork cannot resolve this quota. No billing settings were changed. Optimizations cannot refund reads already consumed; the console says restore service by waiting for the cycle reset or upgrading.

Appwrite counts rows returned, not only API requests: fetching 100 records consumes 100 reads; an empty query also consumes a read. Source: https://appwrite.io/docs/advanced/billing/database-reads-and-writes

## Findings and changes

Historical per-feature attribution is not available in this audit. These are verified code paths, not measured percentages of the 501,300 reads.

- ReadingDiscussionPage refreshed the whole discussion every 15 seconds while visible. Removed the interval; initial load, explicit Refresh, post-mutation refresh and returning focus remain (focus limited to once a minute). A 15-minute open page previously could trigger about 60 timer refreshes per student. Illustratively, 25 students × 60 refreshes × 100 returned rows = 150,000 reads. This is a scenario, not an observed bill breakdown.
- Flashcard sync read planning cards through learning-content and then fetched the same decks' cards directly again. The direct query now excludes decks already returned by planning. Savings per refresh equal the number of duplicate planning-card rows formerly returned.
- AssignedCopywork fetched all planning materials on every window focus. Added a 15-minute, account-and-class-scoped in-memory cache and concurrent request coalescing. It still uses the existing backend response for compatibility; a future narrow copywork-only server action would remove unrelated card reads on cache misses.
- Teaching Stone uploaded choices and fetched all personal history and class rankings after every choice. Choice saves now upload only; results refresh on entry, completion or explicit request. Failed uploads back off from 30 seconds to 15 minutes; local saves continue immediately. Existing conflict detection and server score validation remain intact.
- The Game library for classes with no assigned episodes performs no additional server reads. Existing Ethics results load when opening its library. Scores are labeled when only local results are available.

## Remaining high-value work

1. Narrow readPlanningMaterials by requested material kind so copywork never loads deck/cards. Deploy and verify the server change before relying on it.
2. Make flashcard refresh version-aware or load cards on opening a deck. Confirm every edit/deletion/release updates a deck revision before using revisions to skip reads.
3. Replace broad forced realtime refreshes with targeted invalidation. AuthContext currently re-fetches all classes in an affected domain after events. Preserve teacher changes and cross-device edits.
4. Add server-side aggregate best-score records when class histories become large, preserving first completions and conflict-safe attempts. Avoid a separate membership/profile query per leaderboard row.
5. Instrument sampled counts of returned rows by action, without storing student text or creating a database read per metric. Compare at least a normal school week, including release days, against the same-length period before changing budgets.

At 63 active users, 500,000 reads allows approximately 7,937 reads/user/month (about 361 per user per 22 school days), including shared overhead. This is a planning budget, not a guarantee. Reduced reads should be measured after service resumes before claiming the app will remain below the free limit.

## Verification limits

Unit/integration tests and the production build can run locally while the quota is exhausted. Live account-backed saves, rankings and student access cannot be fully smoke-tested until Appwrite resumes. Do not describe a deployed frontend as proof that backend API access has recovered.

## Follow-up implementation after account upgrade

The user upgraded Appwrite to Pro on October 9; the console now permits project access. This does not itself establish a sustainable future monthly read count.

Implemented:
- Reading discussions load initially and after the user's own mutations. Peer updates require the prominent **Refresh discussion** button. Focus/visibility changes and elapsed-time display cause no discussion requests. A local timer updates the last-refresh age.
- Planning queries accept `kind` and `includeCards`; copywork excludes decks/cards, while flashcard catalogs exclude card bodies. Kind filtering uses the existing class/release index, requiring no schema migration.
- Opening a vocabulary collection, study session, presentation, editor, export or quiz generation loads the selected decks. The server checks access and compares the cached deck revision (`updatedAt`). Unchanged revisions return no card rows. Downloads are account-scoped, coalesced, and reconciled without deleting queued offline card edits. A previously downloaded deck remains usable offline after invalidation.
- Card creation, editing, queued card mutations, scheduled release and consolidation update deck revisions. CSV edits now use the same server editing path. Realtime card events invalidate the affected deck; deck metadata updates no longer reload every class's cards.
- Practice records save locally first and upload in batches of at most 40 operations, approximately every 30 seconds and at session end/reconnection. Reviews/events keep their immutable IDs; retrying does not overwrite another device's review history. Session snapshots merge monotonically. Queues are account-scoped, and browsers supporting Web Locks serialize uploads across tabs. Batch transport reduces requests; it does not eliminate the database writes needed to preserve individual review history.

Verification covers manual-only refreshing, preserved typed discussion replies, deck revision hits/misses, concurrent edits, foreign-class rejection, deletion reconciliation, queued edit preservation, offline/account isolation, batch retry IDs and independent device histories. Live deployment IDs and smoke-test results are recorded in the release handoff.
