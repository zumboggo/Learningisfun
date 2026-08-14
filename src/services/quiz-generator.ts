/**
 * Deterministic quiz generation from flashcards.
 *
 * No AI, no network: every question here is derived mechanically from a card's
 * own front/back/hint, and distractors are always real backs from other cards.
 * That matters because these questions go straight into a graded Canvas quiz —
 * a hallucinated "correct" answer would silently cost students marks.
 *
 * Pure module: no Dexie, no DOM. Runs identically in the browser, in vitest,
 * and in the Node push script.
 */

import type { FlashcardCard } from '@/types';

/** One accepted-answer group for a cloze blank, shaped for Canvas. */
export interface ClozeAnswerSet {
  /** Matches the `[blank_id]` placeholder Canvas expects in the question text. */
  blankId: string;
  /** The answer shown to you in review and used by the in-app quiz. */
  primary: string;
  /** 2-4 extra spellings/forms that also count as correct. */
  variants: string[];
}

export interface GeneratedQuestion {
  type: 'mc' | 'cloze';
  /** The card this came from — lets you trace a bad question back to its source. */
  sourceCardId: string;
  /** Which pool the card came from, for the mix summary. */
  bucket: 'today' | 'review';
  /** Cloze text uses `___` for the blank (the app's convention). */
  questionText: string;
  /** MC only. */
  options: string[];
  /** MC only; index into `options`. */
  correctIndex: number;
  /** Cloze only. */
  cloze: ClozeAnswerSet | null;
  explanation: string;
  points: number;
}

export interface GenerationOptions {
  /** Total questions to produce. */
  questionCount: number;
  /** Percent of questions drawn from today's cards. Default 60. */
  todayWeight: number;
  /** Percent of questions that are multiple choice; rest are cloze. Default 60. */
  multipleChoiceWeight: number;
  /**
   * Days after which an older card's selection weight halves. Lower = more
   * biased toward recently taught material. Default 14.
   */
  recencyHalfLifeDays: number;
  /** Marks per question in Canvas. Default 1. */
  pointsPerQuestion: number;
  /** Anything that makes the run reproducible — same seed, same quiz. */
  seed: string;
}

export const DEFAULT_GENERATION_OPTIONS: Omit<GenerationOptions, 'seed'> = {
  questionCount: 10,
  todayWeight: 60,
  multipleChoiceWeight: 60,
  recencyHalfLifeDays: 14,
  pointsPerQuestion: 1,
};

export interface GenerationResult {
  questions: GeneratedQuestion[];
  /** What actually got used — the requested mix is a target, not a guarantee. */
  summary: {
    requested: number;
    produced: number;
    fromToday: number;
    fromReview: number;
    multipleChoice: number;
    cloze: number;
    /** Cards that yielded no usable question, with the reason. */
    skipped: Array<{ cardId: string; front: string; reason: string }>;
  };
}

/* ------------------------------------------------------------------ *
 * Seeded randomness
 * ------------------------------------------------------------------ */

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good enough for picking distractors. */
function makeRng(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw `count` items without replacement, where a higher weight means a higher
 * chance of being drawn early.
 */
function weightedSample<T>(
  items: Array<{ item: T; weight: number }>,
  count: number,
  rng: () => number,
): T[] {
  const pool = items.filter(entry => entry.weight > 0).map(entry => ({ ...entry }));
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let target = rng() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      target -= pool[i].weight;
      if (target <= 0) {
        index = i;
        break;
      }
    }
    picked.push(pool[index].item);
    pool.splice(index, 1);
  }
  return picked;
}

/* ------------------------------------------------------------------ *
 * Card selection
 * ------------------------------------------------------------------ */

export interface CardPools {
  /** Cards created on the session date — the day's new material. */
  today: FlashcardCard[];
  /** Everything older from the same class, for spaced review. */
  review: FlashcardCard[];
}

/**
 * Split a class's cards into today's material and older review material.
 * `sessionDate` is compared as a local calendar day, so a card added at 21:00
 * still counts as "today" rather than sliding into tomorrow in UTC.
 */
export function splitCardsByDay(cards: FlashcardCard[], sessionDate: Date): CardPools {
  const dayKey = localDayKey(sessionDate);
  const today: FlashcardCard[] = [];
  const review: FlashcardCard[] = [];
  for (const card of cards) {
    const created = new Date(card.createdAt);
    if (Number.isNaN(created.getTime())) {
      review.push(card);
    } else if (localDayKey(created) === dayKey) {
      today.push(card);
    } else if (created.getTime() < sessionDate.getTime()) {
      review.push(card);
    }
    // Cards created after the session date are ignored — they weren't taught yet.
  }
  return { today, review };
}

