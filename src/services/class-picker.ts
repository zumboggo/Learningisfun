/**
 * Picking a student at random and splitting a class into groups.
 *
 * Pure module — no Dexie, no DOM — so the fairness rules can be tested directly.
 *
 * "Random" here means cryptographically random, not `Math.random()`. In front of
 * a class the draw has to be defensible: students notice when the same person
 * gets called twice in a row and will say the wheel is rigged.
 */

export interface Pickable {
  id: string;
  name: string;
}

/**
 * A uniformly random integer in [0, max). Rejection sampling, because taking
 * `random % max` biases the low end whenever max does not divide 2^32.
 */
export function randomInt(max: number): number {
  if (max <= 0) throw new Error('randomInt needs a positive bound');
  if (max === 1) return 0;

  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
}

/** Fisher-Yates using the unbiased source above. Returns a new array. */
export function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[randomInt(items.length)];
}

/**
 * How many groups to make so every group is the target size or within one of it.
 *
 * Round-to-nearest rather than floor: 10 students at a target of 4 gives 3
 * groups (4/3/3) — the teacher's example — instead of 2 groups of 5, which is
 * two away from what they asked for.
 */
export function groupCountFor(studentCount: number, targetSize: number): number {
  if (studentCount <= 0) return 0;
  const size = Math.max(2, Math.round(targetSize));
  if (studentCount <= size) return 1;
  return Math.max(1, Math.round(studentCount / size));
}

/**
 * Split into `groupCount` groups whose sizes differ by at most one, filling the
 * larger groups first. 10 into 3 gives 4/3/3.
 */
export function splitEvenly<T>(items: T[], groupCount: number): T[][] {
  if (groupCount <= 0 || items.length === 0) return [];
  const count = Math.min(groupCount, items.length);
  const base = Math.floor(items.length / count);
  const remainder = items.length % count;

  const groups: T[][] = [];
  let cursor = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < remainder ? 1 : 0);
    groups.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return groups;
}

/**
 * Shuffle the class and deal it into groups of roughly `targetSize`.
 * Every group ends up within one student of every other.
 */
export function makeRandomGroups<T extends Pickable>(students: T[], targetSize: number): T[][] {
  if (students.length === 0) return [];
  return splitEvenly(shuffle(students), groupCountFor(students.length, targetSize));
}
