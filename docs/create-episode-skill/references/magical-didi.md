# Magical taxi — approved shared cutscenes

David approved the two reusable 10-second cinematic anime taxi clips on October 23, 2026. Use a generic magical taxi/rideshare, not DiDi branding. Reuse these clips by default whenever an episode includes this journey; do not regenerate or embed copies in each package.

The production app hosts `stories/shared/magical-taxi/arrival-v1.mp4` and `departure-v1.mp4` under its base URL. The clips have synchronized English audio, matching posters, English VTT captions, and a provenance manifest. Mr. Hepting has short brown hair, a full beard, blue plastic aviator glasses and a dark navy short-sleeved polo.

- Arrival: taxi emerges through a classroom-wall vortex and parks. The stocky Chinese driver gets out in sunglasses. Hepting asks “Ready to go?”; the driver replies enthusiastically “Let’s go!”
- Departure: taxi emerges from the fourth floor of the middle CDIS building near the red stripe, banks in a broad arc over the soccer field, revs up and shoots into a second vortex. Both vanish; the field is quiet again.

For new Story 2 episodes, put `label taxi_arrival` immediately before a readable narration beat at the classroom arrival, and `label taxi_departure` immediately before the outbound field-flight narration beat. Leave destination-specific instructions and dialogue after those beats. The shared StoryPlayer substitutes the approved clip for that narration beat and records the same normal null advance on completion or skip. Do not use the departure clip for the homeward trip. Existing Last Chair and COMEBACK OR ELSE packages are recognised without modifying their immutable bytes; archived Own English versions use a shared boarding introduction.

Playback is deliberate, with sound or silent controls, captions, a text description and skip/failure fallback. No video autoplay or background movie download. Reduced-motion users can skip or deliberately play. Media stays outside the 5 MB immutable episode package and saved attempts/quiz rules are unchanged. The serious sunglasses driver still gives four knowledge questions; three correct pays the fare, with review/retry preserving progress.

World Literature uses the journal and Ethics the Teaching Stone unless David explicitly requests a taxi journey. Other custom video generation remains opt-in. Old detailed contracts are archived under legacy/.
