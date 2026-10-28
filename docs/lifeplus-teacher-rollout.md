# Lifeplus teacher rollout

Teacher registration creates individual credentials. The invitation upgrades the existing server profile without replacing accounts or work. Only the verified owner account can rotate/disable invitations and manage AI allowances. Invitation hashes, preferences, character libraries, allowances, reservations, and planner records are stored in the server-only `teacher_workspace` collection. No invitation or provider key belongs in frontend configuration.

Legacy browser database calls now pass through `scopedData`. The server derives class/deck scopes from the signed-in identity. Other content uses its dedicated authorization checks. All main-database collections must have empty browser permissions and document security disabled; the backend services remain the access boundary. File buckets have no broad read grants. Existing explicitly enabled public reading/episode shares continue through the separate public-reading function.

## Operational sequence

1. Run `setup-teacher-workspace.mjs` with the initial invitation and existing presentation folder supplied through a private environment. It verifies the existing classes' common owner and records that account ID in the function environment. Existing preferences and invitation configuration are preserved on reruns.
2. Run `secure-teacher-isolation.mjs` without `--apply` for a private backup of affected records and access rules.
3. Run `migrate-private-episodes.mjs` and `migrate-private-media.mjs`. They back up original bytes, upload content-addressed private copies, verify them, and install delivery manifests. Assignments and attempt/version identifiers are unchanged.
4. Deploy `learning-content`, `public-reading`, and the retired `writing-ai-feedback` function. Confirm deployment activation.
5. Run the tests, TypeScript check, story checks and production build. Publish the frontend. Then run `secure-teacher-isolation.mjs --apply` to close legacy browser access, and `verify-lifeplus-accounts.mjs --locked` to test the deployed boundary with disposable accounts.

Private backups are under `~/.config/learningisfun/backups/` with restricted file permissions. Deployment credentials remain outside this repository. The verifier removes its temporary users and records in a finally block. It tests AI concurrency using a fake provider with real Appwrite transactions; it makes no paid generation call.

## AI accounting

The server supports only episode drafts, flashcards, quizzes, and reading adaptations. New teachers receive $1 per Shanghai calendar month. Provider routing restricts GPT-4o-mini to the approved providers and maximum prices, with bounded input/output and no automatic paid retry. A per-owner transaction guard serializes allowance reservations before provider requests. Verified actual cost replaces the reservation. Missing or uncertain outcomes keep their reservation. The administrator's reconciliation control queries known provider generation IDs; requests with no verifiable generation ID stay reserved. Changing an allowance does not erase recorded usage.

Price references: https://openrouter.ai/openai/gpt-4o-mini and https://openrouter.ai/docs/guides/routing/provider-selection . Reconciliation uses https://openrouter.ai/docs/api/api-reference/generations/get-request-&-usage-metadata-for-a-generation . Provider price caps fail closed if eligible routing is unavailable.

## Planner and episode compatibility

David's existing planner implementation and stored plan model are unchanged. Other teachers receive a separate schema-version-1 planner. Calendar, subject, timetable, resource and lesson snapshots are saved separately, with immutable revision references. Completed lessons cannot be replaced. Resource placement creates a copy and does not publish; publishing selects only student-facing resources and uses stable assignment identifiers. Annual prompt export/import makes no paid AI calls and includes no student records.

New episodes use the existing Story 2 renderer. A missing assessment mode retains the legacy four-question quiz. `assessmentMode: "none"` records completion without a numeric knowledge score. New source-based AI drafts require the teacher's source-review acknowledgement before publication. Custom characters are embedded in immutable published package versions. No generated image, audio or video service is included. Approved taxi clips are optional for new Didi templates.

The current website build excludes private classroom packages and episode-specific media. Authenticated delivery supplies existing legacy playback and signed media URLs. Existing static preview links now use owner-authorized delivery, with the original JSON and ZIP bytes backed up privately. Public editions and shared character/taxi assets remain. Already downloaded files, previous public hosting and Git history cannot be retracted by this release. Expired media URLs require reopening online; text and choices remain usable offline from the signed-in account's cache.

Family-contact records and historical writing feedback remain stored privately. Their retired UI/endpoints cannot generate new feedback. Dangerous Writing, manual Error Logs, classroom writing discussions and teacher review remain.

## Release verification

The release passes 191 Vitest files (990 tests), the Stone and 46 episode checks, TypeScript, and the production build. New files pass targeted lint; the repository-wide lint command retains existing unrelated failures. Separate disposable teacher/student accounts verify invitation promotion, rate limits, private settings, class ownership, shared enrollment, isolated planner records, publication retries and AI reservations. The final locked-mode check also rejects direct database reads and forged profile-role updates. No paid AI or media call is required by these checks.
