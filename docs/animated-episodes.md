# Animated episode studio

Teachers open **The Game → Create episode**. Edit the demonstration or import a ZIP, upload images, preview, publish a fixed version, then choose a class and teaching date. The demonstration is unassigned. Existing Twine episodes retain their original rules and saves.

## Story 1 language

The first line is `story 1`. Blank lines and lines beginning `#` are ignored. Commands occupy one line; dialogue is plain text, never HTML or JavaScript. Script identifiers begin with a letter and contain letters, digits, `_`, or `-`. Asset IDs and labels are case sensitive.

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
