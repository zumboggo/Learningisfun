# Ethics presentation prompt builder

The Ethics class page shows **Build my presentation prompt** immediately below its banner. Five steps collect the interesting ethical question, useful tool, central situation, practice activity, and voice. The question menu is expandable; voice supports multiple selections and two custom entries.

The tool, situation, and activity steps can request three contextual AI suggestions. Nothing is selected automatically. Selecting a suggestion requires the student's own “This could help because…” explanation. This is scaffolding, not a grading penalty. Editing earlier choices preserves later answers but flags them for review. Draft choices are saved on this browser per user and class; storage failures are shown. The final editable prompt can be copied or downloaded as UTF-8 text without an AI call.

Suggestions use the authenticated learning-content function, class membership/ownership checks, and existing teacher-funded AI limits. Parent accounts, nonmembers, and other teachers cannot request suggestions. Provider errors leave manual entry available. Student content is supplied as data; the AI is instructed not to write connections, reflections, or choice justifications.

## Assignment wording alignment

Retain the **current-unit** requirement and the existing ten-point rubric. No automatic deduction for asking for suggestions. Use **Class Connection** consistently as the slide title (including check 7 of the assignment rubric). Replace the old paragraph describing AI-generated prompts on the slide with:

> The builder creates a slide titled “Class Connection”. Its only body text is centered: “Students fill in how this connects to the class here”. Its speaker notes are empty. Replace the placeholder and write its explanation yourselves, in your own words without AI-generated wording. Name a specific Episode moment, assigned passage, or class discussion from our current unit; explain the relevant idea and how it connects to your lesson. Recent material is encouraged. You may consult class materials.

The prompt and final checklist reflect the supplied November 12, 2026 presentation and November 13, 2026, 11:59 p.m. China-time submission. It plans nine minutes plus a one-minute buffer within the hard ten-minute rotation. Update these dates before reusing for another assignment. This implementation does not edit the external Canvas assignment.

## Checks

- `npx vitest run src/test/ethics-presentation.test.tsx`
- `node --test functions/learning-content/src/ethics-presentation-checks.mjs`
- `npm run build`

Deploy `learning-content` with `scripts/deploy-episode-backend.mjs` before publishing the frontend.
