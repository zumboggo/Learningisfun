import { describe, it, expect } from 'vitest';
import { classLabel, generateJoinCode, generateDeviceId, generateId } from '@/utils/helpers';

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

  describe('classLabel', () => {
    it('names the course before the section so two "Section 1"s can be told apart', () => {
      expect(classLabel({ courseName: 'AP Biology', name: 'Section 1' })).toBe('AP Biology · Section 1');
    });

    it('falls back to whichever half exists', () => {
      expect(classLabel({ courseName: 'AP Biology', name: '' })).toBe('AP Biology');
      expect(classLabel({ courseName: '', name: 'Section 2' })).toBe('Section 2');
    });

    it('never renders an empty label', () => {
      expect(classLabel(null)).toBe('Class');
      expect(classLabel({ courseName: '  ', name: '' })).toBe('Class');
    });
  });
});