/**
 * Split a class's cards into "recent" and "everything earlier", where recent
 * means created within the last `windowDays` days.
 *
 * This is the pool split behind the in-app quiz slider: a teacher thinks in
 * "this week's vocabulary vs. the whole course", not in single calendar days.
 * Cards land in the `today` pool so the generator's existing weighting applies
 * unchanged.
 */
export function splitCardsByRecency(
  cards: FlashcardCard[],
  windowDays: number,
  now: Date = new Date(),
): CardPools {
  const cutoff = now.getTime() - Math.max(0, windowDays) * 86400000;
  const today: FlashcardCard[] = [];
  const review: FlashcardCard[] = [];
  for (const card of cards) {
    const created = new Date(card.createdAt).getTime();
    // A card with no usable date is old material, not new — safer for review.
    if (!Number.isNaN(created) && created >= cutoff) today.push(card);
    else review.push(card);
  }
  return { today, review };
}

function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Pick the cards for one daily quiz: `todayWeight`% from today, the rest from
 * older cards with exponential recency decay so last week's vocabulary comes
 * back more often than last term's.
 *
 * If one pool is short, the other backfills — a quiz on a day with only three
 * new cards should still be a full-length quiz.
 */
export function selectCards(
  pools: CardPools,
  options: GenerationOptions,
  rng: () => number,
  now: Date,
): Array<{ card: FlashcardCard; bucket: 'today' | 'review' }> {
  const total = Math.max(0, options.questionCount);
  const todayTarget = Math.min(
    pools.today.length,
    Math.round((total * clampPercent(options.todayWeight)) / 100),
  );
  const reviewTarget = Math.min(pools.review.length, total - todayTarget);

  const chosenToday = shuffle(pools.today, rng).slice(0, todayTarget);

  const halfLife = Math.max(0.5, options.recencyHalfLifeDays);
  const weighted = pools.review.map(card => {
    const created = new Date(card.createdAt).getTime();
    const ageDays = Number.isNaN(created)
      ? halfLife * 4
      : Math.max(0, (now.getTime() - created) / 86400000);
    return { item: card, weight: Math.pow(0.5, ageDays / halfLife) + 0.01 };
  });
  const chosenReview = weightedSample(weighted, reviewTarget, rng);

  const selected = [
    ...chosenToday.map(card => ({ card, bucket: 'today' as const })),
    ...chosenReview.map(card => ({ card, bucket: 'review' as const })),
  ];

  // Backfill from whichever pool still has cards left.
  if (selected.length < total) {
    const used = new Set(selected.map(entry => entry.card.$id));
    const leftovers = [
      ...pools.today.filter(c => !used.has(c.$id)).map(card => ({ card, bucket: 'today' as const })),
      ...pools.review.filter(c => !used.has(c.$id)).map(card => ({ card, bucket: 'review' as const })),
    ];
    selected.push(...shuffle(leftovers, rng).slice(0, total - selected.length));
  }

  return shuffle(selected, rng);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/* ------------------------------------------------------------------ *
 * Answer variants
 * ------------------------------------------------------------------ */

const LEADING_ARTICLE = /^(the|a|an)\s+/i;

/**
 * Build 2-4 extra accepted spellings for a cloze answer so a student isn't
 * marked wrong for a plural, a hyphen, or an accent.
 *
 * Canvas already trims and compares case-insensitively, so case-only variants
 * are deliberately dropped — they'd pad the list without accepting anything new.
 */
export function buildAnswerVariants(primary: string, max = 4): string[] {
  const base = primary.trim();
  if (!base) return [];

  const candidates: string[] = [];
  const add = (value: string) => {
    const v = value.trim();
    if (v) candidates.push(v);
  };

  // Article: "the mitochondrion" -> "mitochondrion"
  if (LEADING_ARTICLE.test(base)) add(base.replace(LEADING_ARTICLE, ''));

  // Parenthetical gloss: "osmosis (diffusion)" -> "osmosis"
  if (base.includes('(')) add(base.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' '));

  // Hyphen <-> space: "well-being" <-> "well being"
  if (base.includes('-')) add(base.replace(/-/g, ' '));
  else if (/\s/.test(base)) add(base.replace(/\s+/g, '-'));

  // Plural / singular
  const other = togglePlural(base);
  if (other) add(other);

  // Accents: "café" -> "cafe"
  const deaccented = base.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (deaccented !== base) add(deaccented);

  // Curly apostrophe -> straight, which is what students actually type.
  if (/[‘’]/.test(base)) add(base.replace(/[‘’]/g, "'"));

  const seen = new Set([base.toLowerCase()]);
  const variants: string[] = [];
  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    variants.push(candidate);
    if (variants.length >= max) break;
  }
  return variants;
}

