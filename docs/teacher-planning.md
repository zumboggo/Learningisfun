# Teacher Planning integration

The Brainstorming tab opens the editor at `#/brainstorming`, beside the existing Planning tools. It is available to teachers and administrators through the existing login. The editor retains its A4 template, row/card dragging, named boards, CSV import/export, spreadsheet clipboard copy, PDF download and JSON backup/restore. Existing Brainstorming JSON exports can be restored without replacing current boards.

The React host embeds the editor with `srcDoc` to isolate its stylesheet and preserve the print layout. There is no separately hosted editor or login. Requests from that specific frame are forwarded using Learning is Fun's existing Appwrite SDK session. Navigating away, signing out or switching accounts destroys the frame and its bridge; responses for an unmounted account are discarded.

Local libraries and device identifiers are scoped by account ID. The existing PWA caches the bundled editor for offline use. Local browser data is unencrypted, like the rest of the app's offline storage: device/browser access should be limited to trusted users.

The dedicated `teacher-planning` Appwrite function checks the authenticated request's user ID and existing teacher/admin profile. It never trusts a client-supplied owner or document ID. It uses a new `brainstorming/teacher_libraries` collection with no collection-wide permissions, document security enabled, and owner-only read permissions. All writes go through the function. The function uses a dynamically scoped Appwrite key; no API key is bundled into the frontend.

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
