# Privacy Safety Plan

Learning is Fun should be designed so the app does not need a real student roster or confidential student identity data.

## Goals

- Do not store student legal names.
- Do not store teacher-maintained mappings between student names and nicknames.
- Do not store grades, conduct notes, private accommodations, parent details, government IDs, or school records.
- Store only the minimum needed for classroom participation: nickname, class membership, questions, writing responses, annotations, flashcard progress, and study minutes.
- Let the teacher keep the real-name-to-nickname mapping outside the app if needed for marking.

## Safer Account Flow

1. Teacher creates a class and shares a class code or join link.
2. Student opens the join link and enters an email address.
3. Appwrite sends a magic link to that email.
4. After email verification, the student chooses:
   - a nickname shown in class,
   - a password for future sign-in,
   - optional display preferences.
5. The app stores the email only for authentication and never displays it in classroom views.
6. The teacher sees nicknames in reports, not real names.
7. The teacher may keep a private paper or local spreadsheet mapping nicknames to real students outside the app.

## Data Classification

### Avoid Storing

- Real student names.
- Student numbers or school IDs.
- Parent or guardian contact details.
- Grades or official marks.
- Sensitive teacher comments about a student.
- Any health, discipline, immigration, or accommodation data.

### Store Minimally

- User ID.
- Email for authentication only.
- Nickname.
- Class membership by class ID.
- Discussion questions and votes.
- Writing responses.
- Reading annotations.
- Flashcard review state and broad study analytics.

### Teacher-Only Views

- Nickname-level participation totals.
- Nickname-level response completion and word counts.
- Nickname-level flashcard minutes and New/Familiar/Known ratios.
- Authorship for moderation and classroom accountability.

### Anonymous Classroom Views

- Presented writing samples.
- Question board content.
- Published discussion notes.

## Required Model Changes

- Rename student-facing `name` usage to `nickname`.
- Add a `displayName` or `nickname` field to users.
- Stop requiring roster CSV imports with legal names.
- Replace teacher-created student accounts with join-code + email magic-link enrollment.
- Make class reports export nickname-based rows only.
- Keep email hidden from normal teacher classroom screens unless absolutely needed for account support.
- Add a setting to purge old class data after a chosen retention window.

## Appwrite Direction

- Use Appwrite email sessions or magic URL flow for first sign-in.
- Keep Appwrite Auth as the only place that needs student email.
- Store profile documents with nickname and role only.
- Use collection permissions so students can read/write only their own private records and shared class records.
- Keep teacher views aggregate where possible.

## Near-Term Migration Steps

1. Fix login and registration reliability.
2. Change registration copy from "Full name" to "Nickname".
3. Change class roster tools so teacher-created accounts become optional development/admin tools only.
4. Add join-link flow: `/join/:joinCode`.
5. Add nickname setup page after first magic-link sign-in.
6. Update reports and classroom views to show nickname instead of email or legal name.
7. Add data retention controls per class.
