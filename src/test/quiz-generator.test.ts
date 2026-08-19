import { describe, it, expect } from 'vitest';
import {
  generateQuizFromFlashcards,
  splitCardsByDay,
  splitCardsByRecency,
  buildAnswerVariants,
  maskTerm,
  selectCards,
  DEFAULT_GENERATION_OPTIONS,
  type GenerationOptions,
} from '@/services/quiz-generator';
import type { FlashcardCard } from '@/types';

function card(overrides: Partial<FlashcardCard> & { $id: string }): FlashcardCard {
  return {
    deckId: 'deck-1',
    front: overrides.$id,
    back: `definition of ${overrides.$id}`,
    frontMarkdown: '',
    backMarkdown: '',
    hint: '',
    tags: [],
    sortOrder: 0,
    createdAt: '2026-08-09T09:00:00.000Z',
    ...overrides,
  };
}

const SESSION_DATE = new Date('2026-08-09T12:00:00');

function makePools(todayCount: number, reviewCount: number) {
  const today = Array.from({ length: todayCount }, (_, i) =>
    card({
      $id: `t${i}`,
      front: `term${i}`,
      back: `the meaning of term${i}`,
      hint: `We used term${i} in class today.`,
      tags: ['unit-1'],
      createdAt: new Date(SESSION_DATE).toISOString(),
    }),
  );
  const review = Array.from({ length: reviewCount }, (_, i) =>
    card({
      $id: `r${i}`,
      front: `old${i}`,
      back: `the meaning of old${i}`,
      hint: `We met old${i} last week.`,
      tags: ['unit-1'],
      createdAt: new Date(SESSION_DATE.getTime() - (i + 1) * 86400000).toISOString(),
    }),
  );
  return { today, review };
}

describe('splitCardsByDay', () => {
  it('puts cards created on the session date into today', () => {
    const pools = splitCardsByDay(
      [
        card({ $id: 'a', createdAt: new Date(SESSION_DATE).toISOString() }),
        card({ $id: 'b', createdAt: new Date(SESSION_DATE.getTime() - 5 * 86400000).toISOString() }),
      ],
      SESSION_DATE,
    );
    expect(pools.today.map(c => c.$id)).toEqual(['a']);
    expect(pools.review.map(c => c.$id)).toEqual(['b']);
  });

  it('counts a late-evening card as today, not tomorrow', () => {
    const late = new Date(SESSION_DATE);
    late.setHours(23, 30, 0, 0);
    const pools = splitCardsByDay([card({ $id: 'a', createdAt: late.toISOString() })], SESSION_DATE);
    expect(pools.today).toHaveLength(1);
  });

  it('ignores cards created after the session date', () => {
    const future = new Date(SESSION_DATE.getTime() + 3 * 86400000).toISOString();
    const pools = splitCardsByDay([card({ $id: 'a', createdAt: future })], SESSION_DATE);
    expect(pools.today).toHaveLength(0);
    expect(pools.review).toHaveLength(0);
  });
});

describe('selectCards', () => {
  const options: GenerationOptions = { ...DEFAULT_GENERATION_OPTIONS, seed: 'x' };
  const rng = () => 0.5;

  it('honours the today/review split', () => {
    const selected = selectCards(makePools(20, 20), { ...options, questionCount: 10, todayWeight: 60 }, rng, SESSION_DATE);
    expect(selected).toHaveLength(10);
    expect(selected.filter(s => s.bucket === 'today')).toHaveLength(6);
    expect(selected.filter(s => s.bucket === 'review')).toHaveLength(4);
  });

  it('backfills from review when today is short', () => {
    const selected = selectCards(makePools(2, 30), { ...options, questionCount: 10, todayWeight: 60 }, rng, SESSION_DATE);
    expect(selected).toHaveLength(10);
    expect(selected.filter(s => s.bucket === 'today')).toHaveLength(2);
  });

  it('never returns more cards than exist', () => {
    const selected = selectCards(makePools(2, 3), { ...options, questionCount: 20 }, rng, SESSION_DATE);
    expect(selected).toHaveLength(5);
  });

  it('favours recent cards over old ones', () => {
    const pools = {
      today: [],
      review: [
        card({ $id: 'recent', createdAt: new Date(SESSION_DATE.getTime() - 86400000).toISOString() }),
        card({ $id: 'ancient', createdAt: new Date(SESSION_DATE.getTime() - 400 * 86400000).toISOString() }),
      ],
    };
    let recentFirst = 0;
    for (let i = 0; i < 40; i++) {
      const picked = selectCards(
        pools,
        { ...options, questionCount: 1, todayWeight: 0, seed: `s${i}` },
        makeCountingRng(i),
        SESSION_DATE,
      );
      if (picked[0]?.card.$id === 'recent') recentFirst++;
    }
    expect(recentFirst).toBeGreaterThan(30);
  });
});

