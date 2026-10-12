# Lin — teen-v1 skin, character version 2

Fictional Grade 11 CDIS classmate, matching the original Lin-neutral.webp design. Generated 2026-10-12 with the built-in image generator, using that image as the visual reference. Red polo, white piping, navy trousers, white shoes. No real student reference was supplied.

Prompt direction: production transparent puppet-parts atlas; graphic-novel inks/shading; slender 16–17-year-old proportions; four-by-four grid with torso/pelvis/head, upper arms/forearms, hands/thighs, shins/shoes; head has a blank face for the runtime overlay; hidden joint overlap; no labels or scenery. Atlas cells were extracted, neighbouring-cell contamination removed using alpha connected components, and compressed to WebP. Facial features are rendered by the shared SVG puppet, not generated as separate expressions.

Rebuild `character.json` with `node scripts/build-lin-rig.mjs`. The canonical acting vocabulary is `functions/learning-content/src/acting-library.js`; its generated reference is `docs/episode-acting-library.md`. All 13 parts use the shared `teen-v1` joints in PuppetActor.tsx. Future skins need visual verification against that geometry. Published packages contain copies, not live links to this library.
