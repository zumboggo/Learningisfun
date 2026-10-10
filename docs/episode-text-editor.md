# Teacher episode text editing

The Game opens with class choices for teachers. Choose a class to see its episodes in a keyboard-scrollable list; All classes returns to the choices. Student libraries retain their assigned-episode behavior.

Inside a running teacher preview, select **Edit text**, click a passage’s wording (or choose it in **Text on this page**), and select **Save for this class**. **Done editing · resume play** re-enables story navigation. Restore original wording fills the edit box with the shipped text; Save publishes the restoration. Failed saves retain the draft. A conflicting save requires reloading the latest shared text before retrying.

Edits are scoped to class, episode, and version. Students receive them when opening the episode, with a local cache for unavailable connections. Plain text replacements preserve inline formatting, link handlers, choice IDs, game rules, numerical scores, and AI assessment criteria. Story source and student writing are excluded. New source wording or changed passage structure produces a new key, so an old edit cannot silently override rewritten source.

`episode-text.js` uses the existing private `episode_records` collection. Only the owning teacher/admin can save; students need active membership and released-episode access to read. Immutable revision IDs prevent concurrent overwrites and preserve history. The current snapshot is limited to 28,000 characters within the existing 30,000-character field. This is intended for small wording corrections; structural story or scoring changes still require a source update.

The shared `EpisodeTextEditor` component is attached to the Teaching Stone and all released/archived Own English player versions. New iframe-based episode players should attach it with their authorized preview flag, iframe ref, class ID, episode ID, version, and frame identity. Register those episodes in the catalog so backend access checks apply.

Validation covers server ownership, student reads, conflicts, restoration, plain-text injection safety, live-region passages, loading-screen transitions, failed draft preservation, offline behavior, navigation, and class selection. Browser checks use the real compiled stories with an isolated test save service; they do not alter production wording.
