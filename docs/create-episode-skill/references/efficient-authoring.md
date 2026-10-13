# Efficient authoring

Use the shipped unassigned demonstration or a saved package; replace story/quiz rather than adding episode-specific app code. Reuse appropriate assets. Read real sources, outline the Story Circle and motives, choose four learning targets, then write short playable beats.

Use node scripts/story-package.mjs check PACKAGE.json, zip PACKAGE.json OUTPUT.zip, and publish PACKAGE.json. Publishing uses existing teacher credentials through the same authenticated API as the app. Only assign authorized class/date IDs. See story-format.md for environment names and package structure.

Review contrasting emotional routes, sources, quiz explanations, accessibility and resume. Keep all assets below 5 MB. No mandatory new soundtrack or full cast. New content needs no application deployment. Changes to infrastructure follow repository publishing checks.

Before writing dialogue, consult acting-library.md. Prefer automatic emotion-based acting; avoid a gesture on every line. Wide establishes location, medium carries conversation, close emphasizes a personal revelation. Reset to wide/auto when the scene changes focus. Validate against the shared parser, not a separate hand-maintained cue list. Canonical source is functions/learning-content/src/acting-library.js; node scripts/build-lin-rig.mjs refreshes the repository reference and Lin pack.

Apply the three narrative-craft passes within that same workflow: check the opening promise while outlining, map choice responses and planned callbacks before branching, then trim the draft and compare contrasting routes. Keep the plan compact; do not add mandatory artwork, new mechanics, or extra approval steps.
