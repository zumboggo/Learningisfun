# Animated episode studio

Teachers open **The Game → Create episode**. Edit the demonstration or import a ZIP, upload images, preview, publish a fixed version, then choose a class and teaching date. The demonstration is unassigned. Existing Twine episodes retain their original rules and saves.

## Story language (versions 1 and 2)

New episodes use `story 2` and package format `2`. Existing `story 1` packages remain supported. Blank lines and lines beginning `#` are ignored. Commands occupy one line; dialogue is plain text, never HTML or JavaScript. Script identifiers begin with a letter and contain letters, digits, `_`, or `-`. Asset IDs and labels are case sensitive.

```
story 1
variable trust = 2 range 0 5 visible
variable found = false hidden
label opening
scene classroom
show Mei worried center
Mei: Someone changed my sentence.
I: I look at the noticeboard.
choice investigate
option original "I ask for the original." -> compare ; found = true, trust += 1
option talk "I hear Mei's account first." -> compare
label compare
if found == true -> evidence else question
label evidence
Mei: We can compare the wording.
goto finish
label question
Mei: We should check before we accuse anyone.
goto finish
label finish
move Mei nod
effect fade
end
```

Up to four variables may be numbers with inclusive ranges or boolean toggles. Updates use `=`, `+=`, or `-=`; separate updates with commas. Number updates clamp to their declared range. Conditions support `==`, `!=`, `>`, `<`, `>=`, `<=`; booleans only support equality. Every branch must eventually reach `end`. Loops are rejected.

- `scene backgroundId` changes the background and clears actors.
- `show actorId expression left|center|right` displays or changes a character. Expression defaults to neutral and position to center.
- `move actorId enter|exit|left|center|right|turn|nod|shake|bounce|recoil` requests a reusable movement.
- `effect fade|closeup|shake|magic` requests a stage effect.
- `chance eventId 50 -> labelA else labelB` chooses a branch with a 50% threshold, stable for this attempt.
- `goto label` and `if variable >= 2 -> labelA else labelB` control progression.
- `choice stableId` is followed by two to six `option stableId "Text" -> label` lines.
- `I: text` narrates in first person; `actorId: text` supplies dialogue.

Keep choice, option, label and chance IDs stable during draft editing. Published versions are immutable. Script validation checks names, types, destinations, reachability and endings. Preview includes label jumping and editable test variables; those debug runs never create student results.

## Package

ZIP root: `episode.story`, `episode.json`, and `assets/`. JSON holds format `1`, title, description, profile (`ap-language`, `world-literature`, `ethics`), asset definitions and exactly four quiz questions. Each question has `prompt`, four `options`, zero-based `answer`, and `explanation`. Source records belong in `sources`.

Asset definitions contain backgrounds indexed by script ID and characters indexed by script ID. A character has `name`, `version`, `provenance`, and an `expressions` map with at least `neutral`. Each image entry has `src`. The app stores embedded WebP data URLs; exported ZIPs use relative asset paths. Optional music uses MP3 or Ogg. Each episode's content and decoded-from-base64 asset bytes must be below 5,000,000 bytes. Shared runtime code is excluded. No remote or executable asset URLs.

The built-in cast consists of Mr. Hepting (adult teacher), Mei, Lin and Yeyul (Grade 11 classmates). Students wear the CDIS red polo with white piping and navy trousers. The mascot is a panda. The illustrations are fictional designs, not likenesses. Expression images use a common transparent 240×370 canvas and baseline. Uploaded images can be scaled and vertically aligned before adding them. Whole-character movement requires no limb rig. Missing expression images fall back to neutral at display time; undefined authored expressions are flagged before publishing.

## Codex commands

```
node scripts/story-package.mjs check public/stories/animated/demo.json
node scripts/story-package.mjs zip public/stories/animated/demo.json /tmp/episode.zip
node scripts/story-package.mjs publish /path/to/episode.json
```

