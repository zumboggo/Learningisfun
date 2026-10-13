# Shared manga character standard

Use `cartoon-v1` for new articulated characters. Lin is the visual reference; Mr. Hepting, Mei, Yeyul and Jordan use the same renderer and acting controller. The character's identity is data, not a new animation implementation.

## Identity and appearance

Available packs: `public/stories/animated/rigs/{lin,hepting,mei,yeyul,jordan}-cartoon.json`. Add them from the studio's **Reusable cast** selector. The AP episode uses Lin and Mr. Hepting; Mei and Yeyul remain reusable library characters, without inserting them into its story.

A character pack contains name, incrementing version, provenance, `expressions: {}`, and the rig below. Vector neutral poses are drawn directly; no image is needed. Legacy and static characters keep their neutral WebP fallback.

```json
{"version":2,"preset":"cartoon-v1","style":"manga","palette":{"skin":"#eac7a8","hair":"#654637","shirt":"#376975"},"appearance":{"age":"adult","hair":"side-part","glasses":"round","outfit":"teacher"}}
```

Only six-digit hex colours are allowed. Optional palette keys `glasses`, `beard` and `trim` set their colours. Optional appearance values are closed:

| Field | Allowed values | Default |
| --- | --- | --- |
| age | teen, adult | teen |
| hair | layered, side-part, long, bob, cropped | layered |
| glasses | none, round | none |
| outfit | uniform, teacher, tunic, robe | uniform |
| face | default, oval, round, angular | default |
| facialHair | none, full | none |

Preserve identity through silhouette, hair, age, glasses and clothing—not palette alone. Hepting is an adult with a broader jaw, smaller irises, short brown hair, blue glasses, a neatly cropped brown beard, teal top and tan trousers. Lin has layered short hair; Mei long hair and a round face; Yeyul a bob and oval face; Jordan a side-part and angular face. Classmates wear red CDIS polos and navy trousers. Students are fictional illustrated people, not real student likenesses. Mr. Hepting’s updated portrait uses David’s explicitly supplied reference photo. Keep source photos outside published assets; record authorization in provenance.

## Drawing constraints

- One coherent vector figure: clean rounded ink, restrained cel shadows, almond eyes with small highlights and a small expressive mouth. No photo-textured parts or floating facial overlays.
- Keep the shared 240 × 600 coordinate frame, feet at y=579, shadow at y=582, shoulders at x=76/164 and y=213, upper/forearm lengths 58/57, head pivot (120,176), torso pivot (120,348). All characters have the same displayed height and baseline.
- Straight upper/lower arm segments with rounded elbow joins connect to overlapping sleeves and wrists. Hair and clothing may change silhouette but cannot move the skeleton or obscure the mouth, hands or expressions. Do not stretch bitmap limbs.
- Use the approved appearance options for ordinary new characters. A new silhouette outside these options requires one deliberate shared-renderer extension, schema validation and visual checks; do not embed SVG, HTML or JavaScript in character packages.

## Movement constraints

All characters inherit the same controller; never add a per-character loop. A gesture prepares for 180 ms, reaches emphasis by 650 ms, holds until 1150 ms and settles by 1900 ms. Head, torso and wrists follow slightly later. Pose changes blend; feet remain planted. Idle breathing expands only the chest by less than 0.5%; blinking is spaced and varied. Speaking uses small mouth shapes with pauses and stops between beats. Every timer/frame cancels on unmount or navigation. Reduced motion disables breathing, blinking and talking motion while preserving a readable resting expression.

Use only [the acting library](acting-library.md): its emotions, resting poses, talking gestures, responses, coordinated actions, moves and camera settings. Prefer automatic acting, with one intentional gesture for an important beat. Wide establishes a place or choice; medium carries conversation; close supports a personal reaction. Do not shake, zoom or wave on every line.

## Repeatable creation prompt

> Create a reusable fictional episode character named [name], role/age [role], identity [hair, glasses, clothes, colours]. Follow character-standard.md and acting-library.md. Select only validated cartoon-v1 appearance options, preserve the common anatomy and finite motion controller, and keep the design distinct from the existing cast. Create a JSON recipe using the shared character builder described below. Record provenance; do not generate separate bitmap limbs. Do not invent animation cues, recolour Lin as a substitute for identity, or insert new characters into a story without a narrative reason. Preview all emotions plus contrasting gestures at wide, medium and close framing, check phone cropping and reduced motion, validate the package, and document any unsupported appearance request before extending the shared renderer.

## Build and review

1. Add or update a cast definition in `stories/characters/cast.json`; increment the affected character version. The historical script name also builds the full cartoon cast.
2. Run `npm run characters:build`, rebuild the episode source and ZIP. The studio can add/update a pack in a draft. Published packages embed their own snapshot; never rewrite an existing attempt.
3. Validate appearance through the shared client/server `validateRig`. Preview neutral, worried, happy, angry and surprised; explain, reassure, celebrate, wave and recoil. Check connected limbs at extreme poses, unobstructed glasses/eyes/mouth, distinctive silhouette, anchored feet, close-up framing and reduced motion. Review phone and desktop.
4. Run the repository checks. When changing the appearance schema, deploy backend support before frontend. Do not assign or migrate episodes merely to update the library.

## One pipeline for Ethics, AP Language and World Literature

In **Game → Create episode → Acting library → Create a character**, enter a script ID and name, select hair/age/glasses/beard/clothing, choose colours, inspect the live preview, then add it to the draft. Export its recipe and import it into any other class episode. Adding never silently replaces an existing character ID. Draft autosave and normal ZIP export preserve the completed character.

Codex uses the identical recipe/schema:

```json
{"id":"Jordan","name":"Jordan","version":1,"palette":{"skin":"#c88e68","hair":"#392b27","shirt":"#b93f46"},"appearance":{"age":"teen","hair":"side-part","glasses":"none","outfit":"uniform"},"provenance":"Original fictional classmate; no real student likeness."}
```

Run `npm run character:create -- recipe.json character.json`, then place that object at `assets.characters.Jordan`. The command refuses to overwrite an existing output. To make a character available in the built-in selector, add the recipe to `stories/characters/cast.json` and run `npm run characters:build`; the catalog is generated automatically. No new React component or animation code is needed for supported appearances. School uniforms apply to CDIS students. Tunic and robe modules use plain cloth, a belt/neckline trim and sandals, with no school crest. They are generic stylised costume bases: choose colours and source-grounded details for the place, era and social role; do not describe them as accurate reconstructions. New face shapes preserve the same eye/mouth/joint anchors. Historical clothing uses shirt as its cloth colour and trim as its accent colour.

Every class uses the same renderer, recipe parser, acting vocabulary, camera controls, package format and preview. Only the story, travel premise, learning content and relevant clothing change. Jordan is available in the library but is not part of the current Last Chair script.
