# Planning: units, lessons and scheduled releases

The teacher navigation opens `/planning`. The existing `/planner` weekly form and its saved records remain available. Units are private, teacher-owned records. The CSV import preserves `front`, `back`, course, unit, week, kind and tier. Identical terms in different courses remain distinct. Importing a planning brief adds draft presentation/copywork briefs, never executes the instructions contained in the file, and never rewrites the imported core vocabulary.

## Import and approval

Import the annual calendar on the Weeks page first. Import the core and reference CSVs, followed by the planning brief, on Units. Alternatively use `scripts/prepare-planning-import.mjs` to generate a private `.local` review package; this is ignored by git. Class mappings are prefilled from the annual source. Review them, approve vocabulary schedules, then save all units. Copywork needs a passage or URL, week, due date, and explicit approval. Core decks are cumulative per teacher/course/school year; WL Blue/Red share the underlying decks. Student review states remain individual.

Core/supporting vocabulary releases on the preceding Friday at 17:00 Asia/Shanghai. Reference vocabulary releases at 00:00 Asia/Shanghai on the unit start date. Approved copywork follows the Friday schedule; overdue copywork approval publishes immediately. Unreleased vocabulary exists only inside private units and release jobs, never in student flashcard collections or exports. Release cards use stable source identifiers, so retries are idempotent and never create synthetic review events.

## Backend rollout

1. Provision `planning_units`, `planning_releases`, and `planning_materials` using `scripts/setup-appwrite.mjs`. They must have no browser permissions. Wait for indexes/attributes to be available.
2. Deploy `learning-content` and `planning-release` using `scripts/deploy-appwrite-functions.mjs learning-content planning-release`.
3. Verify `planning-release` has no user execution permissions and uses entrypoint `src/release.js`, with schedule `*/15 * * * *` (UTC). This includes Friday 09:00 UTC / 17:00 China and each China midnight. The trigger is rejected unless Appwrite identifies it as a scheduled execution.
4. Import teacher data and review class mappings before enabling any vocabulary schedule. Test with a separate class first, including before/after the release boundary, a late copywork approval, and repeated execution.
5. Deploy the frontend only after the backend is ready. It uses the authorized `readPlanningMaterials` endpoint to synchronize released decks and display assigned copywork.

This change does not deploy itself or change the school's pause on student use. Production activation is a separate operation.

## Existing deck consolidation

Save the units first, then choose **Combine existing class decks**. Review the counts before applying. Known core terms and general supporting knowledge move into Core; known reference-list terms and cards tagged NAME or REFERENCE move into Reference unless they also match Core. Card IDs remain unchanged, and deck references in student states/review records are updated. Eligible source decks are archived, not deleted. Decks belonging to someone else or assigned outside the mapped sections are skipped. Large migrations can be retried after interruption; already moved cards retain their IDs. Keep a database backup before a production migration. Historical study-session records remain attached to their original deck for audit purposes.

## Weekly work

Each lesson is initialized once with due work, dated resources, legacy selected presentations and source activities. Eight slots are shown; excess items go into overflow. Unit edits do not silently replace manual lesson edits. The teacher can add items from the bank, move/reorder, copy to another lesson, unplace, edit text/minutes, mark reserve activities and record completion. The weekly JSON stores a unit snapshot for later printing and lesson review.

Copywork assignments are shared references, displayed in the class and the student's Copywork book by week. They do not create completed student entries. The existing personal copywork collection remains separate.
