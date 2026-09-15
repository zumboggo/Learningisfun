# Text discussions

Assigned texts automatically appear in Discussions → Texts. A workspace is the
deterministic hash of `(textId, classId)`; listing creates no database records.
Reassignment reuses the workspace. The existing session-based discussions remain
separate and unchanged.

## Storage and access

- `reading_posts`: workspace ID, private author ID, structured contribution JSON.
- `reading_votes`: one deterministic post/user document, plus a unique index.
- `reading_reports`: private reports visible only to the owning teacher.
- All three collections have no browser permissions and no document security
  overrides. The learning-content function checks class access and text release
  before every read or mutation. Only students and the owning teacher can write.
- Teacher-only projections contain participation and reports. Peer projections
  contain a stable pseudonym, not the author's account ID.
- Three reply levels; hidden ancestors hide descendants. Locked ancestors reject
  new replies. Quotes are stored snapshots, not recomputed from the source.
- Explicit upvote/neutral operations are idempotent; post request IDs make retries
  safe after a lost response. Downvotes are not accepted.

## Reader and legacy work

The reader contains no annotation composers or highlights. Article Mode retains
formatting and supports numbered paragraphs, quote copying, font controls and
reading support. Original PDFs retain their original layout.

Legacy annotations and advanced TQE records are read-only. Their existing read
projections and thresholds remain in effect; private annotations are still only
visible to their author. No legacy record is migrated into a shared contribution.
Unsent legacy notes are retained locally and shown to their author in the archive.
Old clients receive an explicit read-only error rather than silently losing work.

New drafts are device-local, scoped by user/text/class/category or reply parent.
Only confirmed successful posts clear a draft. Refresh and focus updates do not
replace the writing component. Discussion refreshes are manual, on focus (at most
once per minute), and every two visible minutes to limit Appwrite traffic.

## Provisioning and rollout

1. Run `scripts/backup-text-discussions.mjs` with a private absolute destination
   outside the public checkout. Backups contain student data: never commit them.
2. Provision only `reading_posts reading_votes reading_reports` with
   `scripts/setup-appwrite.mjs`.
3. Run the test suite, production build and targeted lint.
4. Deploy `learning-content`, wait for its deployment to be ready, then publish
   the frontend. No old records or collections are deleted.

Backend tests cover release boundaries, class separation, role denial, immediate
visibility, replies, duplicate retries, upvotes, moderation, reporting and quote
preservation. UI tests cover draft persistence, typing focus, quote copying and
sorting. Existing TQE tests continue to validate legacy privacy projections.
