# TQE implementation and rollout

TQE is the default for texts without an explicit annotation mode. The owner can choose Regular annotations in the reading view. Existing annotations are retained and remain untyped until their authors edit them; they are not inferred to be Thoughts or Epiphanies. Regular mode keeps the three-annotation unlock. TQE requires one visible, shared, original annotation of each type.

The reading view contains paragraph density, type filters, one Bring it nomination per reader/class, ranked group choices, private teacher nudges, a tabled discussion board, private participation choices, spoken T/Q/E evidence, and exit reflections. Board edits preserve the original student annotation. Selecting a class section isolates that section's records.

## Deployment order

1. Provision `texts.annotationMode`, `texts.tqeStage`, `text_annotations.tqeType`, and the private `tqe_records` collection using the updated setup script in the intended environment. The setup script accepts collection IDs to limit the pass.
2. Wait for new attributes and indexes to become available.
3. Deploy the updated learning-content function including its `tqe.js` module.
4. Publish the frontend only after backend verification with separate teacher/student accounts.

Do not publish only the frontend: older functions cannot process the new operations. The database additions were provisioned on September 9, 2026 and backend deployment `6aa102b8d5ad98686440` was submitted. Frontend publication is a separate step.

## Verification and current boundaries

- Run `npm test` and `npm run build`. Backend authorization tests are included in the normal test suite.
- With two separate browser accounts, verify the third distinct TQE unlock, nomination replacement, group access, nudge privacy, and switching class sections. Check a regular text too.
- Annotations retain the existing offline queue. Classroom selections/nudges/participation require a server connection; failed actions show an error and can be retried.
- Refresh TQE retrieves newly synchronized annotations and group choices. There is no rapid background polling.
- Teachers can select Thought only or full TQE in Annotation style. Thought only requires one visible shared Thought and hides the group-selection step. Switching to full TQE preserves the Thought but requires a Question and Epiphany to unlock peers. No automatic stage progression occurs. T+Q stages, fortnight-wide participation reports, and the printable wall poster are not included in this release.
- Eight-slot planning and the other classroom routines from the companion reference are outside this change.
