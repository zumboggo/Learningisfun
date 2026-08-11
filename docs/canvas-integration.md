# Daily Canvas quiz

Turns a class's flashcards into a daily quiz and pushes it into Canvas, so students
take it there and marks post to the gradebook automatically.

## Why the push is a separate command

This app is a static PWA served from GitHub Pages. Two things stop the browser from
calling Canvas directly:

1. **CORS.** Canvas's REST API sends no `Access-Control-Allow-Origin` for token auth,
   so a `fetch` from the app is blocked by the browser. No code change fixes this.
2. **The token.** A Canvas API token acts as you on every course you teach, including
   grade changes. Storing it in IndexedDB on a public origin means any XSS or shared
   device gives that away.

So the app generates and reviews the quiz (where the flashcards live), and a local
Node script does the push (where the token can stay private). The token is never
bundled into the web app and never leaves your machine.

## One-time setup

```bash
cp .env.canvas.example .env.canvas.local
```

Fill in:

- `CANVAS_BASE_URL` — e.g. `https://yourschool.instructure.com`
- `CANVAS_API_TOKEN` — Canvas → Account → Settings → **+ New Access Token**
- `CANVAS_COURSE_ID` — the number in `/courses/12345`

`.env.canvas.local` and any `canvas-quiz-*.json` export are gitignored.

## Daily workflow

1. **Quizzes → Daily Canvas quiz.** Pick the class and date, set the mix, press
   **Preview quiz**.
2. Read the questions. Every one is derived mechanically from a card — there's no AI
   in this path, so nothing is invented, but a badly-worded card still makes a badly-worded
   question.
3. **Save & download for Canvas** writes `canvas-quiz-<date>.json` to your downloads.
4. Push it:

```bash
npm run canvas:push -- "$HOME/Downloads/canvas-quiz-2026-08-09.json" --dry-run
```

`--dry-run` prints the exact request bodies and sends nothing. Then:

```bash
npm run canvas:push -- "$HOME/Downloads/canvas-quiz-2026-08-09.json"
```

That creates the quiz **unpublished**. Check it in Canvas, then publish there — or
re-run with `--publish` to publish automatically once every question is in.

## How questions are built

Source pools are split by the card's `createdAt` against the quiz date:

- **today** — cards added on the quiz date (that day's material)
- **review** — everything older in the class's assigned decks

The *source mix* slider sets what share comes from today (default 60%). The review
share is sampled with exponential recency decay — a card's weight halves every
*N* days (default 14), so last week's vocabulary reappears more often than last term's.

Two question types:

- **Multiple choice** — "Which of these best matches **term**?", correct answer is the
  card's own back. The three distractors are real backs from other cards, preferring
  cards that share tags, then the same deck. They're never random text.
- **Fill in the blank** — the card's example sentence (`hint`) with the term blanked
  out. If the hint doesn't contain the term, it falls back to showing the definition
  with the term blanked.

Each cloze answer ships 2–4 accepted variants: plural/singular, dropped article,
hyphen↔space, stripped accents, parenthetical removed. These map onto Canvas's
`fill_in_multiple_blanks_question` as separate answers on the same `blank_id`, all
weighted 100. Case and surrounding whitespace are already ignored by Canvas.

A card that can't produce a usable question (missing a side, too few cards for
distractors) is listed in the preview's skipped list rather than dropped silently.

## Duplicate protection

Each quiz carries a fingerprint — `edu-spark-daily:<classId>:<date>` — hidden in an
HTML comment in its Canvas description. Two guards use it:

- The app refuses to build a second daily quiz for a class/date it already has.
- The script lists the course's quizzes and aborts if that fingerprint (or the same
  title) is already there. `--force` overrides it.

Generation is also seeded on `classId:date`, so re-running the same day produces the
identical quiz rather than a different one.

## Canvas API surface

Classic Quizzes:

- `POST /api/v1/courses/:course_id/quizzes`
- `POST /api/v1/courses/:course_id/quizzes/:quiz_id/questions`
- `PUT  /api/v1/courses/:course_id/quizzes/:quiz_id` (publish)

The quiz is created with `published: false` and only flipped to published after the
last question lands, so students can never open a half-built quiz. If a question POST
fails partway, the script says how many made it and leaves the quiz unpublished.

Verified against `lifeplus.instructure.com` course 20635 (English III/IV, Western
Literature Focus): that course runs **Classic Quizzes**, so these are the right
endpoints. Note it's a Blueprint child course — the quizzes this tool creates are not
blueprint-managed, so a master-course sync won't touch them.

That course also has duplicate assignment groups from its Blueprint import (two named
"Quizzes", two named "Assignments"). Set the assignment group ID explicitly in the
modal, or Canvas files the quiz into the course's *first* group, which is "Assignments".
Look yours up at `/api/v1/courses/<course_id>/assignment_groups`.

**New Quizzes note:** the New Quizzes API (`/api/quiz/v1/...`) does not expose stable
question-item creation, so this integration targets Classic Quizzes. Classic quizzes
still grade to the gradebook normally and work in courses that otherwise use New
Quizzes. If you need these as New Quizzes specifically, the route is a QTI export/import
instead — that would replace `canvas-payload.ts` only.

## Layout

| File | Role |
| --- | --- |
| `src/services/quiz-generator.ts` | Pure generation: card selection, MC/cloze building, answer variants |
| `src/services/canvas-payload.ts` | Pure translation into Canvas request bodies + fingerprints |
| `src/services/daily-quiz.service.ts` | Dexie glue: gather cards, record the quiz, export the bundle |
| `src/components/quizzes/DailyCanvasQuizModal.tsx` | Teacher UI |
| `scripts/push-to-canvas.mjs` | The only code that sees the Canvas token |

The first two are pure and covered by `src/test/quiz-generator.test.ts` and
`src/test/canvas-payload.test.ts`.
