---
name: create-episode
description: Create, revise, package, publish and assign animated classroom story episodes in Learning is Fun for Ethics, AP Language or World Literature, and reusable character packs. Use the shared Story 2 format; maintain Twine only for already released episodes.
---

# Create Episode

Use Learning is Fun's native animated player and teacher studio. Follow scope: ideas/drafts do not authorize publication or assignment. Inspect the current checkout and AGENTS.md first.

Read [narrative craft](references/narrative-craft.md), [curriculum sources](references/curriculum-sources.md), the relevant class reference, [integration](references/app-integration.md), and [Story 2 format](references/story-format.md). Read the assigned texts and weekly vocabulary. Discover class/section, date/year and reading boundary from current material; ask only for materially missing information. Keep Canvas course IDs separate from app class IDs.

Use Dan Harmon's Story Circle as the dramatic spine and Lisa Cron's motivation and cause-effect principles. Write a warm, humorous, short-beat first-person adventure with a concrete student role. Learning works through the story's evidence and actions. Aim for 8–12 minutes plus the quiz, usually five to seven meaningful choices. In decision-led adventures, two or three may be major commitments. In literary adaptations, prefer brief local choices that affect replies, humour, attention or the next beat while reconverging before fixed source events. No fixed class-specific decision quota. Integrate weekly vocabulary naturally; otherwise call items episode concepts.

Every new episode ends with four knowledge MCQs, 25 points each, three correct required with review/retry. Narrative variables and fortune earn no learning points. Writing is optional or separate for all classes. Preserve independent Ethics portfolio work. The student survives, consequences remain within the episode, and other characters may face serious context-appropriate outcomes without graphic spectacle. Preserve canonical events and actual source quotations.

## Format and assets

Use one .story script/package for both Codex and Game → Create episode. Support up to four bounded numerical variables or yes/no toggles, individually visible or hidden. Reconnect branches, preserve stable IDs, and validate using the shared parser. Published versions and old attempts remain immutable.

Use the reusable hybrid graphic-novel cast: adult Mr. Hepting and Grade 11 classmates Mei, Lin, Yeyul and Jordan. David’s standing art preference is hybrid for the recurring cast and polished SVG for all newly created characters unless he requests otherwise. Reuse existing illustrated heads; do not generate new head artwork for each episode or emotion. New characters use the shared builder’s polished SVG default, without an image-generation step. CDIS students wear red polos with white piping and navy trousers. The mascot is a panda. Illustrations are fictional designs, not student likenesses. Keep a common displayed height and baseline, generally one clear speaker at a time. Stage two characters together when their exchange or physical action is the point; do not reduce a confrontation to a narrated report. See [character prompt](references/create-character.md) and [shared character standard](references/character-standard.md) for new figures. Use validated appearance presets for vector characters; use imagegen for new bitmap artwork, verify alpha/alignment and compress WebP. Record provenance.

New packages must stay below 5 MB including all referenced images/audio, excluding shared runtime. Optional music starts off. No generated video, TTS or live AI dialogue. Keep the Teaching Stone for Ethics, magical Didi for AP, and one-question journal for World Literature. Use one fiction disclaimer and Accept button; no recurring fourth-wall labels.

## Acting and framing

Read [the curated acting library](references/acting-library.md) before writing, then check the current app’s `functions/learning-content/src/acting-library.js` and generated `docs/episode-acting-library.md`. The live exports (`EMOTIONS`, `AUTO_ACTING`, `TALKS`, `RESPONSES`, `ACTIONS`) are authoritative if the bundled reference is older. Use only its supported emotions, resting poses, talking gestures, responses, moves, coordinated `act` action beats and camera settings. Do not invent animations or imply that static artwork has articulated joints. Lin, Mr. Hepting, Mei, Yeyul and Jordan have reusable manga-inspired `cartoon-v1` packs. Create characters through the shared JSON recipe or studio builder; export/import recipes between classes. Keep each identity distinct using shared face shapes and appearance options, including tunic/robe costume bases for historical settings; follow the character standard. Read [background style](references/background-style.md) when adding scenery. Use the polished SVG finish of the shared vector rig for new articulated characters; preserve raster `teen-v1` for old packages. Keep one consistent face/body style, continuous limbs, grounded idle movement and finite coordinated gestures. Reuse the same acting vocabulary for future characters. Let emotion choose automatic acting; add sparse intentional gestures and wide/medium/close shots for story emphasis. Use `story 2` / package format `2`. Keep already published Story 1 and Twine attempts unchanged.

