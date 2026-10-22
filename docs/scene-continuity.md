# Continuous acting in Story 2

Both players run finite stage motion beside readable dialogue. Continue and audio remain usable during reactions and action beats. Navigation aborts the previous performance, and resume restores expression, rest, gaze, props and facing without replaying transient actions. A short state-commit/exit transition still guards against duplicate input.

## Actions beneath a line

```
show Hyun determined left
show Dummy neutral right
perform Hyun sword-strike Dummy repeat 3 tiring
I: I keep practising.
```

`perform Actor action [Target] repeat 1..6 [steady|tiring]` uses the shared action library and staging validation. It accompanies the next dialogue/choice instead of adding a separate caption or saved step. Repeats are finite; tiring increases recovery time between strokes. Leave time to read, but never require the reader to watch every repetition. Mandarin metadata/audio remains attached to the exact dialogue text. Use `act ... "Caption"` when the action deserves its own readable beat.

Independent actors can react concurrently; cues involving the same actor run in order. Keep performance cues immediately before the line they accompany. Actions retain wide framing. Reduced motion omits transient sequences. Static training targets may declare `impact: "anchored"` on their character asset to sway around their base after a sword strike. This does not give static artwork articulated joints. Sword contact uses the rig's extended hand position; the actor renders ahead of the target to keep the blade visible.

## Expressions and attention

```
express Hyun embarrassed
look Hyun down
Instructor [determined]: Again.
look Hyun Instructor
express Hyun determined
Hyun: All right.
```

`express Actor emotion` changes only expression, preserving position, facing, rest and props. Existing `show` still resets staging as before. `look Actor OtherActor|auto|front|away|down` persists until changed or the character is re-shown. Actor targets must be staged. Automatic gaze attends to the speaker or action partner; use an explicit target in a group. `away` looks opposite the current partner; `front` centers the eyes. Polished/hybrid cartoon rigs animate pupil direction; legacy raster rigs retain their existing limited face behavior.

Large automatic emotional gestures begin when emotion changes rather than on every story cursor change. Starting speech can cue a talking gesture; stopping it returns to rest without replaying the same strong emotion. Eye direction eases over 240 ms; expression changes fade in over 220 ms and body poses settle continuously. Reduced motion applies the final pose immediately. Embarrassment and disappointment have distinct mouth shapes, with blush on refined embarrassed faces.

Publish a new package version when changing scripts; never map old saved steps onto a rewritten script. The Chunky Chinese training revision is `moonlight-08-v2`; v1 is retained.

## Framing and atmosphere

Use `camera listener Hyun over 0.65` for an emotional reaction, `camera speaker over 0.4` to follow the next speaker, `camera two Hyun Instructor cut` for a shared composition, and `camera action Hyun Dummy cut` before training. Framing uses actual face/body bounds and fits phone and desktop stages. Action shots cut immediately so contact geometry stays stable. Other cameras accept `cut` or `over 0..3`; reduced motion cuts immediately. The acting library previews these shots and inserts both targets when needed.

`ambience hall|wind|rain|none` and `environment dust|rain|none` persist until changed or the next scene. `sound swish|straw|thud|clang|step|chime` is a one-shot cue. Sword actions also time their swish/contact effects automatically; avoid adding duplicate impacts. Sound is synthesized locally. Hall effects include a quiet short reflection.

Sound & atmosphere starts with ambience, effects, and captions off. Readers enable each explicitly and control volumes independently; Chunky Chinese also exposes Mandarin voice volume. Atmosphere ducks during speech. Navigation cancels pending effects, hidden pages stop sound, and leaving/completing an episode closes audio. Resume restores scenery without replaying transient sounds. Reduced motion removes environmental particles and action sequences but preserves explicitly authored sound cues.

## Sustained activities

See [scene activities](scene-activities.md) for optional walking, mirrored travel scenery, ongoing sword practice, recovery and interruption controls. These persist across ordinary dialogue; finite `perform` cues keep their original behavior.

## Conversation presence

The shared cartoon-v1 renderer (including hybrid heads) now uses a shallow three-quarter turn toward the gaze target. The head settles before the torso; facial features shift and the far eye narrows. This is stylized 2D perspective, not a full profile or rear view. Explicit `look Actor front` returns to camera; `look Actor Other` and `look Actor away` direct the turn. Stage positions and mirrored facing determine the direction. No new script command or saved state is needed.

When another character has a dialogue beat, silent actors use quiet attentive, warm or guarded listening according to their own expression, including with audio off. Explicit rest, props, activities and contact actions take priority; automatic turning is suppressed for those poses to preserve alignment. An authored `react` still controls meaningful listener responses. Neutral solo narration adds no invented reaction.

Breathing moves the upper body gently with a stable, distinct phase per actor. It does not restart each sentence. The scene-motion toggle is available for conversation scenes and pauses idle breathing/blinking; hidden tabs and ended scenes suspend idle motion too. Reduced motion preserves the static orientation and expression without breathing or turn transitions. Existing legacy image rigs retain their existing orientation; new turning is provided by cartoon-v1.

Verify both SVG and hybrid cast on phones and desktop, including both stage sides, front-facing thoughts, speech changes, props, replay, scene pause and reduced motion. Keep authoring reactions sparse and motivated by the text.
