# The Game episode bank

The student Game page and each class’s Game section show collapsible topic buttons. Opening a topic reveals playable episode buttons and saved best scores. Weekly materials retain their dated cards; the Game bank includes every released assignment, independent of the selected week. Teacher authoring remains under Create episode; draft rows are not part of the bank.

`episode-topics.js` holds the Don Quixote chapter sequence, independent of teaching dates and storage order:

1. A Knight Needs a Sidekick — chapter 1
2. The Castle That Served Supper — chapters 2–3
3. The Promise Left Behind — chapters 4–5
4. The Door That Disappeared — chapters 6–7
5. The Giants That Were Mills — chapter 8

World Literature Red (`09d7f0a7-4c29-462c-820f-e11ea914d375`) and Blue (`b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c`) share episode assignments automatically in `animatedAssign`. Both classes must belong to the publishing teacher. Each section retains its own assignment ID, membership checks, attempts and scores. Repeated assignment of the same content reuses the current entry. New released editions retire earlier library entries while preserving their snapshots and attempt access. Archiving/restoring a World Literature story applies to both sections.

`scripts/publish-world-lit-bank.mjs --date=YYYY-MM-DD` publishes the five complete lessons with the existing authorized Appwrite environment, verifies packages in both classes, and updates publication receipts. Existing live studio editions are authoritative; local source is used only when no studio edition exists. The date must already be available. Development fixtures (the parser demo and short action rehearsal) are not classroom lessons.
