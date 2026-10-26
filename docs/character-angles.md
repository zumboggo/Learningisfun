# Character angles and conversational acting

The shared `cartoon-v1` renderer supplies front, three-quarter and profile views. Vector recipes inherit silhouettes, hair/ear perspective, face anchors and near/far arm layering. Existing hybrid packs without view artwork retain their original front artwork and shallow automatic turn; legacy image rigs retain their existing capabilities.

## Directing

```
show Kevin neutral left
show Hepting curious right
look Kevin Hepting
orient Kevin three-quarter
Kevin [hesitant]: I thought it made sense until I read it aloud.
orient Kevin profile
Kevin [explain]: Let me show you.
orient Kevin auto
react Hepting nod
Hepting: Start with the sentence that matters.
```

`orient Actor auto|front|three-quarter|profile` persists independently of gaze. Explicit angles follow the actor's existing facing; `move Actor turn` mirrors them. Auto follows the gaze target in three-quarter. Show resets orientation, and saved-route replay reconstructs it. Actors must be on stage on every incoming path. No rear views are claimed.

Activities, props, explicit held rests and contact actions retain their established front geometry. Free conversational reactions can use angles. Reduced motion keeps a meaningful static pose and orientation; scene pause and hidden tabs suspend finite conversational motion. Continue cancels outstanding cues immediately.

## Reusable artwork

New vector characters use `createCharacter` and need no individual angle files. Preserve the approved front identity. For illustrated characters, provide `recipe.views` (or `viewAssets` in the cast source) with `three-quarter` and `profile` entries:

```
{src: "data:image/webp;base64,…", frame: [77,43,99,135],
 anchors: {nearEye:[150,119], mouth:[164,150]}}
```

Three-quarter also requires `farEye:[x,y]`. Coordinates are in the shared 240×600 actor space, after mapping the image into its frame. Artwork faces right; the renderer mirrors it for the other direction. Use blank facial surfaces so brows, eyes and mouths remain animated. Retain nose/chin silhouettes. Glasses and beards remain runtime layers. All frames and anchors are validated; external images are rejected. Views are included in ZIP export/import and the shared 5 MB package budget.

Use the original approved head as the generation reference. Preserve alpha, skin, hair and silhouette. Split a two-view strip, trim transparent margins and encode each view as WebP; then align anchors in the actual renderer. Generation records and prompt are in `public/stories/animated/heads/angles-v1/provenance.json`. Front assets remain intact. Five matching head sets serve six cast entries because Lin reuses the established bob-haired head.

The current cast library contains the new assets. Existing released builders explicitly reference `rigs/pre-angles/`, preserving their package bytes. Never regenerate a released package from the newest cast automatically. New episode versions can opt into new packs.

## Twelve polished cues

`acting-motion.ts` owns preparation, emphasis, hold, recovery, head/hand delays and restrained weight shifts for explain, reassure, question, insist, hesitant, nod, shake-head, shrug, laugh, sigh, disappointed and cross-arms. Character-ID variation is deterministic and never consumes the story seed. A speaking gesture does not restart on an ordinary dialogue cursor change. Held rests remain held; interrupted gestures blend from the current pose. The rehearsal's Earlier timing mode uses the common original envelope for comparison.

## Review

Open `#/game/acting-angles` for two-character comparisons, cast swapping, all twelve cues, both directions, framing, pause and reduced motion. Open `#/game/cast` for all cast members; the character builder also previews every angle before adding a recipe. Inspect expressions, hair, glasses, beard, hand alignment and foot contact on phone and desktop. Run orientation/replay, rig-budget, ZIP round-trip and interruption checks before publishing. Synchronize shared files to Chunky Chinese with `game:sync`, then run `game:parity`; retain its approved local character overlays.

## Host-owned vector identities (2026-10-27)

`CartoonActor.angleDesigns` accepts typed `VectorAngleDesign` data for each non-front view: distinct face, hair, ear and shadow paths, eye/mouth anchors, iris and highlight colors. The canonical `AngleFace` owns expressions, gaze, mouth animation and mirroring; hosts supply artwork data, not another renderer. Valid embedded illustrated views take precedence. The approved front renderer stays unchanged. Chunky Chinese uses this extension through its sync overlays for Weed Option A and young Kvothe (`chinese-angle-designs-v2.ts`). Jonathan remains the ordinary adult/robe vector recipe. Props and contact keep front geometry.

Explicit reactions now retain their motion clock when speech starts or pauses. Ordinary dialogue cursor changes no longer cancel a running talking gesture. Intentional reaction changes still blend from the current pose.
