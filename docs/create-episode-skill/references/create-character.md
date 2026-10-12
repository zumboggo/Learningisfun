# Create episode character

## Current default: simplified cartoon rig

Use Lin character version 4 in `public/stories/animated/rigs/lin-cartoon.json` as the reference. It uses `rig: {version: 2, preset: "cartoon-v1", style: "manga", palette: {skin: "#eac09c", hair: "#293338", shirt: "#b93f46"}}`. The complete figure, face, hands and continuous arms share one vector style. Palette accepts only those three six-digit hex colours. A palette change alone does not create a distinct character: new hair, face or clothing geometry requires an intentional shared-renderer extension and visual review. Do not claim the studio supports arbitrary new cartoon anatomy yet.

Preserve the red CDIS polo and teenage proportions for classmates. Let one finite gesture prepare, emphasize, hold and settle; do not add repeating arm pulses or a large circular talking mouth. Preview a short conversation at wide, medium and close framing before accepting a skin. Do not generate separate bitmap limbs for the new cartoon preset. Read acting-library.md and use only its closed cue list.

## Legacy raster packs

The following atlas workflow is only for maintaining existing teen-v1 artwork, not the default for new characters.


For articulated characters, use the shipped Lin rig as the visual and anatomical reference. Read [the acting library](acting-library.md). Reuse `teen-v1`; do not add character-specific animation names. Lin is currently the only supplied articulated skin. Existing flat packs remain valid fallbacks.

Imagegen prompt:

“Create a transparent production puppet-parts atlas for [fictional character name and appearance], matching the supplied Lin reference’s graphic-novel inks, shading and slender Grade 11 proportions. CDIS students wear a red short-sleeved polo with white piping and navy trousers. The teacher is an adult. No actual student likeness. Use a generous, non-overlapping 4×4 grid: row 1 torso, pelvis, head, empty; row 2 left upper arm, left forearm, right upper arm, right forearm; row 3 left hand, right hand, left thigh, right thigh; row 4 left shin with shoe, right shin with shoe, empty, empty. Arms hang straight down in neutral local coordinates. Head includes hair, ears and neck, with a smooth blank face: the runtime draws eyes, eyebrows, nose and mouth. Hidden rounded overlap extends past every joint. No cast shadows, labels, scenery or assembled figure. Real alpha transparency; consistent scale and identity.”

Inspect every extracted part for neighbouring-cell contamination and intact joint overlap. Save the exact 13 transparent WebP parts named in acting-library.md. Reuse the fixed 240×600 SVG skeleton, common feet baseline, head placement and face overlay. Test neutral, guarded, explain, wave and recoil at wide and close framing before accepting the pack. Do not claim arbitrary body proportions fit without inspecting them. Record prompt, date, reference and fictional-design provenance. Package character metadata includes name, version, provenance, neutral expression fallback, and `rig: {version: 1, preset: "teen-v1", parts: {…}}`. Import via episode ZIP; all referenced parts count toward the 5 MB limit. Copy Lin’s build script as the packaging pattern, changing skin assets rather than runtime logic.

For an intentionally static supporting character, generate aligned full-body expression images using only the shared emotions. A neutral image is required; unavailable expressions fall back to it. Static characters support whole-character moves but not articulated arm gestures.

Lin now uses the optional `manga` style: layered bangs, almond eyes with iris highlights, small mouth shapes and restrained cel shading. Preserve continuous vector limbs and the finite gesture timings. Omitting style retains the original simple cartoon face for existing packs.
