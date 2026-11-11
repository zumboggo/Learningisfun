# Teacher defaults and private vocabulary

Teacher settings store age range, audience notes and optional reading word target in the private teacher workspace. Class overrides are owner-checked. New drafts inherit the selected class settings, then teacher settings. Existing drafts are not modified; applying another class's defaults requires an explicit action. A missing audience prompts the teacher to specify it. The reading length range remains 100–4,000 words.

Schedule vocabulary is available in the teacher's class view. CSV uses Term, Definition, and optional Example; quoted commas and multiline cells are supported. Teachers preview every row and release date before activation. Batches retain CSV order, skip selected teaching weeks, and release at 08:00 China time on the preceding Friday. Past dates are explicitly labelled Due now. The scheduler runs every 15 minutes. Pausing preserves released cards. Released batches cannot be edited; future card text and skipped weeks can be changed. Once releases have begun, a new list is needed to change the pace or replace the CSV.

Each schedule has a distinct teacher/class/list deck identity. Each weekly release is transactional with the owner's workspace guard, so edits, pauses, retries and releases cannot overwrite each other. Only released cards enter student-accessible collections. Failed releases roll back, display an error in the teacher's schedule list, and retry on the next run. No AI service is used for importing or scheduling vocabulary.

The text creator offers only the current teacher's vocabulary lists, with optional week selection. `migrate-private-vocabulary.mjs` imports the verified owner's three legacy reference lists idempotently, without changing cards or jobs. These imported references are read-only; teachers create editable schedules using CSV. Existing owner drafts with the previous course names remain supported.

Deployment uses the existing teacher_workspace schema and planning-release schedule. Deploy learning-content and planning-release using deployEpisodeBackend, run the migration, then publish the frontend. No new database permissions or student visibility grants are needed. Existing Friday reading releases, Ethics-specific features and rhetorical-analysis eligibility are unchanged.

Assigned-readings export is available from both planners and includes self-contained Canvas instructions. It does not call Canvas or publish anything itself.
