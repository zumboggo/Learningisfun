import { describe, it, expect } from 'vitest';
import { parseCsvContent, detectMapping, parseCsvLine } from '@/utils/csv-parser';

describe('CSV Parser', () => {
  describe('parseCsvLine', () => {
    it('parses simple comma-separated values', () => {
      expect(parseCsvLine('hello,world')).toEqual(['hello', 'world']);
    });

    it('handles quoted fields', () => {
      expect(parseCsvLine('"hello, world",test')).toEqual(['hello, world', 'test']);
    });

    it('handles escaped quotes', () => {
      expect(parseCsvLine('"say ""hello""",test')).toEqual(['say "hello"', 'test']);
    });

    it('handles Unicode content', () => {
      expect(parseCsvLine('你好,世界')).toEqual(['你好', '世界']);
      expect(parseCsvLine('café,naïve')).toEqual(['café', 'naïve']);
      expect(parseCsvLine('日本語,テスト')).toEqual(['日本語', 'テスト']);
    });
  });

  describe('detectMapping', () => {
    it('detects front/back headers', () => {
      const mapping = detectMapping(['front', 'back']);
      expect(mapping).toEqual({ front: 'front', back: 'back' });
    });

    it('detects term/definition headers', () => {
      const mapping = detectMapping(['term', 'definition']);
      expect(mapping).toEqual({ front: 'term', back: 'definition' });
    });

    it('detects question/answer headers', () => {
      const mapping = detectMapping(['Question', 'Answer']);
      expect(mapping).toEqual({ front: 'Question', back: 'Answer' });
    });

    it('falls back to first two columns for unknown headers', () => {
      const mapping = detectMapping(['Column A', 'Column B', 'Column C']);
      expect(mapping).toEqual({ front: 'Column A', back: 'Column B' });
    });

    it('returns null for single column', () => {
      const mapping = detectMapping(['only']);
      expect(mapping).toBeNull();
    });
  });

  describe('parseCsvContent', () => {
    it('parses a complete CSV with headers', () => {
      const content = 'front,back\nhello,world\nfoo,bar';
      const result = parseCsvContent(content, null);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ front: 'hello', back: 'world' });
      expect(result.rows[1]).toEqual({ front: 'foo', back: 'bar' });
      expect(result.totalRows).toBe(2);
      expect(result.invalidRows).toBe(0);
    });

    it('handles Unicode content', () => {
      const content = 'front,back\n你好,世界\ncafé,naïve';
      const result = parseCsvContent(content, null);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].front).toBe('你好');
      expect(result.rows[0].back).toBe('世界');
      expect(result.rows[1].front).toBe('café');
      expect(result.rows[1].back).toBe('naïve');
    });

    it('identifies empty rows', () => {
      const content = 'front,back\nhello,world\n,,\nfoo,bar';
      const result = parseCsvContent(content, null);
      expect(result.rows).toHaveLength(2);
      expect(result.emptyRows).toBe(1);
    });

    it('identifies invalid rows (missing front or back)', () => {
      const content = 'front,back\nhello,world\nhello,\n,bar';
      const result = parseCsvContent(content, null);
      expect(result.rows).toHaveLength(1);
      expect(result.invalidRows).toBe(2);
    });

    it('deduplicates identical cards', () => {
      const content = 'front,back\nhello,world\nhello,world';
      const result = parseCsvContent(content, null);
      expect(result.rows).toHaveLength(1);
      expect(result.duplicates).toBe(1);
    });

    it('identifies long fields', () => {
      const longText = 'a'.repeat(6000);
      const content = `front,back\nhello,${longText}`;
      const result = parseCsvContent(content, null);
      expect(result.rows).toHaveLength(1);
      expect(result.longFields).toBe(1);
    });

    it('uses custom mapping when provided', () => {
      const content = 'word,meaning\nhello,world';
      const mapping = { front: 'word', back: 'meaning' };
      const result = parseCsvContent(content, mapping);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ word: 'hello', meaning: 'world' });
    });

    it('handles empty file', () => {
      const result = parseCsvContent('', null);
      expect(result.rows).toHaveLength(0);
      expect(result.totalRows).toBe(0);
    });
  });
});
