# Ethics and Leadership

Use the Teaching Stone to enter a historical problem with understandable competing demands. Preserve facts and give the student meaningful agency without guaranteed favourable results. Introduce philosophical ideas through affected people and action.

New episodes use generally five to seven choices, two or three major commitments; remove the ten-decision quota. Four knowledge MCQs provide the learning score, independently of chance or agreement with a preferred moral stance. Writing does not gate the game.

## First-person student journey

Every new Ethics episode takes place in first person: the learner enters as themself, with “I” narration and choices describing their own words and actions. This overrides the shared Kevin-as-protagonist default. Do not impose Kevin’s name, gender, appearance or biography on the learner; an off-screen viewpoint needs no student avatar.

The learner is transported alone into the new situation. Kevin may appear in a brief optional classroom conversation that foreshadows the coming dilemma through a related everyday problem, question or disagreement. He and the teacher stay behind; neither accompanies the learner, supplies answers remotely or makes the learner’s decisions. The taxi driver provides transport, not a companion who resolves the destination’s problem. Retain the Teaching Stone, question-writing summons and approved travel clips.

Give the learner a concrete role among the people they meet, an immediate purpose, and responsibilities that put their own choices under pressure. Their decisions must have visible consequences for actions, relationships, trust, information shared, help offered or duties undertaken. Carry important commitments into later responses and the payoff; a new line followed by an identical experience is not sufficient agency. Local characters retain their own motives and ability to disagree.

For historical episodes, preserve documented events while making the learner’s participation and its consequences matter within that boundary. Do not credit them with causing a recorded outcome they could not have caused, or reduce them to an observer who merely selects opinions. In the outline, identify what each major choice can change and show its consequence in playback. Preserve released versions and saved attempts unless a revision is requested.

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