/** Deterministic pseudo-rng that still varies across runs. */
function makeCountingRng(seed: number): () => number {
  let n = seed + 1;
  return () => {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  };
}

describe('buildAnswerVariants', () => {
  it('does not invent singular or plural forms', () => {
    expect(buildAnswerVariants('mitochondrion')).not.toContain('mitochondrions');
    expect(buildAnswerVariants('cells')).not.toContain('cell');
  });

  it('drops a leading article', () => {
    expect(buildAnswerVariants('the Enlightenment')).toContain('Enlightenment');
  });

  it('swaps hyphens for spaces', () => {
    expect(buildAnswerVariants('well-being')).toContain('well being');
  });

  it('strips accents', () => {
    expect(buildAnswerVariants('café')).toContain('cafe');
  });

  it('does not repeat the primary answer or duplicate variants', () => {
    const variants = buildAnswerVariants('osmosis');
    expect(variants).not.toContain('osmosis');
    expect(new Set(variants.map(v => v.toLowerCase())).size).toBe(variants.length);
  });

  it('returns at most four variants', () => {
    expect(buildAnswerVariants('the well-being of cafés').length).toBeLessThanOrEqual(4);
  });

  it('returns nothing for an empty answer', () => {
    expect(buildAnswerVariants('  ')).toEqual([]);
  });
});

describe('maskTerm', () => {
  it('blanks a whole word, case-insensitively', () => {
    expect(maskTerm('The Mitochondrion makes energy.', 'mitochondrion')).toBe('The ___ makes energy.');
  });

  it('does not blank a word that merely contains the term', () => {
    expect(maskTerm('Cellular respiration happens here.', 'cell')).toBe(null);
  });

  it('falls back to substring matching for text without word boundaries', () => {
    expect(maskTerm('光合作用是植物的過程', '光合作用')).toBe('___是植物的過程');
  });

  it('returns null when the term is absent', () => {
    expect(maskTerm('Nothing relevant here.', 'osmosis')).toBe(null);
  });
});

