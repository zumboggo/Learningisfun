# Reusable scene beats

Story 2 supports `beat preset Lead Listener "Caption"`. The same command works in authored packages and the episode studio. The studio previews the episode’s own cast, allows replay/reduced motion and inserts after the selected script line. `/game/scene-beats` is a public rehearsal room.

```story
story 2
variable defended = false hidden
label opening
scene classroom
beat private-confession Lin Yeyul "Lin grips her notebook. Yeyul waits for her to speak."
Lin [worried, hesitant]: I let them blame you.
Yeyul [sad]: You could have told me.
beat quiet-aftermath Lin Yeyul "The empty chair between us feels like an answer."
choice answer
option admit "I say why I stayed quiet." -> honest ; defended = true
option avoid "I change the subject." -> avoided
label honest
beat reconciliation Lin Yeyul "He pulls out the chair for me."
goto finish
label avoided
beat quiet-aftermath Lin Yeyul "He leaves the chair where it is."
label finish
end
```

Presets: `private-confession`, `disagreement`, `awkward-arrival`, `reassurance`, `revelation`, `reconciliation`, `shared-laughter`, `quiet-aftermath`. The authoritative definitions are `functions/learning-content/src/scene-beats.js`.

A beat stages exactly two distinct known actors left/right, facing inward, removes other actors, sets expressions/rests and a wide camera so hands remain visible, and presents a caption until Continue. It retains the background and variables. Small listener gestures play alongside the lead’s reaction; finite gestures settle naturally. Reduced motion displays the pose without movement. Static characters retain their expression-image fallback. No generated image, audio, forced wait, automatic branch or scoring change is involved. Overrides follow the beat: dialogue, `camera`, `show`, `rest`, `react`, `act` and choices use the existing vocabulary.

The compiler expands beats deterministically with original source-line diagnostics. Saving/replay uses the existing progression step contract. Beat responses apply only to the beat caption, not every later dialogue line. Subsequent poses and framing persist until changed. Story 1 remains unchanged. Published snapshots stay immutable; changing a preset requires compatibility review just like changing an existing acting preset.

## Story craft

Start with a concrete want, a relationship under pressure and a choice with a cost. Aim for one meaningful change rather than many gestures. Use a beat at an emotional turn; leave quieter dialogue between them. Make an early object, place or promise return with changed meaning. Reuse backgrounds and existing character assets. Props in captions/handoffs are described or mimed, not newly rendered objects.

Use the existing bounded variables and `if` commands for a later acknowledgment of a choice. Keep branches short and reconnect. Do not claim that a beat itself remembers choices. For source-based episodes preserve canonical events and quotations. Preview contrasting routes and strong gestures on mobile. Lin is a girl; Yeyul is a boy.

## Studio choice and camera tools

The studio's **Choices and callbacks** workshop accepts two or three options, a responding character, immediate responses/emotions, and optional later callback lines. Insert a choice after the selected script line; select a later line after its rejoin point to insert the callback. A hidden bounded variable remembers the selection (within the four-variable maximum). IDs must be unique. Copy the displayed pending callback before leaving if it has not been inserted; it is temporary UI state. Generated reactions place the selected actor at center; review other staged actors and adjust framing as needed. The builder validates the resulting script before changing it and uses existing Story 2 syntax, not new runtime commands.

**Compare choice outcomes** follows one reachable route to a selected choice with seed 1 and shows the earlier decisions used. Each option opens a separate playable column after that option, with the actual stage and variable state. Advance columns independently to compare responses and later callbacks. If reaching a callback requires another choice, make it in that column. These previews do not save student results. This representative route is not exhaustive coverage; inspect alternate preceding choices and chance outcomes with full preview/tests when relevant. Unsupported seed-dependent paths report that no route was found rather than inventing state.

Scene-beat framing offers **Wide** or **Conversation**. Conversation generates the normal establishing beat, a medium shot with an authored speaker line, a close shot with a listener reaction caption, and a return to wide on Continue. Preview all three shots, including reduced motion. Keep large hand/body gestures wide; choose a close-up only when the face is the point. The reader controls advances; no timed cut interrupts reading. Existing one-caption beats and assigned episodes remain unchanged.

The public `/game/scene-beats` page includes a temporary practice copy of The Measure That Changed for trying choice tools. Editing it does not alter its saved assignment. Save real work through the episode studio.
