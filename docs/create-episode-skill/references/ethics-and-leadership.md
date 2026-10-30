# Ethics and Leadership

Use the Teaching Stone to enter a historical problem with understandable competing demands. Preserve facts and give the student meaningful agency without guaranteed favourable results. Introduce philosophical ideas through affected people and action.

New episodes use generally five to seven choices, two or three major commitments; remove the ten-decision quota. Four knowledge MCQs provide the learning score, independently of chance or agreement with a preferred moral stance. Writing does not gate the game.

## Knowledge and weekly Decision Note

Use exactly THREE short written answers in the Ethics-only Principles Portfolio. Keep these first two questions unchanged across all Ethics episodes:
1. **What should the character do? Why?** Support: “They should ___ because ___.” Ask for one episode detail.
2. **Why might someone choose differently?** Support: “Someone might choose ___ because ___.” Ask for a reason worth taking seriously.
3. **Student chooses ONE question from a dropdown containing exactly three episode-specific possibilities.** Author all three possibilities for each episode; students answer only their selected one.

One or two short sentences per answer are enough; no essay or word quota. Use simple, concrete language. Choose three distinct philosophical moves suited to the episode: test a supplied change of circumstance (“What if…?”), distinguish concepts (brave/reckless, equal/fair), weigh competing reasons, examine intentions versus outcomes, or identify information needed before judging. Use the actual dilemma and characters; avoid generic repetition, comprehension checks, multipart abstract tasks, or a teacher-preferred conclusion. One option should support the selected standards focus; never alter the two fixed questions. A student may keep, qualify or change a judgement with reasons.

For Learning is Fun, register the three strings under the exact episode ID in `functions/learning-content/src/ethics-notebook-questions.json` (`options`). This shared registry drives frontend and backend; do not edit immutable story packages merely to change portfolio prompts. Verify exactly three distinct options, saved selection, reload/account sync, teacher reading and text export. The chosen prompt and options are stored with the response, so later authoring changes cannot relabel saved work. The generic runtime fallback is for resilience, not a substitute for authoring episode-specific questions.

When retrofitting, inspect live saved answers across the Ethics class before changing a question set. An episode with any existing answers retains its original format for everyone: record its exact ID in `legacyEpisodes`. Preserve device-only answered legacy notebooks as well. Empty, unsubmitted notebooks may adopt the new format; never reinterpret or delete existing answers. Rerun the read-only preservation check immediately before deployment. Future Ethics episodes use this three-answer format by default. Do not apply it to AP, World Literature, English Corner or Chinese episodes.

Develop a transferable principle and a counterexample during occasional synthesis across episodes or the fortnightly presentation, rather than requiring both after every episode. Preserve original responses for later reconsideration.

Default assessment is completion with revision: relevant attempts at the two fixed prompts and the selected third prompt, with a specific detail, not agreement or polished English. Use whole-class feedback for common difficulties. Writing remains separate from gameplay and never gates the game. Use supported app writing features only after checking integration; otherwise deliver a companion prompt sheet. Do not invent runtime fields or require duplicate transcription into Canvas. Vocabulary deck responses remain diagnostic/formative; this skill does not change vocabulary quiz grading.
