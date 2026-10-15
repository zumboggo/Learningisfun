# Writing prompt discussions

Writing prompts appear under Discussions and retain `/presentations/:sessionId/live` URLs and their original `class_sessions`, `discussion_questions`, and `discussion_answers` records. The class-page button remains a shortcut.

`DiscussionTarget` selects a text/class pair or a writing session. The shared discussion handler resolves writing roots from existing answers and stores only replies, moderation metadata, and assignment rounds in the private reading collections under a hashed `writing:<sessionId>` workspace. Root revisions preserve IDs. No answer copies or new collections are required.

Settings in `notesMarkdown` are `discussionMode` and `studentsCanView`. Active legacy prompts default to private, while legacy published prompts default to shared. Enabling Discussion Mode reveals submissions; visibility can then be changed independently. Hiding submissions blocks student replies and excludes peers' work and assignments from student responses. Finished prompts remain read-only with their visibility preserved. Student payloads omit authors and names; the teacher retains authorship and export access. Classroom updates use the explicit Refresh responses button, consistent with text discussions.

The shared assignment allocator excludes students' own submissions and prioritizes unanswered work. Direct replies complete assignments; nested replies do not. Retrying a publication or reply does not duplicate it. Submission revisions, reply changes, settings, and finishing use the same transactional workspace guard.

Exports are teacher-only, fully paginated, and independent of screen filters. TXT and CSV support optional replies and optional student names, both off by default. CSV preserves Unicode and multiline values and neutralizes formula prefixes. Presentation always uses anonymous labels and full text, with scroll and Previous/Next controls; replies start collapsed.

## Deployment

1. Run frontend tests, backend lifecycle/access tests, and the production build.
2. Deploy `learning-content` with `scripts/deploy-episode-backend.mjs`.
3. Run `scripts/migrate-writing-discussions.mjs` with the existing private deployment environment; inspect the dry run, then use `--apply`. This normalizes weekly archives to permission-checked links, makes `discussion_answers` server-only, and removes browser writes to questions and class sessions. Their mutations now use the authorized backend, including legacy teacher notes. Original submissions are preserved.
4. Run `scripts/smoke-writing-prompts.mjs --run` with the same environment. It creates isolated synthetic accounts and a class, verifies the complete workflow and direct database restrictions, and removes only its own fixtures.
5. Push the frontend to `master` and verify GitHub Pages deployment.

Do not restore the old broad browser permissions as a rollback: they bypass anonymity and visibility. A frontend rollback must retain the compatible secure backend and archive representation.

Production verification on 2026-10-15: backend deployment `6ad048e378fe632681d0`; 15 existing writing sessions normalized; isolated end-to-end smoke test passed. Desktop presentation and 390-pixel mobile layout inspected using synthetic content.
