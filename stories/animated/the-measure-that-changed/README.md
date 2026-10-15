# The Measure That Changed

Unassigned Ethics episode, approximately 10–12 minutes plus the quiz. Six choices, 96 legal routes; no morality score. Preview: `#/game/story-preview/the-measure-that-changed`. Importable package: `public/stories/animated/the-measure-that-changed/episode.zip`.

The student wants to be a useful assistant. The Teaching Stone takes them into a grain-store courtyard; a mentor's kindness exposes a false account and an overlooked household. Investigation reveals finite resources. The student chooses an allocation, a form of correction and an arrangement that outlasts the visitor. The scratched measure and an empty classroom chair carry the return/change. Costs persist in every route; no ending declares a policy morally perfect.

Learning targets: ma’at and the distinction between order and obedience; impartiality across familiar/unfamiliar people; truthful records as a condition for scrutiny rather than a guarantee of fairness; practical accountability beyond a promise. The four-question quiz assesses those concepts independently of narrative choices, with 75/100 required and retry in the shared player. No separate portfolio requirement is added.

Historical references and art provenance are embedded in the package's sources. The setting is inspired by Middle Kingdom grain accounting, not a documented incident. No historical quotations or claims of authentic Egyptian appeal procedures. Existing village scenery stands in for the courtyard; props are narrated. Three new polished SVG characters and two recurring hybrid characters require no new generated artwork.

Build: `node stories/animated/the-measure-that-changed/build.mjs`.
Validate source parity: add `--check`.
Export: `node scripts/story-package.mjs zip public/stories/animated/the-measure-that-changed/episode.json public/stories/animated/the-measure-that-changed/episode.zip`.
Route/replay/quiz/ZIP checks: `npx vitest run src/test/measure-episode.test.ts`.

## Ethics assignment Decision Note

The assigned app player displays five separate Decision Note prompts after the story ends, before and after the knowledge quiz is passed. They appear for `measure-that-changed-ethics` in Ethics class `e24ec8d9-21d7-4c32-a30e-08655c2f4e65`. The companion is rendered by `EthicsDecisionNote`; the published package, assignment version, quiz and saved attempts remain unchanged. This also makes the questions available when reopening a completed attempt. The public reading and unassigned studio previews are not assignment views.

Focus: **2a.1 — compare belief and action.** Students explain whether Seneb’s action fits his stated value of ma’at, using a specific detail. Success is a supported connection between the stated value and an action, not a preferred moral verdict. The familiar five prompts ask students to choose, explain with evidence, present the strongest alternative, state a principle and test it. Allow 8–10 minutes and about 80–120 words or five concise bullets in the episode assignment; the app displays prompts and does not collect or submit these responses. Writing never gates gameplay.

Teacher cues: a student may defend compassionate exceptions while requiring honest records and fair access, or defend consistent distribution because reserves are limited while seeking another way to meet need. Both require evidence and a fair opposing reason. Watch for treating ma’at as mere obedience or an identical allocation as automatically fair. Feedback: “Which action fits or conflicts with the stated value, and how does your detail establish that?” Completion with revision asks for all five relevant responses and a specific detail. This addition creates no new Canvas assignment, deadline or grade.
