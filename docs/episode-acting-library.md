# Shared acting library v1

Generated from `functions/learning-content/src/acting-library.js`. Use Story 2 for all new episodes. Do not invent cue names. Current Lin uses cartoon-v1: a coherent vector character with continuous arms and finite coordinated gestures. Raster teen-v1 remains supported for existing packages. Both use this same closed cue vocabulary.

## Emotions

- `neutral`
- `happy`
- `worried`
- `sad`
- `angry`
- `surprised`
- `curious`
- `confused`
- `skeptical`
- `embarrassed`
- `relieved`
- `determined`

## Resting poses

- `relaxed` — Soft breathing, occasional blink, shoulders at ease.
- `attentive` — Slight head tilt and alert listening.
- `guarded` — Arms held nearer the body; restrained movement.
- `downcast` — Lowered head and quieter breathing.

## Talking gestures

- `explain` — One open hand presents an idea.
- `reassure` — Gentle open hands and a sympathetic tilt.
- `question` — Both hands open with a questioning head tilt.
- `insist` — A firm single-hand emphasis.
- `hesitant` — Small hand movement and a tentative tilt.
- `celebrate` — Open arms and an upbeat emphasis.

## Expressive responses

- `nod` — One head nod, then return to rest.
- `shake-head` — A small side-to-side head motion.
- `shrug` — Raised forearms and a questioning tilt.
- `point` — Extend an arm toward something.
- `wave` — Lift a forearm and wave the hand.
- `recoil` — Lean back with raised forearms.
- `laugh` — Head lifts with a brief shoulder bounce.
- `sigh` — Head and shoulders settle downward.

## Camera framing

- `auto`
- `wide`
- `medium`
- `close`

## Authoring

```story
story 2
label start
scene classroom
show Lin curious center
camera medium Lin
Lin [curious, question]: What changed your mind?
react Lin nod
Lin [relieved, reassure]: We can try again.
camera wide
I: I step back to see the whole room.
end
```

Emotion automatically selects a resting pose and talking gesture. Plain dialogue uses the current emotion. Optional `rest Lin attentive` overrides the resting pose. `react` plays once, then releases the pose. Speaking stops after a bounded interval and between dialogue; no speech synthesis is used. Breathing is a tiny chest expansion with grounded feet; blinks are spaced with varied timing. A talking gesture prepares, emphasizes, holds, then settles once; mouth shapes are small with pauses. Motion is disabled with reduced motion. Use close shots for a personal revelation, medium for conversation, and wide for arrivals or choices; `camera auto` restores automatic framing. Keep gestures sparse.

Whole-character moves: `enter`, `exit`, `left`, `center`, `right`, `turn`, `nod`, `shake`, `bounce`, `recoil`. Stage effects: `fade`, `closeup`, `shake`, `magic`. Prefer `react` for joint-based responses and `camera` for sustained framing. Flat image characters still work but cannot articulate.

## Current cartoon character contract

New Lin uses character version 4 with `rig: {version: 2, preset: "cartoon-v1", style: "manga", palette: {skin: "#eac09c", hair: "#293338", shirt: "#b93f46"}}`. Palette values must be six-digit hex colours. The runtime draws the complete figure in one vector style, including curved arms and consistent hands and face. No bitmap body parts are required. Keep the existing cue vocabulary.

## Legacy raster character contract

A rig has version 1, preset `teen-v1`, and exactly these transparent WebP parts: `torso`, `pelvis`, `head`, `leftUpperArm`, `leftForearm`, `leftHand`, `rightUpperArm`, `rightForearm`, `rightHand`, `leftThigh`, `leftShin`, `rightThigh`, `rightShin`. The head artwork has a blank face; the runtime supplies eyes, brows and mouth. Hidden overlap at shoulders, elbows, wrists, hips and knees prevents seams. Keep teen proportions, consistent baseline and red CDIS school polo. Every published package embeds its own parts; later library changes cannot change saved episodes.
