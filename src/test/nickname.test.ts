import { describe, expect, it } from 'vitest';
import { nicknameValidationError, nextNicknameChangeAt } from '@/services/nickname.service';

describe('student nickname safety', () => {
  it('accepts ordinary multilingual and punctuated nicknames', () => {
    expect(nicknameValidationError('Maya L.')).toBeNull();
    expect(nicknameValidationError('小明')).toBeNull();
    expect(nicknameValidationError("O'Connor")).toBeNull();
  });

  it('blocks obvious profanity even with common substitutions', () => {
    expect(nicknameValidationError('f.u.c.k')).not.toBeNull();
    expect(nicknameValidationError('sh1t-post')).not.toBeNull();
    expect(nicknameValidationError('Admin')).not.toBeNull();
  });

  it('allows a new change only after 24 hours', () => {
    const recent = nextNicknameChangeAt({ nicknameUpdatedAt: new Date(Date.now() - 60_000).toISOString() });
    const old = nextNicknameChangeAt({ nicknameUpdatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() });
    expect(recent).toBeInstanceOf(Date);
    expect(old).toBeNull();
  });
});
