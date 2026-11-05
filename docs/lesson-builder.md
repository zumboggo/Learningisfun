# Teacher lesson builder

Teachers enter through Lessons → Create lesson, opening a new planning conversation directly. The library separates Assigned and Drafts, with title search, class filtering, and direct preview/progress actions. The builder uses a chat-led layout beside a compact editable plan; source and final-task details expand on demand. Four numbered steps group planning, editing, review/preview, and assignment. Drafts and planning conversations are private and autosaved. Planning chat updates the brief; Create draft generates content only after a teacher clicks it. Manual authoring remains available without AI. The chat can also revise one selected stage. A teacher reviews the five instructional moves, previews the actual practice player locally, then assigns an immutable version to one or more of their own active classes.

Images are optional JPEG/PNG/WebP uploads, up to 10 MB and 40 megapixels. The browser scales to 1,800 pixels before transport; the backend independently decodes, strips metadata, scales, and writes WebP into the existing private `original-pdfs` bucket. Image access uses short-lived file tokens issued only after teacher ownership or assigned-student access checks. No image generation provider is called.

## Backend records and operations

All records use the existing server-only `teacher_workspace` collection and teacher ownership. `lesson-draft:<id>` holds the editable brief, conversation, lesson, review and reviewed flag with optimistic revisions. `lesson-version:<id>` holds an immutable content snapshot and teaching review. `lesson-assignment:<version>:<class>` points at a version and carries Shanghai release/due dates. Version identifiers hash the owner, draft ID and lesson content; assigning the same version to the same class is idempotent and preserves its original dates. Revised content creates a separate version and progress key. Old assignments and progress remain intact.

`lessonBuilderLibrary`, `lessonReadBuilderDraft`, `lessonSaveBuilderDraft`, `lessonChat`, `lessonGenerate`, `lessonRefineStage`, `lessonPreview`, `lessonAssign`, `lessonUploadImage`, and `lessonReadImage` are teacher-only learning-content operations. AI operations require a unique request ID and use the existing allowance ledger without automatic paid retries. Server validation gates preview and assignment; assignment additionally requires the teacher's instructional review. All draft edits clear the review in the editor.

Existing `lessonLibrary`, `lessonRead`, practice, final-feedback and reporting operations resolve both the deployed catalog and teacher-owned assignments. Student projections omit answer keys and private rubric guidance. Teacher `lessonRead` includes a preview definition, and teacher attempt mutations are rejected. The frontend preview exercises gates locally and disables final feedback and saving.

## Verification and deployment

`npm test` includes UI authoring tests and `lesson-authoring-checks.mjs` for privacy, conflicts, snapshots, release gates, preview isolation, image decoding and AI failure/allowance behavior. Provider responses are mocked; no paid AI or real student work is used. `npm run build` checks TypeScript and production output.

Deploy `learning-content` with `node scripts/deploy-episode-backend.mjs` before publishing the frontend. The function package includes Sharp for server-side image decoding; the root development dependency makes its tests available in CI. `node scripts/verify-lesson-builder.mjs` uses the existing private deployment environment to verify authenticated library access and private upload storage without writing drafts or reading student work. Existing catalog smoke checks remain in `scripts/verify-lessons.mjs`.
