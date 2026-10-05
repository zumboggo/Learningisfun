# Student data security review — 23 September 2026

Scope: source review of commit 91f40f7, registration/session handling, Appwrite provisioning and deployment scripts, account management, reading-discussion/public-reading boundaries, local persistence, AI feedback, and an online `npm audit --omit=dev`. No live student records were retrieved and no exploit was attempted. Live Appwrite permissions, deployed function versions, API-key scopes, authentication settings and access logs were not verified. Findings below distinguish source-confirmed behavior from deployment-dependent exposure. This is a focused review, not a comprehensive penetration test or compliance assessment.

## 1. Critical: callers can choose a trusted teacher role

Evidence: `src/services/auth.service.ts:7` accepts a role, and line 30 writes it directly into the users collection. `scripts/setup-appwrite.mjs:746` grants authenticated users collection-wide create access, with document security disabled. `functions/learning-content/src/main.js:133` reads that profile and trusts its role for privileged actions. `src/pages/RegisterPage.tsx:12` checks a VITE_TEACHER_CODE only in the browser.

If production uses these permissions, a newly registered account can create its own teacher profile without passing the signup screen's code check. Hiding the teacher option or rotating that code does not repair the authorization boundary. Vite embeds referenced VITE variables in client bundles, even when their build-time source is a GitHub secret: https://vite.dev/guide/env-and-mode .

Fix: provision profiles through an authenticated server function, derive the account ID and verified account attributes server-side, and default new accounts to student. Assign teacher privilege only through an administrator-controlled process or server-validated invitation. Remove browser create access to the role-bearing collection and update both registration and missing-profile recovery. Preserve and independently verify existing legitimate teacher accounts before migrating; do not trust existing role strings as proof of authorization. Review historical privileged activity after closing the path.

Verification: an ordinary account must be unable to create another user's profile, submit a teacher role, change its role, or call teacher-only actions. Exercise the underlying API, not only the signup UI.

## 2. High: all signed-in accounts can read all profiles under the supplied configuration

Evidence: `scripts/setup-appwrite.mjs:750` grants `Permission.read(Role.users())`; profiles include names and email addresses. Class-scoped UI filtering cannot restrict a direct database request. Appwrite collection-wide permissions grant access independently of individual document permissions: https://appwrite.io/docs/products/databases/documentsdb/permissions .

Fix: remove collection-wide profile reads. Provide a self-profile endpoint, minimal class-scoped nickname responses, and teacher roster responses restricted to owned classes. Keep email out of student-facing roster responses. Migrate callers such as `findUserByEmail` and profile loading before revoking their direct access.

Verification: student A cannot enumerate profiles or retrieve student B's email, including outside their class; teachers can see only the information required for their own students.

## 3. High: teacher account management is broader than class ownership

Evidence: `functions/learning-content/src/main.js:159` lists all nonteacher profiles and returns names, emails and account status, even where no owned-class membership exists. `updateManagedUserRole` and `resetManagedUserAccount` reject memberships in other teachers' classes but accept an empty membership list. Any teacher can therefore manage otherwise eligible unattached accounts. The reset path deletes the authentication account after checking for student work.

Fix: require positive evidence of management authority: membership in an owned class or an explicit server-recorded account creator/administrator relationship. Keep global account administration separate from ordinary teaching permissions. Apply the same rule to listing, role changes, and resets. Test zero-membership, foreign-class, mixed-class and owned-class cases. This issue increases the impact of finding 1.

## 4. High on shared devices: logout leaves cached student data behind

Evidence: `src/services/auth.service.ts:232` deletes only currentUserId locally; the shared IndexedDB database remains. Session-deletion errors are swallowed. `getCurrentUser` at line 263 treats every account lookup failure as permission to return a cached identity, including explicit session rejection. AuthContext also restores cached identity before server validation.

Consequences: someone with access to the same browser profile can inspect cached records. A rejected session can still reopen local content; failed logout can leave a server session available. This does not by itself bypass server authorization.

Fix: distinguish network-offline failures from explicit 401/403 rejection. Fail closed on rejected sessions. Add a shared-device policy, account-separated storage, sync cancellation during account changes, and a safe sign-out cleanup process. Preserve/export unsynced work before deletion rather than silently discarding it. Make persistent offline access an explicit trusted-device choice.

Additional concern: `vite.config.ts:52` caches matching cloud.appwrite.io GET responses in an appwrite-api cache without an account-specific cache key. Remove authenticated API response caching and remove the obsolete cache on upgrade. Whether this currently matches production depends on the configured endpoint and redirects; regional hostnames do not match this expression directly.

Verification: switch from student A to B, reload offline, revoke a session, simulate failed logout and in-flight sync, and inspect IndexedDB/CacheStorage for cross-account exposure.

## 5. Medium: production dependencies have published advisories

The online npm audit reported three affected packages: @xmldom/xmldom (high), react-router (high), and react-router-dom (moderate, via react-router). Fixes were reported available. These are affected-package counts, not three demonstrated exploits. Some router advisories concern SSR/RSC functionality that this Vite SPA does not appear to use; XML parser resource-exhaustion advisories warrant attention for imported documents.

Fix: update compatible dependencies and lockfiles, check function dependencies separately, rerun audit, and test imports, routing, authentication and the production build. Avoid an unreviewed forced major-version upgrade.

## 6. Privacy and defense-in-depth follow-ups

- `functions/writing-ai-feedback/src/main.js:5` sends student writing and requested feedback to OpenRouter and a configured downstream model. That is an intentional external data flow, not evidence of a breach. Make it clear before submission, minimize identifiers in content, provide a school-controlled opt-out, and verify provider retention/training settings and the school's requirements. Provider settings were not inspected.
- `scripts/deploy-appwrite-functions.mjs:92` supplies the same deployment API key to multiple functions, including the guest-executable public-reading function. Inspect its actual scopes, then use separate minimum-scope runtime credentials. The deployment key's breadth was not verified.
- Verify teacher/admin MFA, session duration/revocation, signup verification, class-code and AI request throttling, backup restore procedures, retention/deletion policies, and security-event logging. These controls cannot be certified from this source review.
- The tracked production env file should contain public client configuration only. Add secret scanning and explicit ignore rules for private environment files; never treat a VITE variable as a server secret.

## Existing strengths

Reading-discussion handlers check membership/ownership, enforce authorship server-side and limit identity disclosure in student responses. Public reading is separated into an explicit opt-in published-text endpoint with a narrow response projection, rather than exposing class discussions. Markdown rendering uses React text nodes and validates link protocols. These protections are useful, but role provisioning must be fixed for privileged checks to be reliable.

## Recommended rollout

1. Verify live users collection permissions and legitimate teacher identities; contain unauthorized teacher provisioning first.
2. Deploy server-side profile provisioning and scoped profile/management endpoints with regression tests; update the client and revoke broad collection access in a coordinated migration.
3. Repair session rejection, shared-device cleanup and API caching without losing unsynced student work.
4. Patch dependencies and validate imports/build/routing.
5. Verify live settings, credentials, AI privacy policy, backups and logs.

No application code, live permissions, accounts or deployments were changed by this audit. The critical fixes require coordinated registration, backend and permission changes; a frontend-only patch would leave the underlying access path open.