/** English plural <-> singular for the last word only. Conservative by design. */
function togglePlural(phrase: string): string | null {
  const match = phrase.match(/^(.*?)(\S+)$/);
  if (!match) return null;
  const [, prefix, word] = match;
  if (word.length < 3) return null;

  const lower = word.toLowerCase();
  let toggled: string;

  if (lower.endsWith('ies')) toggled = word.slice(0, -3) + 'y';
  else if (lower.endsWith('ses') || lower.endsWith('xes') || lower.endsWith('zes') || lower.endsWith('ches') || lower.endsWith('shes')) toggled = word.slice(0, -2);
  else if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us')) toggled = word.slice(0, -1);
  else if (/[^aeiou]y$/i.test(word)) toggled = word.slice(0, -1) + 'ies';
  else if (/(s|x|z|ch|sh)$/i.test(word)) toggled = word + 'es';
  else toggled = word + 's';

  return prefix + toggled;
}

/* ------------------------------------------------------------------ *
 * Question building
 * ------------------------------------------------------------------ */

const BLANK_TOKEN = '___';

function cardText(card: FlashcardCard, side: 'front' | 'back'): string {
  const markdown = side === 'front' ? card.frontMarkdown : card.backMarkdown;
  return (markdown || card[side] || '').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace `term` in `sentence` with the blank token.
 *
 * Tries a boundary-aware match first, then falls back to a plain substring
 * replace — CJK text has no `\b`-style boundaries, and this app is used with
 * Chinese content.
 */
export function maskTerm(sentence: string, term: string): string | null {
  const trimmed = term.trim();
  if (!trimmed) return null;
  const escaped = escapeRegExp(trimmed);

  const bounded = new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})(?=[^\\p{L}\\p{N}]|$)`, 'iu');
  if (bounded.test(sentence)) {
    return sentence.replace(bounded, `$1${BLANK_TOKEN}`);
  }

  // Scripts written without spaces have no boundary to anchor to, so fall back
  // to a plain substring match — but only for those scripts. Doing it for Latin
  // text would turn "Cellular" into "___ular" when the term is "cell".
  if (!hasWordBoundaries(trimmed)) {
    const plain = new RegExp(escaped, 'iu');
    if (plain.test(sentence)) {
      return sentence.replace(plain, BLANK_TOKEN);
    }
  }
  return null;
}

/** True for scripts that separate words with spaces (Latin, Greek, Cyrillic, …). */
function hasWordBoundaries(term: string): boolean {
  return !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Hangul}]/u.test(term);
}

/** How many other cards share at least one tag with this one. */
function tagOverlap(a: FlashcardCard, b: FlashcardCard): number {
  if (!a.tags?.length || !b.tags?.length) return 0;
  const bTags = new Set(b.tags.map(t => t.toLowerCase()));
  return a.tags.filter(t => bTags.has(t.toLowerCase())).length;
}

/**
 * Pick 3 distractors, preferring cards that share tags, then the same deck,
 * then anything else — so the wrong answers are topically plausible instead of
 * obviously from another unit.
 */
function pickDistractors(
  card: FlashcardCard,
  pool: FlashcardCard[],
  rng: () => number,
  wanted: number,
): string[] {
  const correct = cardText(card, 'back').toLowerCase();
  const candidates = pool
    .filter(other => other.$id !== card.$id)
    .filter(other => {
      const text = cardText(other, 'back');
      return text.length > 0 && text.toLowerCase() !== correct;
    });

  const scored = shuffle(candidates, rng).map(other => ({
    other,
    score: tagOverlap(card, other) * 10 + (other.deckId === card.deckId ? 1 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>([correct]);
  const out: string[] = [];
  for (const { other } of scored) {
    const text = cardText(other, 'back');
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= wanted) break;
  }
  return out;
}

function buildMultipleChoice(
  card: FlashcardCard,
  bucket: 'today' | 'review',
  pool: FlashcardCard[],
  options: GenerationOptions,
  rng: () => number,
): GeneratedQuestion | { skipped: string } {
  const front = cardText(card, 'front');
  const back = cardText(card, 'back');
  if (!front || !back) return { skipped: 'card is missing a front or back' };

  const distractors = pickDistractors(card, pool, rng, 3);
  if (distractors.length < 3) {
    return { skipped: 'not enough other cards to build 3 plausible distractors' };
  }

  const shuffled = shuffle([back, ...distractors], rng);
  return {
    type: 'mc',
    sourceCardId: card.$id,
    bucket,
    questionText: `Which of these best matches **${front}**?`,
    options: shuffled,
    correctIndex: shuffled.indexOf(back),
    cloze: null,
    explanation: buildExplanation(card, front, back),
    points: options.pointsPerQuestion,
  };
}

function buildCloze(
  card: FlashcardCard,
  bucket: 'today' | 'review',
  options: GenerationOptions,
): GeneratedQuestion | { skipped: string } {
  const front = cardText(card, 'front');
  const back = cardText(card, 'back');
  if (!front) return { skipped: 'card is missing a front' };

  // Best case: the hint is an example sentence using the term, so blanking the
  // term leaves a real sentence to reason about rather than bare recall.
  const hint = (card.hint || '').trim();
  let questionText = hint ? maskTerm(hint, front) : null;

  if (!questionText) {
    if (!back) return { skipped: 'no example sentence and no definition to build a blank from' };
    questionText = `${back}\n\nThis describes: ${BLANK_TOKEN}`;
  }

  return {
    type: 'cloze',
    sourceCardId: card.$id,
    bucket,
    questionText,
    options: [],
    correctIndex: -1,
    cloze: {
      blankId: 'blank1',
      primary: front,
      variants: buildAnswerVariants(front),
    },
    explanation: buildExplanation(card, front, back),
    points: options.pointsPerQuestion,
  };
}

function buildExplanation(card: FlashcardCard, front: string, back: string): string {
  const parts = [back ? `${front} — ${back}` : front];
  const hint = (card.hint || '').trim();
  if (hint) parts.push(`Example: ${hint}`);
  return parts.join('\n');
}

/**
 * Turn a class's flashcards into one daily quiz.
 *
 * Cards that can't produce a usable question (no distractors available, missing
 * a side) are reported in `summary.skipped` rather than dropped silently —
 * a short quiz should be visible before it reaches Canvas.
 */
export function generateQuizFromFlashcards(
  pools: CardPools,
  optionsInput: Partial<GenerationOptions> & { seed: string },
  now: Date = new Date(),
): GenerationResult {
  const options: GenerationOptions = { ...DEFAULT_GENERATION_OPTIONS, ...optionsInput };
  const rng = makeRng(options.seed);
  const allCards = [...pools.today, ...pools.review];

  const selected = selectCards(pools, options, rng, now);
  const mcTarget = Math.round((selected.length * clampPercent(options.multipleChoiceWeight)) / 100);

  const questions: GeneratedQuestion[] = [];
  const skipped: GenerationResult['summary']['skipped'] = [];
  let mcMade = 0;

  for (const { card, bucket } of selected) {
    const wantMc = mcMade < mcTarget;
    const primary = wantMc
      ? buildMultipleChoice(card, bucket, allCards, options, rng)
      : buildCloze(card, bucket, options);

    if (!('skipped' in primary)) {
      if (primary.type === 'mc') mcMade++;
      questions.push(primary);
      continue;
    }

    // Fall back to the other format before giving up on the card.
    const fallback = wantMc
      ? buildCloze(card, bucket, options)
      : buildMultipleChoice(card, bucket, allCards, options, rng);

    if (!('skipped' in fallback)) {
      if (fallback.type === 'mc') mcMade++;
      questions.push(fallback);
    } else {
      skipped.push({
        cardId: card.$id,
        front: cardText(card, 'front') || '(blank card)',
        reason: primary.skipped,
      });
    }
  }

  return {
    questions,
    summary: {
      requested: options.questionCount,
      produced: questions.length,
      fromToday: questions.filter(q => q.bucket === 'today').length,
      fromReview: questions.filter(q => q.bucket === 'review').length,
      multipleChoice: questions.filter(q => q.type === 'mc').length,
      cloze: questions.filter(q => q.type === 'cloze').length,
      skipped,
    },
  };
}
