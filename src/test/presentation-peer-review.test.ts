import { describe, expect, it } from 'vitest';
import { scoreReview } from '@/services/presentation-peer-review.service';

describe('PVLEGS percentage scoring', () => {
  it('maps all below expectations ratings to 50 percent', () => {
    expect(scoreReview({poise:1,voice:1,life:1,eyeContact:1,gestures:1,speed:1})).toBe(50);
  });

  it('maps all meeting expectations ratings to 75 percent', () => {
    expect(scoreReview({poise:2,voice:2,life:2,eyeContact:2,gestures:2,speed:2})).toBe(75);
  });

  it('maps all exceeding expectations ratings to 100 percent', () => {
    expect(scoreReview({poise:3,voice:3,life:3,eyeContact:3,gestures:3,speed:3})).toBe(100);
  });
});
