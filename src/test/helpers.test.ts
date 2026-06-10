import { describe, it, expect } from 'vitest';
import { generateJoinCode, generateDeviceId, generateId } from '@/utils/helpers';

describe('Helpers', () => {
  describe('generateJoinCode', () => {
    it('generates a 6-character code', () => {
      const code = generateJoinCode();
      expect(code).toHaveLength(6);
    });

    it('generates uppercase alphanumeric codes', () => {
      const code = generateJoinCode();
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
    });

    it('generates different codes', () => {
      const codes = new Set(Array.from({ length: 100 }, () => generateJoinCode()));
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('generateId', () => {
    it('generates a UUID', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('generates unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });
});
