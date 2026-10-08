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

Unsent composer drafts are device-local, scoped by user/text/class/category or reply parent.
Only confirmed successful posts clear a draft. Refresh and focus updates do not
replace the writing component. Discussion refreshes are manual, on focus (at most
once per ten seconds), and every fifteen visible seconds so a teacher-started
voting activity reaches students who already have the discussion open.

## Direct question posting

Students use **Post question** to share immediately with all classmates who can access
this assigned reading, including classmates who have posted nothing. New questions
never enter a private notebook. Existing saved notebook questions remain available
under **Previously saved questions**, with a direct posting button for each.
The shared question feed and composer remain visible during voting.

## Question voting and assignment preferences

The teacher's **Vote on Questions** control appears before **Assign questions**.
It starts a class/text voting activity, with three rounds of three options by
default. Teachers can choose 1–10 rounds and 2–10 questions per round, view
student progress, and end the activity. Only one activity can be open at a time.

Students see one ballot round at a time while voting. Options are stable across
refreshes and devices, exclude their own/hidden/locked/withdrawn questions, and
spread across the snapshot of questions available when the activity started.
With enough questions, options do not repeat between rounds. With a small pool,
unchosen options may reappear, but chosen questions never repeat; the number of
rounds and options is reduced when necessary. Each choice records one ordinary
upvote and persists in the student's private ballot. Teacher projections expose
completion counts; peers and parents cannot read another student's choices.

Voting activities use tagged JSON records in the existing server-only
`reading_reply_rounds` collection. They are kept separate from reply-assignment
rounds. No schema migration or data deletion is required. The authenticated
actions are `startReadingQuestionVoting`, `endReadingQuestionVoting`, and
`chooseReadingQuestionVote`; choices and votes commit in one guarded transaction.
Request IDs and round indices make retries safe and prevent double choices.

Question-assignment previews use the latest nonempty ballot for each student.
The allocator maximizes distinct question coverage, then distinct unanswered
coverage, then the number of students assigned one of their chosen questions.
It still excludes self-answers and preserves pending/completed work when filling
gaps. Coverage can prevent a preference match; preferences are not a guarantee.

Student Texts and weekly class materials share the purple Discussion button.
Available discussions are light purple without activity and dark purple with
any visible question or reply. A text assigned in multiple classes gets separate
class-labelled buttons in Texts. Availability/counts refresh every thirty visible
seconds and on return to the page.

Roll out the updated learning-content function before the frontend.

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