Publishing uses the same authenticated function actions as the editor. Supply `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `STORY_TEACHER_JWT`, `STORY_ID`, and `STORY_REVISION` through an existing private environment. Optional `STORY_CLASS_ID` and `STORY_DATE` assign after publication. Never store credentials in the package. A published but unassigned version is not student access.

## Deployment

Provision private storage with `scripts/setup-animated-storage.mjs` using the existing setup environment, then deploy learning-content before the frontend. Metadata uses the existing function-only episode_records collection; package files live in the private animated-episodes bucket. Backend operations validate class membership and release dates, replay story choices with a server seed, and recompute quiz scores. Story variables do not earn quiz points. Every correct answer earns 25; 75 permits completion, with review/retry otherwise. Start an attempt online; a previously opened attempt can continue offline and synchronize on reconnect.

Draft saves use immutable revision IDs to reject competing saves. Publication pins the package file. Assignments are idempotent per class/version/date. Default release is Friday 08:00 Shanghai preceding the assigned week. Account-scoped local drafts and play caches provide recovery; export a ZIP if device storage is full.

## Shared puppet acting

See [the curated acting library](episode-acting-library.md) for the only supported emotions, rests, talking gestures, responses and camera shots. The studio previews/inserts these cues and offers the reusable Lin rig. `story 2` accepts tagged dialogue, `rest`, `react` and `camera`; static supporting characters still work. Try the unassigned `/game/acting-demo` route. The checked-in Last Chair package demonstrates Lin; the earlier published assignment stays pinned to its original version.

## Two-character action beats (acting library v2)

`act Quixote attack Carrier "Quixote strikes; the carrier reels back."` creates a standalone beat. First show the actors at left/right (or distinct positions). Use the studio’s **Acting library → Action choreography** to preview and insert one of ten actions. Captions provide the action’s meaning for reduced-motion and screen-reader users. Blocked and dodged attacks have authored outcomes; choreography does not change variables or quiz scores. Save/replay records the action beat with a normal null advance. Resume never repeats the action. The camera widens during the action and returns to the scripted framing afterward. Actions return actors upright to their marks; props are mimed.

The unassigned **Quixote · two-character action** rehearsal at `#/game/acting-demo` demonstrates a chapter 3 excerpt with local replies that reconverge before the same source event. It does not replace any assigned episode. Source and scene limits appear above the player.

## Optional simulation scorecard

A package may include `simulationScore: {categories: [{variable, label, description}]}` to display a separate equal-weight total from up to four existing zero-based numeric story variables. Category scales come from their declared maximums. Metadata is presentation only; the shared engine continues to replay and validate variable updates. It never changes quiz points, server results or rankings. Invalid references suppress the scorecard. Existing packages without metadata retain their meters and behavior.

The Second Ship demonstrates seven decisions and four categories. The closing card explicitly says the total measures success under the game's stated priorities, not objective moral goodness. Local previews offer a full reset and compare the previous completed route in memory; leaving or reloading clears comparisons. Account-backed attempts retain the host's existing replay/save behavior. No past package or attempt is rewritten.

## Choice keepsakes and memory scenes

Optional `keepsake: {title, revealAt, choices: [{id, label}]}` metadata displays selected option texts at and after a named label. The player reconstructs choices from the saved legal steps; it stores no extra story variables. Up to twenty listed choice IDs are supported. The downloadable text sheet follows the selected choices, and starting a fresh replay clears them. COMEBACK OR ELSE uses seven lyric preferences. This presentation does not change assessment.

A background entry may opt into `vignette: "memory"` for a static white edge haze above the scene. It never covers dialogue or intercepts clicks, survives reduced motion, and disappears when the background changes. New `rubber-duck` and `pool-noodle` props use the shared cartoon-v1 hand/gesture system; explicit captions explain mimed first-person contact. Existing props, saved scripts and scores are unchanged.

## Shared magical-taxi cutscenes

Taxi episodes use the approved 10-second arrival and departure videos by default. See [the authoring workflow](create-episode-skill/references/magical-didi.md). New scripts place `label taxi_arrival` and `label taxi_departure` immediately before their respective narration beats. StoryPlayer shows the shared movie at that beat; completion or skip records one ordinary legal advance. Existing Last Chair and COMEBACK OR ELSE scripts are recognised automatically, including account-backed packages and previews. Other journeys are unchanged.

The four archived Own English versions show both clips as a boarding introduction on a fresh attempt. Continuing a saved attempt bypasses that introduction. Their original released files, saved choices, teacher text-patch keys and scoring remain intact; the host displays generic taxi wording.

Media lives at `public/stories/shared/magical-taxi/` with versioned MP4s, posters, captions and provenance, outside the immutable package limit. Videos load only after Play with sound or Play silently; native controls, textual descriptions, captions, skip and an error fallback keep the story playable. Hiding or leaving pauses playback. Movies are not service-worker precached. No backend schema or publication migration is needed.
