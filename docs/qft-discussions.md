# QFT discussions

From a class, choose Discussion → QFT (Question Formulation Technique). Add a title/statement, optional image (PNG/JPEG/WebP/GIF, up to 5 MB), and optional model paragraph.

New discussions default to teacher-only question capture and replies, anonymous student replies, five votes per student, and multiple votes per question. Question author identities are never recorded. Teacher replies always say “Teacher”; the student reply anonymity setting applies to existing replies as well as new ones.

Enter captures a question verbatim; Shift+Enter inserts a newline. Teachers can correct wording. Questions remain in arrival order. Open voting / Close voting controls only voting, not question or reply entry. Students can add or remove allocations while voting is open. Aggregate totals appear only after closing voting (including for teachers). Reopening hides totals again and preserves allocations.

Changing the vote allowance or stacking rule cannot invalidate existing ballots: the server rejects that change with an explanation. Students can withdraw votes while voting is open before the teacher retries.

The server stores QFT state in the existing server-only teacher_workspace collection, keyed by session, with transaction guards for mutations. The class_sessions record contains only the title and a version marker, which the scoped gateway exposes to enrolled students for routing. Legacy QFT records retain their original screen. No schema migration is needed.

Checks: qft.test.mjs covers authorization, no question identity storage, reply naming, closed voting, late entry, stacking, allocation changes, and concurrent budget enforcement. qft-ui.test.tsx covers creation defaults, Enter capture, continued entry during voting, and student controls. scripts/smoke-qft.mjs --run verifies deployed behavior with temporary accounts and cleans up its own fixtures.

Students and teachers can classify any question using C (closed) or O (open), even during oral capture or when voting is closed. The selected button has a dark background. Selecting it again clears the classification; choosing the other button switches it. Classification is shared across the class and records no identifying information. Existing questions start unclassified.
