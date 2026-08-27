import { describe, expect, it } from 'vitest';
import { passwordRecoveryParams, passwordRecoveryRedirectUrl } from '@/services/auth.service';

describe('password recovery routing', () => {
  it('builds a GitHub Pages-safe reset callback', () => {
    expect(passwordRecoveryRedirectUrl('https://zumboggo.github.io', '/Learningisfun/')).toBe('https://zumboggo.github.io/Learningisfun/?recovery=1#/reset-password');
  });

  it('reads Appwrite credentials placed before the hash', () => {
    expect(passwordRecoveryParams('https://zumboggo.github.io/Learningisfun/?recovery=1&userId=student-1&secret=abc123#/reset-password')).toEqual({ userId: 'student-1', secret: 'abc123' });
  });

  it('also reads credentials appended inside the hash', () => {
    expect(passwordRecoveryParams('https://zumboggo.github.io/Learningisfun/#/reset-password?userId=student-2&secret=secret%20value')).toEqual({ userId: 'student-2', secret: 'secret value' });
  });
});
