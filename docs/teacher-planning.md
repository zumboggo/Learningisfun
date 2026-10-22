# Teacher Planning integration

The Brainstorming tab opens the editor at `#/brainstorming`, beside the existing Planning tools. It is available to students, teachers and administrators through the existing login. Students open it using the last tab in their floating navigation, labeled **Planner**. The editor retains its A4 template, row/card dragging, named boards, CSV import/export, spreadsheet clipboard copy, PDF download and JSON backup/restore. Existing Brainstorming JSON exports can be restored without replacing current boards.

The React host embeds the editor with `srcDoc` to isolate its stylesheet and preserve the print layout. There is no separately hosted editor or login. Requests from that specific frame are forwarded using Learning is Fun's existing Appwrite SDK session. Navigating away, signing out or switching accounts destroys the frame and its bridge; responses for an unmounted account are discarded.

Local libraries and device identifiers are scoped by account ID. The existing PWA caches the bundled editor for offline use. Local browser data is unencrypted, like the rest of the app's offline storage: device/browser access should be limited to trusted users.

The dedicated `teacher-planning` Appwrite function checks the authenticated request's user ID and existing student/teacher/admin profile. It never trusts a client-supplied owner or document ID. It uses a new `brainstorming/teacher_libraries` collection with no collection-wide permissions, document security enabled, and owner-only read permissions. All writes go through the function. The function uses a dynamically scoped Appwrite key; no API key is bundled into the frontend.

Cloud backups are separate for each account/device. Changes automatically save locally and back up online. “Saved devices” lets a teacher restore another device's boards additively, or delete an older device backup. This deliberately retains the original snapshot workflow rather than silently overwriting work across devices.

## Deployment

1. Reconcile these changes against the latest `zumboggo/Learningisfun` master. This release was integrated with production commit `63d3e55`. Preserve other local work.
2. Run `npm test` and `npm run build`.
3. Provision and deploy the isolated backend with `node --env-file=$HOME/.config/learningisfun/appwrite.env scripts/setup-teacher-planning.mjs`. This creates only the new collection and function in the existing project. The deployment account needs database and function administration permissions. The script checks for a ready function deployment.
4. Check the live function with a teacher session, a second teacher session, and a student session. Confirm owner isolation and offline/reconnection behavior in a browser.
5. Publish the frontend through the existing master-branch GitHub Pages workflow. Entry point: `https://zumboggo.github.io/Learningisfun/#/brainstorming`.

The previous standalone Brainstorming site and its old database collection are not changed by this deployment.

## Verification recorded locally

All 853 Vitest tests passed, including editor migration/movement/CSV behavior and backend tests for anonymous/student denial and cross-teacher isolation. TypeScript and the production PWA build passed. Live deployment status is recorded in the release conversation.

The cell editor has a top-right trash button. Return saves and closes; Shift + Return adds a newline. IME composition confirmation does not submit.

New boards default to today’s date in the device’s locale; the title remains editable and existing boards are not renamed at midnight. Cloud backups wait for 60 seconds without content edits while local saves remain immediate. Save and Back up now flush immediately. Unchanged renders do not restart the timer or repeatedly upload the same content.

The To Do toggle converts the main top-left notes area to one checkbox per line, preserving the existing 15px editor text size. Return adds a task; Backspace on an empty task removes it. Completion strikes through the full task, persists per board, survives switching back to plain notes, and appears in the A4 PDF.

The slash button beside the cell editor’s trash button toggles “dealt with.” Completed notes display strikethrough on the main board and in PDF exports. The flag persists in backups and follows notes through swaps and row reordering; deleting the note clears it.

Refresh planner archives completed cells and checked items in the active To Do checklist on the current board, retaining unfinished cell positions and other notes. Archive shows full text across saved boards with original board title, location and time. Archives live inside each board and are included in local/JSON/cloud backups; deleting a board also deletes its archive, as stated in the confirmation. Refresh rolls back on local storage failure and repeated refreshes do not duplicate items.
