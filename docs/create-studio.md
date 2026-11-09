# Teacher Create studio

Teachers enter Create → Text, Episode, or Lesson. The libraries keep their existing readers, players and progress. `/game/create?draft=…` redirects to `/create/episode?draft=…`. Each type has separate draft IDs and conversations. Format switching saves the active draft first and stops on failure. Resume draft searches all three libraries.

Text defaults to 1,000–1,200 prose words (short 600–800; extended 1,500–1,800; custom 100–4,000). Settings and planning chat never rewrite prose; generation and revision are explicit. Four illustrations are planned by default; image submission is a separate priced action. Manual imports retain their length. Original PDFs and inline uploaded images retain the existing private storage flow.

## Backend

`text-authoring.js` handles teacher-only drafts, chat, research, writing, image jobs and publication. Drafts use `text-draft:<id>` in `teacher_workspace`, optimistic revisions and ownership. Research is server-owned and reused when topic/source/historical mode match. Publication creates a content-addressed text snapshot and ordered paragraphs atomically through the existing text schema; existing assignments and annotated versions are preserved. No classroom assignment occurs until the teacher chooses it.

The deployed `text-guidance` directory contains snapshots of David's Create LIF Text skill, historical reference and vocabulary, with a version and source hash. App overrides set the shorter default and FLUX provider. Updating the local skill does not silently change deployed behavior: copy reviewed resources, update version/hash, run checks, and deploy. Vocabulary matches the selected course and explicit week only.

Research uses OpenRouter web search with Exa fast, at most two searches/three results each, retaining provider citation URLs. Up to six HTTPS source pages are retrieved with public-IP validation, pinned DNS, bounded redirects/bytes and timeouts. Only retrieved passages and teacher excerpts are writing evidence. Search notes alone cannot establish a claim. Research reserves an additional $0.15 from the existing allowance, then settles actual provider usage. This reservation is separate from image costs. Unavailable evidence and questionable quotations are surfaced for review, not silently treated as verified. The teacher remains responsible for reviewing factual and visual accuracy.

Images use the existing Replicate FLUX Schnell adapter, one 1MP WebP output, four steps, safety checker enabled. Fixed price $0.003/image, verified against https://replicate.com/pricing on 2026-11-09. Text generation enforces a $0.01 image-request ceiling. The rate verification expires 2026-12-09; refresh it only after checking exact provider pricing. Expiration disables paid generation while uploads remain available. Request IDs, provider IDs, cost and pending state are retained; polling/import can resume without another paid submission. Unknown submission outcomes are not automatically retried. Successful files are copied into private reading storage immediately on collection. Keep API keys server-side.

No new collections or schema migration are required. Deploy `learning-content` before the frontend with `node scripts/deploy-episode-backend.mjs`. The local Codex skill is unchanged.

## Verification

`npm test` includes backend text checks and UI tests for length changes, local recovery, manual editing and resume navigation. Existing episode/lesson checks cover publication, progress and previews. `npm run build` runs story checks, TypeScript and production bundling. Provider calls are mocked in tests; do not automatically submit paid validation generations. Use `node scripts/verify-create-studio.mjs` for read-only production checks.