describe('generateQuizFromFlashcards', () => {
  const seed = { seed: 'class-1:2026-08-09' };

  it('produces the requested number of questions', () => {
    const result = generateQuizFromFlashcards(makePools(10, 20), { ...seed, questionCount: 10 }, SESSION_DATE);
    expect(result.questions).toHaveLength(10);
    expect(result.summary.produced).toBe(10);
  });

  it('is deterministic for the same seed', () => {
    const a = generateQuizFromFlashcards(makePools(10, 20), { ...seed, questionCount: 8 }, SESSION_DATE);
    const b = generateQuizFromFlashcards(makePools(10, 20), { ...seed, questionCount: 8 }, SESSION_DATE);
    expect(JSON.stringify(a.questions)).toBe(JSON.stringify(b.questions));
  });

  it('differs for a different seed', () => {
    const a = generateQuizFromFlashcards(makePools(10, 20), { seed: 'a', questionCount: 8 }, SESSION_DATE);
    const b = generateQuizFromFlashcards(makePools(10, 20), { seed: 'b', questionCount: 8 }, SESSION_DATE);
    expect(JSON.stringify(a.questions)).not.toBe(JSON.stringify(b.questions));
  });

  it('respects the multiple-choice ratio', () => {
    const result = generateQuizFromFlashcards(
      makePools(10, 20),
      { ...seed, questionCount: 10, multipleChoiceWeight: 50 },
      SESSION_DATE,
    );
    expect(result.summary.multipleChoice).toBe(5);
    expect(result.summary.cloze).toBe(5);
  });

  it('gives every MC question exactly four options with a valid correct index', () => {
    const result = generateQuizFromFlashcards(
      makePools(10, 20),
      { ...seed, questionCount: 10, multipleChoiceWeight: 100 },
      SESSION_DATE,
    );
    for (const q of result.questions.filter(q => q.type === 'mc')) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });

  it('uses the real definition as the correct MC option', () => {
    const pools = makePools(4, 4);
    const result = generateQuizFromFlashcards(
      pools,
      { ...seed, questionCount: 8, multipleChoiceWeight: 100 },
      SESSION_DATE,
    );
    const byId = new Map([...pools.today, ...pools.review].map(c => [c.$id, c]));
    for (const q of result.questions.filter(q => q.type === 'mc')) {
      expect(q.options[q.correctIndex]).toBe(byId.get(q.sourceCardId)!.back);
    }
  });

  it('uses definitions rather than examples for cloze questions', () => {
    const result = generateQuizFromFlashcards(
      makePools(6, 6),
      { ...seed, questionCount: 6, multipleChoiceWeight: 0 },
      SESSION_DATE,
    );
    for (const q of result.questions) {
      expect(q.type).toBe('cloze');
      expect(q.questionText).toContain('___');
      expect(q.cloze?.primary).toBeTruthy();
      expect(q.questionText.toLowerCase()).not.toContain(q.cloze!.primary.toLowerCase());
      expect(q.questionText).not.toContain('We used');
      expect(q.explanation).not.toContain('Example:');
    }
  });

  it('never puts an MC answer in the same position three times consecutively', () => {
    const result = generateQuizFromFlashcards(makePools(20, 20), { ...seed, questionCount: 30, multipleChoiceWeight: 100 }, SESSION_DATE);
    const positions = result.questions.filter(q => q.type === 'mc').map(q => q.correctIndex);
    for (let index = 2; index < positions.length; index++) {
      expect(new Set(positions.slice(index - 2, index + 1)).size).toBeGreaterThan(1);
    }
  });

  it('falls back to a definition prompt when there is no usable example sentence', () => {
    const pools = {
      today: [card({ $id: 'a', front: 'osmosis', back: 'water moving across a membrane', hint: 'unrelated text' })],
      review: [],
    };
    const result = generateQuizFromFlashcards(pools, { ...seed, questionCount: 1, multipleChoiceWeight: 0 }, SESSION_DATE);
    expect(result.questions[0].questionText).toContain('water moving across a membrane');
    expect(result.questions[0].questionText).toContain('___');
  });

  it('falls back to cloze when there are too few cards for distractors', () => {
    const pools = {
      today: [
        card({ $id: 'a', front: 'osmosis', back: 'water movement', hint: 'Osmosis moves water.' }),
        card({ $id: 'b', front: 'diffusion', back: 'particle spread', hint: 'Diffusion spreads particles.' }),
      ],
      review: [],
    };
    const result = generateQuizFromFlashcards(pools, { ...seed, questionCount: 2, multipleChoiceWeight: 100 }, SESSION_DATE);
    expect(result.summary.multipleChoice).toBe(0);
    expect(result.summary.cloze).toBe(2);
  });

  it('reports cards it could not use instead of dropping them silently', () => {
    const pools = { today: [card({ $id: 'blank', front: '', back: '', hint: '' })], review: [] };
    const result = generateQuizFromFlashcards(pools, { ...seed, questionCount: 1 }, SESSION_DATE);
    expect(result.questions).toHaveLength(0);
    expect(result.summary.skipped).toHaveLength(1);
    expect(result.summary.skipped[0].cardId).toBe('blank');
  });

  it('prefers distractors that share tags with the source card', () => {
    const pools = {
      today: [
        card({ $id: 'a', front: 'osmosis', back: 'water movement', tags: ['bio'] }),
        card({ $id: 'b', front: 'diffusion', back: 'particle spread', tags: ['bio'] }),
        card({ $id: 'c', front: 'mitosis', back: 'cell division', tags: ['bio'] }),
        card({ $id: 'd', front: 'meiosis', back: 'gamete division', tags: ['bio'] }),
      ],
      review: Array.from({ length: 12 }, (_, i) =>
        card({ $id: `h${i}`, front: `treaty${i}`, back: `a treaty signed in 18${i}0`, tags: ['history'] }),
      ),
    };
    const result = generateQuizFromFlashcards(
      pools,
      { ...seed, questionCount: 4, todayWeight: 100, multipleChoiceWeight: 100 },
      SESSION_DATE,
    );
    const bioBacks = new Set(pools.today.map(c => c.back));
    for (const q of result.questions.filter(q => q.type === 'mc')) {
      expect(q.options.every(o => bioBacks.has(o))).toBe(true);
    }
  });
});

describe('splitCardsByRecency', () => {
  const now = new Date('2026-08-14T12:00:00');

  it('puts cards from inside the window in the recent pool', () => {
    const pools = splitCardsByRecency(
      [
        card({ $id: 'a', createdAt: new Date('2026-08-13T09:00:00').toISOString() }),
        card({ $id: 'b', createdAt: new Date('2026-08-09T09:00:00').toISOString() }),
        card({ $id: 'c', createdAt: new Date('2026-06-01T09:00:00').toISOString() }),
      ],
      7,
      now,
    );
    expect(pools.today.map(c => c.$id)).toEqual(['a', 'b']);
    expect(pools.review.map(c => c.$id)).toEqual(['c']);
  });

  it('treats an unusable date as older material rather than new', () => {
    const pools = splitCardsByRecency([card({ $id: 'x', createdAt: 'not a date' })], 7, now);
    expect(pools.today).toHaveLength(0);
    expect(pools.review.map(c => c.$id)).toEqual(['x']);
  });

  it('a zero-day window leaves everything for review', () => {
    const pools = splitCardsByRecency(
      [card({ $id: 'a', createdAt: new Date('2026-08-13T09:00:00').toISOString() })],
      0,
      now,
    );
    expect(pools.today).toHaveLength(0);
    expect(pools.review).toHaveLength(1);
  });
});
