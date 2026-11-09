# Personal AI billing and character design

Teachers connect OpenRouter and Replicate independently in Settings → AI & billing. Connected credentials take priority for that provider; missing connections use the teacher's included allowance (default $1/month, Shanghai calendar). A failed personal request never falls back to shared funds. Personal usage has no app monthly subsidy cap; rate limits and provider balances still apply.

## Ownership and privacy

Authoring charges the authenticated teacher. Lesson feedback charges the assigned class's teacher; reading adaptation charges the original reading owner. These owners are determined by existing backend authorization, never a client-provided billing owner. Existing EAL versions are reused. The retired standalone Writing feedback endpoint stays retired.

Lesson requests contain the rubric, task/source, response, and relevant previous attempt, without adding student names or account IDs. Teachers can still include identifying information in supplied prose; the app does not claim to anonymize arbitrary writing.

Credentials use AES-256-GCM, random IVs, and owner/provider/version authenticated context. Only encrypted values are stored in server-only `teacher_workspace`; client responses contain status, revision and four-character suffix only. Secrets are not copied to drafts, student responses, exports, or browser storage. Key validation is a non-generating provider account/key request. Replacement validates before changing the active connection. Older encrypted versions remain available for existing jobs until disconnect; disconnect revokes all versions. After 30 replacements, disconnect before adding another key.

Run `node scripts/configure-personal-ai.mjs` once before backend deployment. This verifies server-only workspace permissions, provisions `AI_CREDENTIAL_ENCRYPTION_KEY` as a secret function variable, and saves a mode-600 backup outside the repo. Never overwrite an existing encryption variable: losing it makes saved connections unreadable. Recover the existing key from the protected backup; rotation requires re-encryption of every stored envelope.

## API and accounting

Teacher-only actions: `readAIConnections`, `connectAIProvider` (provider, token, revision), `validateAIProvider` (provider, revision), `disconnectAIProvider` (provider, revision), `saveAIImageSettings` (ceiling), `readImageModels`, and `generateCharacterRecipes` (description, optional story/cast, existing IDs, requestId).

Provider connections have optimistic revisions. Request reservations atomically check connection identity, duplicate ID, rate limit, and shared allowance before network submission. Each job records its billing source and credential version. Separate personal ledgers track recorded costs and unconfirmed reservations. OpenRouter actual usage settles reservations; fixed-price successful image jobs settle once. Known rejected submissions release reservations; uncertain/failed provider jobs remain reserved pending reconciliation. No paid retries occur automatically. Existing shared ledgers and legacy jobs remain readable.

Images accept `modelId` and `expectedBilling`; old clients default to Schnell. A stale billing-source quote is rejected. Both text and episode controls use the same backend catalog. Image jobs pin model, input settings, original account and credential. Replacement does not change polling credentials or submit again; disconnect may prevent retrieving unfinished images, and the UI explains this before disconnecting.

## Verified image catalog

Official prices checked 2026-11-09 at https://replicate.com/pricing:

| UI tier | Replicate model | One output |
| --- | --- | --- |
| Economy | black-forest-labs/flux-schnell | $0.003 |
| Standard | black-forest-labs/flux-dev | $0.025 |
| High quality | black-forest-labs/flux-1.1-pro | $0.040 |

Input schemas: https://replicate.com/black-forest-labs/flux-schnell/api/schema, https://replicate.com/black-forest-labs/flux-dev/api/schema, https://replicate.com/black-forest-labs/flux-1.1-pro/api/schema. Pro returns a URI; Dev/Schnell return URI arrays. All use one WebP, 16:9. Schnell uses 1 MP/four steps; Dev uses 1 MP/28 steps and guidance 3; Pro uses its native inference settings with safety tolerance 2 and prompt upsampling disabled. No arbitrary provider URLs or model IDs accepted.

Pricing expires 2026-12-09; generation is disabled until the catalog is reverified. Polling existing jobs and uploads remain available. Shared funds retain a $0.01 cap. Personal accounts initially retain a $0.01 ceiling; teachers can explicitly save a ceiling from $0.003 to $1/request. Every new/regenerated image shows its cost and account. Four Pro images cost $0.16, in four individually bounded requests.

## AI characters

The existing character editor adds description and story-cast proposals. OpenRouter chooses only validated shared parts and six-digit colours. Unsupported appearance needs are explained; arbitrary code, media URLs and rigs are discarded. Up to four proposals are previewed as animated SVG puppets. Teachers select a proposal, edit and approve it before adding; existing IDs are rejected. Personal-library saving remains the existing explicit action. No image-to-rig conversion is attempted.

## Verification

`npm test` includes encrypted credential/billing/image/character backend checks and settings/model/character UI tests. `npm run build` checks types, existing stories, and production assets. Live verification uses disposable accounts and synthetic invalid tokens for rejection and isolation checks, with no paid generations. Provider success, image completion and character generation are mocked in automated tests; this does not establish real-provider output quality.
