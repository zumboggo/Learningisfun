# Sustained scene activities

Use an activity when physical work develops the scene: a walk while planning, practice while weighing a decision, or slower movement after effort. Use selectively, with a clear beginning, interruption and end. Do not add an activity to every scene or repeat one throughout an episode. Stillness, listener reactions and changes of shot provide contrast.

## Walking and travel

```
scene Road
show Hyun neutral center
camera wide
activity Hyun walk right steady
scroll Hyun
Hyun: I have time to think on the way.
Hyun: But which promise should I keep?
activity Hyun pause
react Hyun shock
Hyun: That voice again!
activity Hyun resume
Hyun: I should keep moving.
activity Hyun stop
scroll none
Hyun: Here we are.
```

`activity Actor walk left|right slow|steady|brisk` uses an articulated gait, opposite arm swing and gentle body motion on a cartoon-v1 rig. Walking stays at a stage mark; `move` still moves between marks. Ordinary dialogue and audio do not restart the gait. Held props keep their grip; speech uses the existing mouth and facial expression. Use `react` for a deliberate larger gesture.

`scroll Actor` ties horizontal scenery movement to that walk. The current background must explicitly declare `"loop":"mirror"` alongside its `src`. The player alternates mirrored copies to repeat smoothly. Use a wide landscape with level ground, open edges and no readable signs, unique landmarks or directional lighting that makes mirroring conspicuous. Inspect the join and reversal on a phone. Existing backgrounds remain static unless explicitly opted in. Use `scroll none` to return to a static image. Scrolling is optional; walking in place alone suits a stylized scene, not literal travel past a landmark.

## Training and recovery

```
show Hyun determined left
show Dummy neutral right
camera action Hyun Dummy cut
activity Hyun train Dummy tiring
Hyun: One more set. Then I can decide.
Hyun: My arms are getting heavy.
activity Hyun pause
look Hyun down
Hyun: I need a moment.
activity Hyun resume
Hyun: Again.
activity Hyun stop
```

`activity Actor train Target steady|tiring` repeats sword practice across dialogue, automatically equipping the sword and facing the target. The actor needs a cartoon-v1 rig; the distinct, staged target must have `"impact":"anchored"`. `steady` has brief recovery after each stroke; `tiring` includes longer recovery after every three strokes. This is practice, not combat against an unwilling character. Timed effects use the reader's existing optional sound settings.

## Interruptions and lifetime

- `activity Actor pause|resume|stop` holds, restarts or removes activity state. Paused walking holds its phase; paused training cancels its stroke and resumes with a fresh stroke. Saved progress restores activity configuration, not exact animation phase.
- Activities pause during choices, when the document is hidden, under reduced motion, at story end and through the reader's **Pause scene motion** button. Authored `react`, `perform` and `act` cues pause affected activities for that readable beat; ordinary dialogue then resumes them. For a longer reaction, explicitly pause and later resume.
- A scene change, re-staging with `show`, actor/target exit, a held `rest` or explicit `prop` change clears the affected activity. A newly started activity replaces conflicting activity on its actor or target. Start a new activity after changing equipment or staging.
- Keep action participants fully visible. Use wide or fitted action shots for practice and medium/wide for walking. Stop or pause physical work before an important facial close-up. Do not stack multiple performances on the same body.
- `perform ... repeat ...` remains a finite performance on one readable beat, canceled on Continue. Use it for a short gesture or demonstration; use `activity` for ongoing work.

## Plan and verify

In the episode's `planning.sceneActivities`, record the purpose, actor/target, activity and pace, start/stop lines, interruptions, scenery suitability and framing. An empty list is valid. A useful pattern is movement → interruption → stillness → changed movement; use it only when the story earns it.

Verify dialogue advance, choice, reader pause, hidden-tab return, reduced motion, scene exit and saved-progress resume. Inspect desktop and phone framing with the actual cast, props, scenery and audio. Do not retrofit released packages; new staging requires a new version. New packages require the activity-capable shared parser and renderer in the destination app.
