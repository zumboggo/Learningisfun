# Cinema Stage

Native assigned episodes and public Story 2 previews use the selected Cinema Stage layout. The editor, acting rehearsals and legacy iframe players retain their existing layouts. Episode packages, authored camera cues, SVG rigs, legal step IDs, scoring and save records are unchanged.

The browser-window canvas has a slim toolbar, a flexible scene and a lower decision console. Two or three choices use one row; four to six use two rows. Complete option text wraps naturally. Number keys 1–6 activate the corresponding legal option; repeats, modified keys, typing, open sound settings and modal panels do not select choices. Existing click and keyboard-focus operation remains available.

The scene yields height to text before text is clipped. At ordinary laptop sizes the complete decision fits without scrolling; very small windows and magnified text can scroll instead of losing content. Phones stack choices vertically. Quiz pages, writing and history intentionally have their own scrolling areas. No font-size measuring loop, per-frame resizing or content truncation is used.

History, Notebook and Episode menu use native modal dialogs, with focus containment, Escape and focus restoration. Opening a panel does not advance the story or replace its saved progress. The existing notebook owns its normal save/flush behaviour. Sound remains off by default. The toolbar motion control pauses idle/activity motion and transient choreography; reduced motion still applies independently. Native fullscreen is optional: the cinema already fills the browser window without a fullscreen permission request.

## Verification — 2026-10-22

- Actual compiled browser layout at 1366×768, 1280×600 and 1024×600: zero decision-content overflow; every full option inside the viewport. Normal short-laptop choice text is 17px; standard laptop text is 18px.
- Dinner with the Tyrant first decision, longest existing three-option decision (COMEBACK OR ELSE), and a six-option fixture using that long text. Six-choice bottom edges were 748px at 768px height and 586px at 600px height, with no clipped text.
- A 115-word dialogue beat fits at 1024×600 with Next visible and no content overflow.
- 390×844 phone layout, history open/close and Escape, numbered selection, paused motion and sound settings checked in the browser. Shared tests cover reduced motion, choreography and saved replay.
- New interaction tests cover numbered legal choice saving, modal focus return, no shortcuts while writing or in a modal, toolbar motion, fullscreen exit, and the existing five-question notebook through its new toolbar entry point.
- The temporary browser stress package is generated only into ignored `dist/`, then removed by the final production build. It is never published or assigned.

No backend deployment or episode republication is required. Publish through the repository's standard checks and production Pages workflow.
