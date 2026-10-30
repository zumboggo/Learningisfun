# Episode Principles Portfolio

Every Ethics and Leadership episode, including animated episodes and the Teaching Stone, automatically includes a collapsed Principles Portfolio. It is available before completion and for earlier released episodes, with no separate teacher assignment or stage to open. Its five questions are:

1. What happened and what did you choose?
2. What principle guided you?
3. What supports or challenges that principle?
4. Has your thinking changed, and why?
5. How might you apply this principle elsewhere?

A deterministic episode/format key scoped to the authenticated student and class keeps one continuing notebook across replays and versions. All five answers remain editable; partial answers are valid. Existing three-question portfolios and reconsiderations are retained separately and remain readable/exportable. Scores and completion are unchanged.

Only the Ethics and Leadership class page and episode library link to saved answers. Other classes do not render or load the portfolio; direct routes and backend actions reject non-Ethics class IDs. Previously saved records are preserved. Students can read them together, continue writing, and export selected answers for their Principles Presentation. Teachers see their own class's answers. Teacher previews remain local and never create student records.

## Saving and call budget

Typing saves to IndexedDB immediately. Opening a notebook reads account entries once. A 60-second timer queues a snapshot only if answers changed, then synchronizes pending revisions. Unchanged notebooks make no save requests. Collapsing/navigating away, hiding the tab, reconnecting, or explicitly saving also attempts to flush. No full-class polling occurs. A save request is one function execution, not one database operation: authentication, access checks and revision checks also require reads.

Closing a browser cannot guarantee network completion. Device drafts and the outbox survive reloads; reopening retries pending writes. Before unload warns while changes still need queueing. The status distinguishes device saves, account saves and failures, and export provides a fallback. Edits during an in-flight save retain their own dirty snapshot and new revision. Conflicts preserve local writing instead of silently overwriting another device; export before resolving a conflict.

## Storage and authorization

Existing private `ethics_portfolio` storage is reused. Student/class/entry/revision records are immutable and retries idempotent; the latest revision is shown. This preserves conflict detection, at the cost of retaining a revision per changed save. Class reads paginate historical revisions; watch storage and read volume before introducing a snapshot/compaction policy. Do not delete old student writing as part of this feature.

The authenticated backend verifies current class membership or owning-teacher access. New episode notebook saves also validate the class's released episode/animated assignment. Legacy entries retain their original validation and submitted-response protection. Students cannot read another student's answers or save as a teacher. Titles/answers are rendered as plain text.

Deploy `learning-content` before publishing the frontend. This update uses the existing collection and schema. Tests cover partial answers, access, offline retries, replay identity, typing during a save, unchanged-save suppression, and existing legacy behavior.

## Three-answer Ethics notebooks (October 30, 2026)

Unanswered episodes use two fixed questions and a dropdown with three episode-specific third questions from `functions/learning-content/src/ethics-notebook-questions.json`. Authors must register three distinct tailored options for each new Ethics episode. One or two sentences per answer suffice. `legacyEpisodes` preserves the class-wide original format wherever answers already existed (The Second Ship and The King Who Would Not Listen at rollout). Device-only answered legacy entries also stay unchanged. Empty, unsubmitted entries may upgrade.

The optional entry `notebook` snapshot stores version, three options and selected index alongside three answers; no collection schema change is needed. Backend validation preserves snapshots and rejects relabeling answered legacy entries or dropping modern metadata. Reopening, teacher reading and export use the saved prompt. Clear the third answer before switching its dropdown selection. Old clients may continue saving legacy entries. Story packages and attempts remain unchanged. Run `node scripts/check-ethics-notebook-preservation.mjs` before deployment to verify class-wide preservation against live records; it prints episode IDs only.
