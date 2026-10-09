# The Teaching Stone

Episode 1, **The Grain We Keep**, is a real Twine/SugarCube story embedded in the Ethics class. It uses class ID `e24ec8d9-21d7-4c32-a30e-08655c2f4e65`, verified in the signed-in production class page. The frontend link is class-scoped; the backend checks class ID, student membership or class ownership, and role on every request.

## Authoring and building

- Narrative and choice copy: `stories/teaching-stone/episode.json`.
- Readable, importable Twine source: `stories/teaching-stone/episode.twee` (generated and checked in).
- Presentation and bridge: `stories/teaching-stone/story.js` and `story.css`.
- Shared rules: `functions/learning-content/src/stone-engine.js`; the same deterministic implementation is embedded in Twine and used to validate server submissions.
- Compiler: official Tweego **2.1.1**. Download the appropriate platform archive from https://github.com/tmedwards/tweego/releases/tag/v2.1.1 and set `TWEEGO` to the executable path.
- Story format: SugarCube **2.37.3**, vendored with its license under `vendor/twine/sugarcube-2` from https://github.com/tmedwards/sugarcube-2/releases/tag/v2.37.3.
- Rebuild: `TWEEGO=/path/to/tweego npm run story:build`. The production build runs `story:check` to reject stale source or compiled HTML. CI needs no compiler download because the verified HTML is committed.
- Never modify an already released episode version’s rules after students begin ranked play. Publish a new version/asset directory and keep the older validator for older attempts.

## Saved progress and ranking

The parent React route owns account access and a separate, user-scoped Dexie database. The iframe receives only choices and a per-load message channel. Its bridge checks source window, origin, protocol, channel, and message type. No credentials enter the story. A standalone HTML preview is public; account saves and class results are protected.

`readStone` returns the caller’s own attempts, teacher-preview status, and class-only rankings. `saveStone` accepts episode/version, attempt ID, revision and choices. The server derives state, completion and score; ignores client totals; and saves immutable prefixes with deterministic IDs. Divergent histories collide at the first different decision and the client preserves a separate attempt. Retries cannot duplicate scores, and stale snapshots cannot erase a newer revision.

The `stone_attempts` collection has **no browser permissions**. Fields: classId, userId, attemptId, revision, dataJson. The regular setup script can provision it; alternatively the owning teacher’s first `readStone` provisions missing storage using the function’s existing server credentials. No new key or expanded browser access is needed.

Each student’s best completion for this episode version appears on the board. Equal scores share a rank. Only names with the existing app’s `visible` or `reset` nickname moderation status are shown; other learners receive a pseudonym. Teacher previews never submit scores. First completions and replays remain separate private records.

The rubric is an explicit teaching model, not a universal measure of virtue. It allocates 25 points each to needs/dignity, resilience, cooperation, and understanding; the ending explains who benefited and who bore costs. Material and social conditions are not interchangeable with moral worth. Read-time and speed do not affect rank.

## Art and offline behavior

Seven WebP assets (one background, four character sprites, two alternate expressions) were generated using the built-in imagegen tool. Prompt specifications are saved in `stories/teaching-stone/art-prompts.json`. Production art is in `public/stories/teaching-stone/v1/`. Source generation originals remain in Codex’s generated-images directory. WebP compression preserves transparency.

The episode is excluded from app-wide precaching. Opening it caches only this episode’s HTML and art. A missing image removes the decorative portrait; text and choices remain usable. The app shell supports installed-PWA/offline operation. An offline student save remains visibly pending until the authenticated backend accepts it. Storage clearing or private browsing can erase unsynchronized local work.

## Verification

`npm test` runs frontend tests and the Node story/backend tests. Tests cover all legal choice sequences, multiple defensible strategies, resource bounds, server-derived scores, retry idempotency, divergent devices, class/role restrictions, teacher preview, replay isolation and bridge validation. Browser QA covers desktop and 390-pixel layouts, all passages, assessment and both stone actions. Production smoke tests must verify the owning teacher can open the protected class route after backend deployment.

## Class-reading alignment

The supplied Ethics Before Us site is privately published. Its owner-local source (`ancient-ethics-reading-site/dist/index.html`, published source commit `4488e0eb2fd143f3e5edb94e9be01145fb56a6be`) was read without signing in or sharing profile information with the site.

Episode 1 highlights **authority, custom, reasons, consequences, impartiality, corroboration, dignity, duty, and accountability**, applying them through listening, rationing, investigation, promises and public records. The four-lens decision checks conceptual use directly. Ma’at provides the Egyptian context; modern analytical language is explicitly framed as the protagonist’s classroom knowledge.

Reserve **stele, legitimate, retribution, restitution, proportionality, human rights, deception, information asymmetry, risk, deterrence, commission, omission, petitioner, gleaning, entitlement, and moral imagination** for later focused episodes; some are already implicitly experienced here. Do not present Babylonian laws, later funerary texts, or Hebrew prescriptions as the rules of this Middle Kingdom village.
