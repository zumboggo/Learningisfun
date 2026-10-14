# Shared acting library v4

Generated from `functions/learning-content/src/acting-library.js`. Use Story 2 for all new episodes. Do not invent cue names. The reusable Lin, Hepting, Mei and Yeyul cast uses cartoon-v1: a coherent vector character with continuous arms and finite coordinated gestures. Raster teen-v1 remains supported for existing packages. Both use this same closed cue vocabulary.

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
- `shocked`
- `laughing`
- `excited` — Throw both hands overhead with an eager bounce.
- `scared` — Recoil with open hands shielding the face.
- `frustrated`
- `proud` — Plant hands at the waist and lift the chin.
- `pleading`
- `disappointed` — Let both arms fall as the head and shoulders sink.

## Resting poses

- `kneeling` — Remain on one knee until the resting pose changes.
- `crouched` — Remain low with bent knees.
- `sheltered` — Stay crouched with hands shielding the head.
- `relaxed` — Soft breathing, occasional blink, shoulders at ease.
- `attentive` — Slight head tilt and alert listening.
- `guarded` — Arms held nearer the body; restrained movement.
- `downcast` — Lowered head and quieter breathing.

## Talking gestures

- `phone-talk` — Hold a visible phone at the ear and talk. The phone stays equipped until prop Actor none. One character.
- `phone-shout` — Keep the phone at the ear while leaning forward and emphasizing with the free hand. One character.
- `explain` — One open hand presents an idea.
- `reassure` — Gentle open hands and a sympathetic tilt.
- `question` — Both hands open with a questioning head tilt.
- `insist` — A firm single-hand emphasis.
- `hesitant` — Small hand movement and a tentative tilt.
- `celebrate` — Open arms and an upbeat emphasis.
- `shock` — Both hands fly to the cheeks as the eyes widen and mouth opens.
- `laugh` — Lean back, tip the head up and hold the belly through a burst of laughter.
- `rage` — Clench both fists and swing the arms in two frustrated emphases.
- `excited` — Throw both hands overhead with an eager bounce.
- `scared` — Recoil with open hands shielding the face.
- `facepalm` — Bring one hand over the face and bow the head.
- `proud` — Plant hands at the waist and lift the chin.
- `plead` — Bring both hands together at the chest and lean forward.
- `disappointed` — Let both arms fall as the head and shoulders sink.

## Expressive responses

- `kneel` — Lower onto one knee, pause, then rise. Use rest Actor kneeling to remain down. One character.
- `crouch` — Bend both knees into a low crouch, then rise. Use rest Actor crouched to stay low. One character.
- `duck` — Drop the head and bend the knees beneath an incoming threat, then recover. One character.
- `cover-head` — Crouch with both hands shielding the head. Use rest Actor sheltered to hold the pose. One character.
- `phone-talk` — Hold a visible phone at the ear and talk. The phone stays equipped until prop Actor none. One character.
- `phone-shout` — Keep the phone at the ear while leaning forward and emphasizing with the free hand. One character.
- `sword-strike` — Strike with a visible sword; the target recoils without gore. Requires a second character.
- `draw-bow`
- `cast-beam`
- `nod` — One head nod, then return to rest.
- `shake-head` — A small side-to-side head motion.
- `shrug` — Raised forearms and a questioning tilt.
- `point` — Extend an arm toward something.
- `wave` — Lift a forearm and wave the hand.
- `recoil` — Lean back with raised forearms.
- `laugh` — Lean back, tip the head up and hold the belly through a burst of laughter.
- `sigh` — Head and shoulders settle downward.
- `bow` — A brief formal bow. One character.
- `cheer` — An enthusiastic raised-arm celebration. One character.
- `reach` — Reach out to inspect or take something described in the caption. One character.
- `cower` — Cover the head and draw back. One character.
- `stumble` — Lose balance, catch it, and return upright. One character.
- `strike` — Extend the leading arm in a stylized strike.
- `block` — Raise both forearms to guard.
- `dodge` — Lean away and recover balance.
- `shock` — Both hands fly to the cheeks as the eyes widen and mouth opens.
- `rage` — Clench both fists and swing the arms in two frustrated emphases.
- `excited` — Throw both hands overhead with an eager bounce.
- `scared` — Recoil with open hands shielding the face.
- `facepalm` — Bring one hand over the face and bow the head.
- `proud` — Plant hands at the waist and lift the chin.
- `plead` — Bring both hands together at the chest and lean forward.
- `disappointed` — Let both arms fall as the head and shoulders sink.

## Camera framing

- `auto`
- `wide`
- `medium`
- `close`

## Action beats

- `kneel` — Lower onto one knee, pause, then rise. Use rest Actor kneeling to remain down. One character.
- `crouch` — Bend both knees into a low crouch, then rise. Use rest Actor crouched to stay low. One character.
- `duck` — Drop the head and bend the knees beneath an incoming threat, then recover. One character.
- `cover-head` — Crouch with both hands shielding the head. Use rest Actor sheltered to hold the pose. One character.
- `attack-ducked` — A strike passes over the target as they duck; no hit lands. Requires a second character.
- `phone-talk` — Hold a visible phone at the ear and talk. The phone stays equipped until prop Actor none. One character.
- `phone-shout` — Keep the phone at the ear while leaning forward and emphasizing with the free hand. One character.
- `sword-strike` — Strike with a visible sword; the target recoils without gore. Requires a second character.
- `sword-blocked` — A sword strike meets the target’s guard; no hit lands. Requires a second character.
- `sword-dodged` — The target dodges the sword strike. Requires a second character.
- `shoot-arrow` — Draw the bowstring and release a visible arrow toward the target, who recoils. Requires a second character.
- `magic-beam` — Extend an empty palm and cast a finite beam toward the target, who recoils. Requires a second character.
- `attack` — A stylized lunge and strike; the other character recoils. Requires a second character.
- `attack-blocked` — A strike meets a raised guard; both return to their marks. Requires a second character.
- `attack-dodged` — A strike misses as the other character leans away. Requires a second character.
- `challenge` — One character challenges; the other answers with a shrug. Requires a second character.
- `give` — Both reach for a mimed handoff; describe the object in the caption. Requires a second character.
- `bow` — A brief formal bow. One character.
- `cheer` — An enthusiastic raised-arm celebration. One character.
- `reach` — Reach out to inspect or take something described in the caption. One character.
- `cower` — Cover the head and draw back. One character.
- `stumble` — Lose balance, catch it, and return upright. One character.

