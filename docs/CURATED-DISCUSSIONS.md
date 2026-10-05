# Curated text discussions

Students save unlimited private question drafts to their account. Saving is explicit; unfinished writing is retained locally during network failures. Drafts are never returned to teachers, peers, or parents. Students compare their saved drafts and explicitly publish up to three questions per text/class pair. Hidden questions count toward that limit. Existing students above the limit retain all threads, editing and unlimited replies.

Withdrawn unanswered questions are preserved internally and omitted from the class feed. Their votes remain associated with the original question. Any reply, including a hidden reply, permanently prevents replacement. Students can still edit wording. Selecting a passage in the parallel reader retains its exact quotation and paragraph reference until a reply is chosen; inserting it preserves existing writing and quotations.

Teachers can select a roster, preview randomized assignments, shuffle and publish a round. Augmenting-path matching maximizes distinct coverage while excluding self-answers. Unanswered questions rank before answered questions, then by upvotes. Spare students are distributed across eligible top questions. No eligible question is shown as a gap. A direct reply completes a pending assignment. Withdrawal cancels its pending assignments; filling a round's gaps preserves completed and pending work. A student leaving the roster is flagged in teacher progress. Replies elsewhere remain available.

## Server storage and atomicity

- `reading_question_drafts`: server-only account/workspace notebook, with draft-version checks and publication tombstones for idempotent retries.
- `reading_question_state`: server-only shared workspace transaction guard. Every mutation stages a guard write before reading quota, posts, drafts or rounds. A conflicting commit retries from fresh state. Publication quota is derived from preserved active question records, so legacy questions and teacher moderation are counted correctly.
- `reading_reply_rounds`: server-only roster allocations, completion and cancellation status. Students receive only their own assignments.

Post creation, quota validation, notebook publication, withdrawal and assignment updates commit atomically. Existing direct-post clients are also subject to the three-question limit. Every reply marks the root as permanently replied-to within the same transaction. Edits, moderation and voting use the same guard to prevent stale writes reviving withdrawn questions or losing reply state. Browser permissions on the collections are empty and document permissions are disabled.

## Rollout and verification

Deploy private schema and backend before the interface:

1. Probe `Databases.createTransaction` on the actual deployment.
2. Run `node --env-file=PATH scripts/setup-appwrite.mjs reading_question_state reading_question_drafts reading_reply_rounds`.
3. Run `node --env-file=PATH scripts/check-curated-discussions.mjs`. It verifies server-only permissions and actual conflicting commits using a temporary guard document.
4. Run `node --env-file=PATH scripts/deploy-appwrite-functions.mjs learning-content`; verify the deployment reaches `ready`.
5. Run `node --env-file=PATH scripts/smoke-curated-discussions.mjs --run`. It creates isolated synthetic teacher/student/peer accounts and a synthetic class/text, verifies authenticated endpoints and concurrent publishing, then removes only its own fixtures. It never reads real student submissions.
6. Push the tested frontend to `master`, let GitHub Pages complete, and check the live teacher controls.

Credentials are not committed. The interface uses `curatedReady` from the deployed backend and retains compatibility with older discussion responses.

On 2026-10-05, deployed document transaction support and real conflict rejection were verified. Live synthetic account verification passed for notebook privacy and cross-device recovery, publication quota and retries, replacement/vote isolation, matching/self-answer gaps, reply completion, exact quotation preservation, multi-round coverage and concurrent publishing.
