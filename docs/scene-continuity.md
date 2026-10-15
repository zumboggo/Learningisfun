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