## Held props

- `none`
- `phone`
- `sword`
- `bow`

Use `act Lin attack-blocked Jordan "Lin lunges; Jordan blocks."` for a coordinated action beat, or `act Lin bow "Lin bows."` for one character. Show both actors in distinct positions first. Paired actions face each other and use a wide shot; later dialogue uses the authored camera again. A caption is required (one line, no double quotes inside it). Actions pause until Continue; motion cannot change scores, variables or outcomes. Reload restores the caption and stage without replaying the action. Reduced motion skips movement; static images use whole-character motion. Polished/hybrid cartoon-v1 characters support visible props: `prop Lin phone`, `prop Lin sword`, `prop Lin bow`, `prop Lin none`. Equip only after show; scene, exit or a new show resets the prop. Prop actions auto-equip their object and leave it held. `phone-talk` and `phone-shout` also work as talking gestures while the phone stays at the ear. Ordinary give remains mimed. Use wide framing for weapons and projectiles; magic-beam clears the held object. Reduced motion shows static props and a static effect. Every action returns to its resting pose at its original marks. Use kneeling, crouched or sheltered rests to stay low; relaxed returns upright. Use a following line/exit to describe lasting injury or absence; a return to the mark is not a recovery in the story.

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

New characters default to polished SVG (`finish: "polished"`). The recurring cast uses `finish: "hybrid"` with an embedded WebP `head: {src, frame: [x,y,width,height]}` and animated SVG facial features. Head assets count toward the package budget and travel in ZIP exports. Missing finish preserves the legacy flat vector appearance. For example, a vector rig has `rig: {version: 2, preset: "cartoon-v1", style: "manga", palette: {skin: "#eac09c", hair: "#293338", shirt: "#b93f46"}}`. Palette values must be six-digit hex colours. The runtime draws the complete figure in one vector style, including curved arms and consistent hands and face. No bitmap body parts are required; recurring hybrid characters embed one illustrated head base. Optional appearance selects age (teen/adult), hair (layered/side-part/long/bob/cropped), glasses (none/round), outfit (uniform/teacher/tunic/robe), face (default/oval/round/angular), and facialHair (none/full). Optional palette glasses, beard and trim colours customize these details. Omitted appearance preserves Lin’s original design. See character-standard.md for constraints and the creation prompt. Keep the existing cue vocabulary.

## Legacy raster character contract

A rig has version 1, preset `teen-v1`, and exactly these transparent WebP parts: `torso`, `pelvis`, `head`, `leftUpperArm`, `leftForearm`, `leftHand`, `rightUpperArm`, `rightForearm`, `rightHand`, `leftThigh`, `leftShin`, `rightThigh`, `rightShin`. The head artwork has a blank face; the runtime supplies eyes, brows and mouth. Hidden overlap at shoulders, elbows, wrists, hips and knees prevents seams. Keep teen proportions, consistent baseline and red CDIS school polo. Every published package embeds its own parts; later library changes cannot change saved episodes.

### Kneeling and defensive movement

Use `act Actor kneel "Caption"`, `crouch`, `duck` or `cover-head` for finite low movements. `attack-ducked` takes a second staged actor and fixes the outcome as a miss. These lower the cartoon-v1 body with bent, connected legs; they are not just torso tilts. For a ceremony or sustained shelter, use `rest Actor kneeling`, `crouched` or `sheltered`; return to `rest Actor relaxed` to stand. Keep full-body framing wide. Held poses persist across dialogue/resume, while action gestures finish and return to the resting pose. Legacy raster rigs retain their limited fallback; do not claim articulated kneeling for them. Rocks are still described in captions, not rendered projectiles. Preserve published episode snapshots; new library support alone does not rewrite an old Quixote script.

## Folded arms and lance (acting v5)

`act Actor cross-arms "Caption"` frees both hands and folds the arms once. Follow with `rest Actor arms-crossed` to hold them during angry dialogue and choices; `rest Actor relaxed` releases. The held rest suppresses automatic arm gestures; explicit gestures can override it. `prop Actor lance` equips a visible hand-attached lance. `act Actor lance-threat Other "Caption"` levels it without striking, with a defensive target reaction. Use wide framing. Clear props before folded rests and after narrative loss or destruction. See the live catalog for all cues.

## Mounted charge and care (acting v6)

`act Actor mounted-charge "Caption"` shows the existing polished/hybrid character riding a shared vector horse with lance and buckler. The horse is visible only for that action caption; use a solo wide shot with room ahead. The finite charge returns to its mark and does not simulate a hit, broken weapon or fall. Resume and reduced motion show the mounted pose without galloping. Narrate cuts and remounts explicitly and clear the lance after its loss. `act Actor wince "Caption"` gives a short hand-to-ribs flinch. `act Helper steady Other "Caption"` offers a supporting arm while the other braces; stage both first, clear their props as appropriate, and narrate any actual rise separately. Steady frees the helper’s hand and preserves existing resting poses. These cues are reusable in both classroom and Chinese mode when the destination runtime includes acting v6.
