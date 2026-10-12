# Shared manga character standard

Use `cartoon-v1` for new articulated characters. Lin is the visual reference; Mr. Hepting, Mei and Yeyul use the same renderer and acting controller. The character's identity is data, not a new animation implementation.

## Identity and appearance

Available packs: `public/stories/animated/rigs/{lin,hepting,mei,yeyul}-cartoon.json`. Add them from the studio's **Reusable cast** selector. The AP episode uses Lin and Mr. Hepting; Mei and Yeyul remain reusable library characters, without inserting them into its story.

A character pack contains name, incrementing version, provenance, a neutral WebP fallback, and:

```json
{"version":2,"preset":"cartoon-v1","style":"manga","palette":{"skin":"#eac7a8","hair":"#654637","shirt":"#376975"},"appearance":{"age":"adult","hair":"side-part","glasses":"round","outfit":"teacher"}}
```

Only six-digit hex colours are allowed. Optional appearance values are closed:

| Field | Allowed values | Default |
| --- | --- | --- |
| age | teen, adult | teen |
| hair | layered, side-part, long, bob | layered |
| glasses | none, round | none |
| outfit | uniform, teacher | uniform |

Preserve identity through silhouette, hair, age, glasses and clothing—not palette alone. Hepting is an adult with a broader jaw, smaller irises, brown side-parted hair, glasses, teal top and tan trousers. Lin has layered short hair; Mei long hair; Yeyul a bob. Classmates wear red CDIS polos and navy trousers. These are fictional illustrated people, not real student likenesses.

## Drawing constraints

- One coherent vector figure: clean rounded ink, restrained cel shadows, almond eyes with small highlights and a small expressive mouth. No photo-textured parts or floating facial overlays.
- Keep the shared 240 × 600 coordinate frame, feet at y=579, shadow at y=582, shoulders at x=76/164 and y=213, upper/forearm lengths 58/57, head pivot (120,176), torso pivot (120,348). All characters have the same displayed height and baseline.
- Continuous curved arms connect to overlapping sleeves and wrists. Hair and clothing may change silhouette but cannot move the skeleton or obscure the mouth, hands or expressions. Do not stretch bitmap limbs.
- Use the approved appearance options for ordinary new characters. A new silhouette outside these options requires one deliberate shared-renderer extension, schema validation and visual checks; do not embed SVG, HTML or JavaScript in character packages.

## Movement constraints

All characters inherit the same controller; never add a per-character loop. A gesture prepares for 180 ms, reaches emphasis by 650 ms, holds until 1150 ms and settles by 1900 ms. Head and torso follow slightly later. Pose changes blend; feet remain planted. Idle breathing expands only the chest by less than 0.5%; blinking is spaced and varied. Speaking uses small mouth shapes with pauses and stops between beats. Every timer/frame cancels on unmount or navigation. Reduced motion disables breathing, blinking and talking motion while preserving a readable resting expression.

Use only [the acting library](episode-acting-library.md): its 12 emotions, four resting poses, six talking gestures, eight responses, moves and camera settings. Prefer automatic acting, with one intentional gesture for an important beat. Wide establishes a place or choice; medium carries conversation; close supports a personal reaction. Do not shake, zoom or wave on every line.

## Repeatable creation prompt

> Create a reusable fictional episode character named [name], role/age [role], identity [hair, glasses, clothes, colours]. Follow character-standard.md and acting-library.md. Select only validated cartoon-v1 appearance options, preserve the common anatomy and finite motion controller, and keep the design distinct from the existing cast. Add a versioned pack with neutral fallback and provenance using scripts/build-lin-rig.mjs as the build pattern. Do not invent animation cues, recolour Lin as a substitute for identity, or insert new characters into a story without a narrative reason. Preview all emotions plus contrasting gestures at wide, medium and close framing, check phone cropping and reduced motion, validate the package, and document any unsupported appearance request before extending the shared renderer.

## Build and review

1. Add or update a cast definition in `scripts/build-lin-rig.mjs`; increment the affected character version. The historical script name also builds the full cartoon cast.
2. Run `node scripts/build-lin-rig.mjs`, rebuild the episode source and ZIP. The studio can add/update a pack in a draft. Published packages embed their own snapshot; never rewrite an existing attempt.
3. Validate appearance through the shared client/server `validateRig`. Preview neutral, worried, happy, angry and surprised; explain, reassure, celebrate, wave and recoil. Check connected limbs at extreme poses, unobstructed glasses/eyes/mouth, distinctive silhouette, anchored feet, close-up framing and reduced motion. Review phone and desktop.
4. Run the repository checks. When changing the appearance schema, deploy backend support before frontend. Do not assign or migrate episodes merely to update the library.
