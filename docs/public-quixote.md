# Public Don Quixote collection

Public route: `/Learningisfun/#/quixote`. Direct episodes use `/quixote/<catalog-id>`. No login or membership is required. The normal Story 2 player runs without debug controls or grading calls; progress remains in memory and resets on leaving/reload.

The collection currently offers four animated adventures, covering Part I chapters 1, 2–3, 4–5 and 6–7. Legacy versions are not duplicated as additional episodes. The windmills card is deliberately unavailable. Do not automatically expose a classroom package as a public finale.

## Editorial scope

Public scripts live in `stories/public-quixote/`; classroom scripts and published attempts are unchanged. Episode 1 introduces the mysterious book in an airport gift shop, between marmalade and a travel pillow. Later episodes give a shorter reminder and pick up the prior narrative. The one-question journal, local choices, source events, callbacks and four-question knowledge checks remain intact.

No named teacher, school references, private paths or course metadata are included. The teacher is labelled “My English teacher” and rebuilt as an anonymous fictional vector character rather than reusing the personal cast. Reflection scenes use the journal illustration instead of the school-themed classroom. Source notes identify Ormsby/Cervantes and distinguish invented framing from the novel. This is a public adaptation, not a newly assigned class activity.

## Rebuild and add the finale

`node scripts/build-public-quixote.mjs` generates the public packages and copies their artwork. `npm run build` checks source parity. Export each ZIP using `node scripts/story-package.mjs zip <episode.json> <episode.zip>`; tests verify import parity, anonymity, legal routes and knowledge scores.

The explicit catalog is `stories/public-quixote/catalog.json`. To add the windmills later: create an anonymous public script, add the reviewed package to the public builder with the correct source range, build its ZIP and artwork, update the reserved catalog entry and set `available` to true. The ready count updates from the catalog. Run the public tests and normal build before publishing. A direct link to the reserved entry currently shows “in preparation” and never fetches a package.
