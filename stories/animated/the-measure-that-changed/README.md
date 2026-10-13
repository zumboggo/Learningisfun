# The Measure That Changed

Unassigned Ethics episode, approximately 10–12 minutes plus the quiz. Six choices, 96 legal routes; no morality score. Preview: `#/game/story-preview/the-measure-that-changed`. Importable package: `public/stories/animated/the-measure-that-changed/episode.zip`.

The student wants to be a useful assistant. The Teaching Stone takes them into a grain-store courtyard; a mentor's kindness exposes a false account and an overlooked household. Investigation reveals finite resources. The student chooses an allocation, a form of correction and an arrangement that outlasts the visitor. The scratched measure and an empty classroom chair carry the return/change. Costs persist in every route; no ending declares a policy morally perfect.

Learning targets: ma’at and the distinction between order and obedience; impartiality across familiar/unfamiliar people; truthful records as a condition for scrutiny rather than a guarantee of fairness; practical accountability beyond a promise. The four-question quiz assesses those concepts independently of narrative choices, with 75/100 required and retry in the shared player. No separate portfolio requirement is added.

Historical references and art provenance are embedded in the package's sources. The setting is inspired by Middle Kingdom grain accounting, not a documented incident. No historical quotations or claims of authentic Egyptian appeal procedures. Existing village scenery stands in for the courtyard; props are narrated. Three new polished SVG characters and two recurring hybrid characters require no new generated artwork.

Build: `node stories/animated/the-measure-that-changed/build.mjs`.
Validate source parity: add `--check`.
Export: `node scripts/story-package.mjs zip public/stories/animated/the-measure-that-changed/episode.json public/stories/animated/the-measure-that-changed/episode.zip`.
Route/replay/quiz/ZIP checks: `npx vitest run src/test/measure-episode.test.ts`.
