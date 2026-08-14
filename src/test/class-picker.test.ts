import { describe, expect, it } from 'vitest';
import {
  groupCountFor,
  makeRandomGroups,
  pickRandom,
  randomInt,
  shuffle,
  splitEvenly,
  type Pickable,
} from '@/services/class-picker';

function students(count: number): Pickable[] {
  return Array.from({ length: count }, (_, i) => ({ id: `s${i}`, name: `Student ${i}` }));
}

describe('randomInt', () => {
  it('stays inside the bound', () => {
    for (let i = 0; i < 200; i++) {
      const value = randomInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });

  it('always returns 0 for a bound of one', () => {
    expect(randomInt(1)).toBe(0);
  });

  it('rejects a non-positive bound rather than returning nonsense', () => {
    expect(() => randomInt(0)).toThrow();
  });

  it('covers the whole range over many draws', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randomInt(5));
    expect(seen.size).toBe(5);
  });

  it('is roughly uniform — no modulo bias towards the low end', () => {
    const counts = new Array(5).fill(0);
    const draws = 20000;
    for (let i = 0; i < draws; i++) counts[randomInt(5)]++;
    // Each bucket should be near draws/5 = 4000; allow generous slack so the
    // test is not itself flaky.
    for (const count of counts) {
      expect(count).toBeGreaterThan(draws / 5 * 0.85);
      expect(count).toBeLessThan(draws / 5 * 1.15);
    }
  });
});

describe('shuffle', () => {
  it('keeps every member exactly once', () => {
    const input = students(20);
    const out = shuffle(input);
    expect(out).toHaveLength(20);
    expect(new Set(out.map(s => s.id)).size).toBe(20);
  });

  it('does not mutate the input', () => {
    const input = students(10);
    const before = input.map(s => s.id);
    shuffle(input);
    expect(input.map(s => s.id)).toEqual(before);
  });
});

describe('pickRandom', () => {
  it('returns null for an empty class', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('always returns a member of the list', () => {
    const list = students(6);
    const ids = new Set(list.map(s => s.id));
    for (let i = 0; i < 100; i++) {
      expect(ids.has(pickRandom(list)!.id)).toBe(true);
    }
  });
});

describe('groupCountFor', () => {
  it('turns 10 students at a target of 4 into 3 groups', () => {
    // The teacher's own example: 4/3/3, not 5/5.
    expect(groupCountFor(10, 4)).toBe(3);
  });

  it('makes one group when the class is no bigger than the target', () => {
    expect(groupCountFor(3, 4)).toBe(1);
    expect(groupCountFor(4, 4)).toBe(1);
  });

  it('handles an empty class', () => {
    expect(groupCountFor(0, 4)).toBe(0);
  });

  it('never proposes groups of one by rounding a tiny target up', () => {
    expect(groupCountFor(9, 1)).toBe(5); // target clamped to 2 -> 9/2 rounds to 5
  });
});

describe('splitEvenly', () => {
  it('splits 10 into 3 as 4/3/3', () => {
    expect(splitEvenly(students(10), 3).map(g => g.length)).toEqual([4, 3, 3]);
  });

  it('splits evenly when it divides exactly', () => {
    expect(splitEvenly(students(12), 4).map(g => g.length)).toEqual([3, 3, 3, 3]);
  });

  it('never makes more groups than there are students', () => {
    expect(splitEvenly(students(2), 5).map(g => g.length)).toEqual([1, 1]);
  });

  it('returns nothing for an empty class', () => {
    expect(splitEvenly([], 3)).toEqual([]);
  });
});

describe('makeRandomGroups', () => {
  it('places every student exactly once', () => {
    const roster = students(23);
    const groups = makeRandomGroups(roster, 4);
    const placed = groups.flat().map(s => s.id);
    expect(placed).toHaveLength(23);
    expect(new Set(placed).size).toBe(23);
  });

  it('keeps every group within one of every other', () => {
    for (const [count, target] of [[10, 4], [23, 4], [7, 3], [31, 5]] as const) {
      const sizes = makeRandomGroups(students(count), target).map(g => g.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    }
  });

  it('matches the teacher\'s example of 10 students in groups of 4', () => {
    const sizes = makeRandomGroups(students(10), 4).map(g => g.length).sort();
    expect(sizes).toEqual([3, 3, 4]);
  });

  it('returns nothing for an empty class', () => {
    expect(makeRandomGroups([], 4)).toEqual([]);
  });
});
