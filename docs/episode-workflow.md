# Reusable episode authoring

World Literature episodes are content on the existing Question Journal engine. Preserve canonical events; vary conversations and the student's account. Default to one to three commitments, optional curiosity, warm comedy with room for uncertainty, four notebook domains, and exactly four return questions (three correct). Reflection is separate, optional, editable writing below the player; it never gates completion or earns points. The existing AP writing assessment is unchanged.

Reuse the unit's artwork and default-off music. No fresh soundtrack, fixed cast size, expression quota, or author-appearance quota is required. A new character or setting warrants new art when it improves the encounter. Every new compiled story plus all assets, including optional audio, must be **strictly below 1,000,000 bytes**. Shared caching is a repeat-visit benefit, not an exemption from the first-download budget.

## Start from verified facts

`stories/episode-units.json` holds verified app section IDs (Canvas IDs are references only), edition/fallback, reading boundary, concepts, and shared assets. Recheck facts that changed; do not rediscover settled IDs for each story. These records do not claim a current classroom translation or weekly vocabulary has been verified. Keep unit concepts separate from the assigned weekly list.

`stories/episode-assignments.json` places a content ID/version into each section. Omit `releaseAt` for the usual preceding-Friday rule; supply an explicit UTC timestamp for an authorized exception. Keep one current version per story/section; archive earlier assignments without deleting them or changing their rules.

## Author and build

`npm run episode:new -- --id my-story --unit world-literature-quixote --title "My Story"` creates an unassigned draft in `stories/drafts/`. The scaffold is not publishable. Read the actual source, replace all `AUTHOR:` fields, set `draft:false`, and rename to `.episode.json`. Use a new unit record for a new text/setting rather than borrowing Quixote's facts. Add only the requested section assignments.

`npm run episode:build` discovers `.episode.json` sources outside templates, validates them, generates Twee/HTML, versioned server content, client build hashes, and the assignment catalog. It uses Tweego 2.1.1 with the vendored SugarCube 2.37.3. Compiler resolution: `TWEEGO`, `~/.local/bin/tweego`, then PATH. `npm run episode:check` verifies generated files and budgets without compiling. Version 1 Quixote files are frozen and hash-checked.

For every episode: verify excerpts, learning evidence, two defensible interpretations per checkpoint, a plausible weak interpretation, and a satisfying ending. Automated checks handle legal route/scoring combinations. Human playthroughs cover contrasting reasoning and emotional paths, desktop/phone presentation, optional conversations, and writing placement. Change player infrastructure only when the learning needs it.

## Publish

Commit task changes first, preserving unrelated work. Run `npm run episode:publish` with the authorized Appwrite environment loaded (for example `node --env-file=/path/to/existing/.env.setup.local scripts/publish-episodes.mjs`). It requires a clean checkout, integrates production, runs tests/build, deploys changed learning-content backend code without replacing function settings/variables, confirms activation, pushes `HEAD:master` without force, waits for Pages, and verifies public story/media hashes and the production catalog. No Canvas or grading operations are included.

`npm run episode:publish -- --check` runs checks and reports the publication plan without network mutations. `--check --verified` only reports the plan after separately completed checks. Local ignored acknowledgements avoid repeating a confirmed backend deployment on a retry. If build status is uncertain, inspect the returned deployment ID before trying again.

For persistent git transport failure, `python3 scripts/push-production-fallback.py` is an explicit fallback using the existing credential helper. It verifies exact local blob/tree/commit hashes and performs a non-forced fast-forward ref update; it stops if production moved. Then inspect the existing Pages run and run `npm run episode:verify`. Never print or store credentials.

Static deployment verification does not establish authenticated saves. Validate backend class/release access and independent writing operations with automated tests and authorized live reads. No student work should be read for deployment checks.
