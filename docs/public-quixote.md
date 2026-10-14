# Public Don Quixote collection

Public route: `/Learningisfun/#/quixote`. Direct episodes use `/quixote/<catalog-id>`. No login or membership is required. The normal Story 2 player runs without debug controls or grading calls; progress remains in memory and resets on leaving/reload.

The collection currently offers five animated adventures, covering Part I chapters 1, 2–3, 4–5, 6–7 and 8. Legacy versions are not duplicated as additional episodes. The windmills finale is available at `/quixote/the-giants-that-were-mills`, with anonymous framing and its original mounted-charge animation.

## Editorial scope

Public scripts live in `stories/public-quixote/`; classroom scripts and published attempts are unchanged. Episode 1 introduces the mysterious book in an airport gift shop, between marmalade and a travel pillow. Later episodes give a shorter reminder and pick up the prior narrative. The one-question journal, local choices, source events, callbacks and four-question knowledge checks remain intact.

No named teacher, school references, private paths or course metadata are included. The teacher is labelled “My English teacher” and rebuilt as an anonymous fictional vector character rather than reusing the personal cast. Reflection scenes use the journal illustration instead of the school-themed classroom. Source notes identify Ormsby/Cervantes and distinguish invented framing from the novel. This is a public adaptation, not a newly assigned class activity.

## Rebuild and extend the collection

`node scripts/build-public-quixote.mjs` generates the public packages and copies their artwork. `npm run build` checks source parity. Export each ZIP using `node scripts/story-package.mjs zip <episode.json> <episode.zip>`; tests verify import parity, anonymity, legal routes and knowledge scores.

The explicit catalog is `stories/public-quixote/catalog.json`. Future additions require an anonymous public script, the correct source chapter in the builder, a generated package and ZIP, artwork and a reviewed catalog entry. Run the public tests and normal build before publishing. Unknown episode links show a collection link without fetching a package.

## Revised first adventure

Episode 1 now uses public revision 2, with the Chapter 1 helmet test enacted, the barber as a second actor, and seven brief choices. The original root JSON/ZIP remain unchanged. Catalog `revision` selects `revisions/<n>/` for player and download; the builder reads the matching `revision-<n>.json` editorial file for quiz/source updates and explicitly selected returning characters. Its script remains in the usual public script file. A future substantial rewrite should increment this revision so released packages remain intact.
