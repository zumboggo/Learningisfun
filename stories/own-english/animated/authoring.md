# The Last Chair

Native replacement for the current AP Language episode, 13 October 2026, app class `88421c66-9cda-4002-8e15-086312b7805e`. The old Twine versions remain accessible at their original URLs with their original attempts and scoring. This is a new native assignment, not a conversion of student responses.

## Source and learning

Read and visually checked Young's full essay, printed pp. 110–117, on 12 October 2026: https://artsci.tamu.edu/english/_files/_documents/research/use-they-own.pdf. The following article is outside the reading boundary. Young's arguments are paraphrased; no invented dialogue is attributed to him. The Chicago workshop, Lin's drafts, magazine policy and events are fictional. Do not equate Lin's school experience with the racial history in the essay.

Retained objective: answer an objection while advancing a claim. Weekly vocabulary verified against the local `vocab-presentation/assets/CORE_VOCAB_BY_WEEK.txt`, AP W09, October 12–16: line of reasoning, sophistication, emphatic positioning, rhythm, coherent, evoke. These all do work in the story. The editor's unfamiliarity objection is answered through a concrete revision, not a lecture. The quiz distinguishes code-meshing, concession with response, emphasis, and Young's account of language prejudice. Each is worth 25 points; three correct permits completion. No required writing or narrative score.

## Dramatic plan

Harmon: You—Lin's submission partner; Need—a publishable piece that preserves its purpose; Go—Didi through the classroom window and the soccer-field rift; Search—reader notes or Young's response to Fish; Find—a revised opening and answer to the editor; Take—printer jam or early display closure and lost opportunity; Return—submission sent, Didi waiting with the four-question fare; Change—helping someone write means explaining tradeoffs and preserving their agency, not guaranteeing approval.

Cron: Lin's earlier experience of rehearsing speech until lunch ended makes erasure of her family's invitation feel like renewed exclusion. Her desire for a first byline pulls against that fear. Cause → interpretation → action → consequence appears in both the language edits and her last-minute request that the protagonist press Send. The student can support her differently without the game imposing a moral belief.

Seven choices on every route: what to protect, where to investigate, opening structure, emphasis, public/private response, handling a production setback, and how to support Lin's final decision. The opening, public/private reply, and production response have explicit costs and consequences. Four hidden variables prevent a visible relationship score from suggesting a morally correct path. Stable chance changes the production difficulty without affecting quiz scores. The editor considers the submission; approval is not guaranteed. Consequences are confined to the episode. The student survives.

Runtime target: 8–12 minutes of reading/choices plus quiz. One or two sentences per beat. Lin is the main interlocutor; Mr. Hepting appears briefly before travel. The driver speaks through first-person narration and the quiz prompts. No lecturer, Jordan, or second student needing advice.

## Art

Reuse the versioned illustrated cast (adult Hepting and Grade 11 Lin), classroom and existing university workshop backgrounds. Lin wears the CDIS red polo. Mascot is a panda, not needed in this plot.

New built-in image generation, 12 October 2026; source image `exec-2f197be9-358b-43f8-9ad9-8a03097c858e.png`. Published asset: `public/stories/own-english/animated/rift.webp`, resized/compressed to WebP. No new character likenesses.

Prompt: “Use case: illustration-story. Create a wide 16:9 graphic novel background for a school interactive fiction game. Cinematic view from slightly behind a magical silver taxi floating just above a school soccer field toward a luminous turquoise and gold rift in spacetime. Rectangular soccer goals and school building below, curling glowing ribbons and fragments of old printed pages around the rift, through the opening a warm early-2010s brick university building can be glimpsed. Crisp ink contours, richly painted cel shading, inviting adventurous mood, no people, no words, no logos, no watermark. Keep center foreground relatively open for game dialogue and a character overlay. This is the CDIS class's magical Didi travel sequence; an illustrated fictional school, not an architectural reconstruction.”

## Rebuild and verify

Run `node stories/own-english/animated/build.mjs`, then `node scripts/story-package.mjs zip public/stories/own-english/animated/episode.json public/stories/own-english/animated/the-last-chair.zip`. Build checks enforce source/package consistency. The editor can import that ZIP unchanged.

Automated route test visits 512 complete runs across four seeds: all seven decisions, both chance outcomes, conditional endings, authoritative replay equality, and quiz scores. ZIP imports through the actual editor importer. Desktop and 390-pixel phone preview checked for opening, choices and magical travel. Package size: 478,558 bytes (content plus decoded images), below the 5 MB limit.

## Lin acting upgrade — 2026-10-12

The checked-in source/package now uses Story 2 with Lin character version 2, teen-v1 articulated parts and automatic acting. The public unassigned acting preview uses this package. The publication receipt describes the earlier immutable assigned Story 1 release; this presentation experiment does not replace students’ pinned attempts or create a second class assignment. Rig provenance is in public/stories/animated/rigs/lin-v1/README.md.

## Continuous cartoon Lin — 2026-10-12

The unassigned preview now uses character version 3 (`cartoon-v1`), drawn entirely in SVG with one consistent outline and palette. Continuous curved arms replace raster elbow/wrist joins. Speaking gestures have a finite preparation/emphasis/hold/settle sequence; the head follows slightly later. Breathing expands the chest subtly while feet remain planted. Small mouth shapes include pauses. A 20-second rehearsal on `/game/acting-demo` demonstrates listening, questioning, celebration, hesitation and reassurance. No generated bitmap artwork was added for this revision. Previously published packages and the legacy raster renderer remain available.

Lin character version 4 adds manga-inspired vector eyes, layered hair and subtle cel shading (`style: manga`) while preserving the continuous-limb animation. Existing cartoon packs without the style flag retain their simple design.
