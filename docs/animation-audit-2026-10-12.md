# Character and animation audit — 12 October 2026

Scope: shared cartoon renderer, acting library, new-character authoring and The Last Chair. Jordan is absent from the current script; he is now a reusable animated library character. The episode retains its simpler Lin/Hepting conversation structure.

## Findings and changes

| Finding | Change |
| --- | --- |
| New identities required editing application/build code and a hardcoded selector | One cast recipe file, generated catalog, shared validated factory, studio character builder and CLI |
| Adding a character to another class was unnecessarily tied to image uploads | Import/export the same small JSON recipe; the renderer supplies neutral poses and every expression without bitmap limbs |
| Preview emotion changes left the previous resting/talking gestures selected | Emotion now selects the same automatic acting as the player; overrides remain available |
| Repeated preview clicks did not reliably restart a performance | Explicit performance key and reset timers |
| Preview did not follow reduced-motion preferences | Live preference listener passed to the actor |
| Breathing used the same starting phase; the old short name hash could synchronize blinks | Character-specific breathing offsets and a better deterministic phase hash |
| Surprised and skeptical faces were difficult to distinguish | Distinct surprised mouth and iris treatment; reduced skeptical iris height |
| Automatic insist gestures had the wrong hand shape unless explicitly authored | Hand shape now follows the resolved automatic gesture |

## Visual conclusions

Wide views make faces small; use medium for normal conversation and close for consequential reactions. The continuous arms remain attached during large gestures, but their curved silhouette can still feel rubbery. Keep large gestures sparse. The fixed common anatomy remains more maintainable than individually rigging each new character. Hair, glasses, colours and clothing distinguish the cast, although teen faces still share a similar shape.

Next improvements, in priority order:

1. Add a few authored listening reactions and motivated camera changes to important beats. Avoid putting a gesture on every line.
2. Add shared face-shape and costume modules (including historically appropriate robes/tunics) to the same validated recipe system. This offers more useful variety than more animation loops.
3. Refine elbow curvature and wrist follow-through with a small shared motion test scene; retain connected limbs and grounded feet.
4. Give backgrounds the same restrained illustrated style as the cast. Photographic/painterly rooms and flat vector actors currently read as different visual layers.
5. Later, introduce speaker-directed eye lines when two people share the screen. Keep this automatic and reversible, with reduced-motion support.

No generated video, per-character rigs, live AI dialogue or class-specific animation code is needed. Published episode content and student outcomes are not rewritten by this audit.
