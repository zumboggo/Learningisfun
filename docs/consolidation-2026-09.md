# Consolidation: September 2026

## Removed only unreachable UI
- WritingWorkspacePage and teacher/WritingResponsesPage were not imported by the app router or any active screen.
- AssignPromptModal and RubricScorer were only used by that retired workflow (or were themselves unused).
- The obsolete workspace UI tests were removed with that screen. Current writing-feedback and data compatibility tests remain.
- The older RedditDiscussionPage is still reached from DiscussionPage and was deliberately retained.

No collections, saved submissions, reviews, annotations, file uploads, or backend permissions were changed. Deleted code remains recoverable in Git history.

## Boundaries
- services/legacy/writing.ts retains the earlier writing data and sync operations, with a stable writing.service.ts export for existing callers.
- Personal AI writing uses writing-feedback.service.ts, independent of the retired UI.
- Texts, class creation, and weekly text creation share CreateTextModal. Creation and editing share class/date/purpose controls.
- Weekly quick entries still allow a title without a URL. Full text and file upload are available in the same form.
- Planning drafts remain private and use their deliberate review/publish workflow. They must not publish immediately simply because a shared class editor is used.
- Class refresh and account background refresh use one content-domain coordinator. Forced manual refresh bypasses the time window; identical in-flight requests are coalesced. Cache keys include account, role, and class scope.
- Manage class groups roster, join codes, parent/substitute access and nickname management. Report alerts remain prominent.

## Verification
Run npm test and npm run build. Added coverage checks shared creation defaults, weekly assignment context, concurrent sync coalescing, manual refresh, failure recovery, and account/class isolation.

## Follow-up consolidation
- Shared discussion text input, supporting-link fields, voting and moderation UI. Text discussions retain upvotes only; general discussions retain their existing downvotes and delete permissions. Existing reporting remains unchanged.
- General discussion replies now keep local drafts on cancel/failure. Finished discussions and locked parent threads do not show contribution controls; the existing server remains authoritative.
- Shared resource title/link inputs across text creation, editing and the private weekly resource editor.
- Resource propagation uses an explicit content-field list; placement IDs and completion status are never overwritten. Distinct copywork/reading flags are not silently merged.
- Publishing projection resolves the weekly bank before deriving materials, deduplicates repeated resource/date entries, and keeps distinct due dates. This changes future save/preview/publish behavior only; no stored plans are batch-rewritten.
- Removed the unreferenced PlannerCourseEditor component. Historical data, snapshots, archives and backend collections are retained.