### Choose acting that tells the story

Plan a few visible emotional turns and physical interactions while outlining each scene. Draw from the full available library instead of defaulting to neutral dialogue or narrating every reaction. Match intensity to the moment: shocked hands at the cheeks, angry clenched-fist emphasis, belly-holding laughter, excited raised hands, a scared recoil, frustrated facepalm, proud posture, pleading hands or disappointed slump. Let quieter listening separate emphases; do not fire every animation on every line or impose a gesture quota.

Emotion names and gesture names differ: use `shocked` → `shock`, `angry` → `rage`, `laughing` → `laugh`, `frustrated` → `facepalm`, and `pleading` → `plead`. Prefer automatic emotion acting; use an explicit `react` for a deliberate silent beat or override. For example, `Lin [shocked]: That was our taxi!` selects the coordinated expression, whereas `react Lin shock` requests the gesture. Use `act` only with the exported action names: `laugh` and `shock` are gestures, not `act` actions.

Use coordinated actions when bodies interacting matter: `give` for a mimed handoff, `challenge` for a confrontation, `bow` or `cheer` for a social beat, and the supported attack/block/dodge outcomes only when the source event calls for them. Stage both actors before paired actions and keep canonical outcomes fixed. Frame hand/arm acting wide or medium so wrists, belly holds and raised hands remain visible; reserve close-ups for facial emphasis. Preview the chosen character and cue at the actual framing, including reduced motion, and validate through the shared parser. A written stage direction alone is not a rendered animation.

## Reusable scene beats

Use [scene beats](references/scene-beats.md) for emotional turns and quick staging. Read the current `scene-beats.js` definitions; use `beat preset Lead Listener "Caption"` only in Learning is Fun Story 2. Each beat stages exactly two characters and holds a caption for Continue, with expressions, listener reactions and framing. Lin is a girl; Yeyul is a boy. Preview the chosen pair in the studio, including reduced motion. Keep quiet dialogue between beats. Plan a concrete want, a relationship under pressure, a costly choice and one meaningful change; use existing variables for a later callback. Reuse an earlier detail with changed meaning. The preset supplies direction, not a generated story or automatic consequences.

Use the studio’s Choices and callbacks workshop to generate short reconnecting branches and optional later acknowledgments. Compare option outcomes from a real reachable state, then inspect relevant alternative histories. Scene beats offer Wide or Conversation framing (pair → speaker → listener); preview every shot and use wide for large gestures. See the scene-beats reference for insertion, variable limits and temporary preview behavior.

## Three writing passes

Apply the [opening check, choice–response–callback plan, and scene-trimming pass](references/narrative-craft.md#three-writing-passes) on every new episode or substantial story revision. Introduce the promised problem early, make each choice produce a distinct response, and remove beats that neither change the situation nor earn an emotional pause. Use a compact authoring plan and the existing Story 2 commands; these checks do not require new assets or runtime features. Preserve source events, reading clarity, student agency and separate knowledge scoring.

## Verify and deliver

Follow [efficient authoring](references/efficient-authoring.md). Validate script and quiz, preview contrasting routes, source fidelity, mobile/desktop access, resume and quiz retries. Use authenticated publishing and exact class/date assignments only as authorized. Follow repository checks/master publishing instructions and report actual verification limits. Do not create Canvas assignments or post grades without separate authorization.

Deliver playable link or unassigned package, class/date if assigned, size and validation. Updating this skill does not itself authorize assigning a new episode.

## Legacy maintenance

Released Twine episodes retain their original saves, scoring and writing. Read references/legacy only when maintaining those versions; the archived requirements never override the new Story 2 workflow. Do not migrate the back catalogue during routine authoring.
