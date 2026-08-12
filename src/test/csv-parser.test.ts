import { describe, it, expect } from 'vitest';
import { parseCsvContent, detectMapping, parseCsvLine, joinBackValues } from '@/utils/csv-parser';

describe('CSV Parser', () => {
  describe('joinBackValues', () => {
    const row = { term: 'ephemeral', definition: 'short-lived', example: 'an ephemeral trend' };

    it('joins multiple columns with a blank line', () => {
      expect(joinBackValues(row, ['definition', 'example'])).toBe('short-lived\n\nan ephemeral trend');
    });

    it('returns a single column unchanged', () => {
      expect(joinBackValues(row, ['definition'])).toBe('short-lived');
    });

    it('skips empty columns rather than leaving blank gaps', () => {
      expect(joinBackValues({ ...row, definition: '' }, ['definition', 'example'])).toBe('an ephemeral trend');
    });
  });

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
      expect(mapping).toEqual({ front: 'front', back: ['back'] });
    });

    it('detects term/definition headers', () => {
      const mapping = detectMapping(['term', 'definition']);
      expect(mapping).toEqual({ front: 'term', back: ['definition'] });
    });

    it('detects question/answer headers', () => {
      const mapping = detectMapping(['Question', 'Answer']);
      expect(mapping).toEqual({ front: 'Question', back: ['Answer'] });
    });

    it('puts definition and example together on the back', () => {
      const mapping = detectMapping(['term', 'definition', 'example']);
      expect(mapping).toEqual({ front: 'term', back: ['definition', 'example'] });
    });

    it('falls back to columns 2 and 3 for unknown headers', () => {
      const mapping = detectMapping(['Column A', 'Column B', 'Column C']);
      expect(mapping).toEqual({ front: 'Column A', back: ['Column B', 'Column C'] });
    });

    it('falls back to just column 2 when there is no third column', () => {
      const mapping = detectMapping(['Column A', 'Column B']);
      expect(mapping).toEqual({ front: 'Column A', back: ['Column B'] });
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
      const mapping = { front: 'word', back: ['meaning'] };
      const result = parseCsvContent(content, mapping);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ word: 'hello', meaning: 'world' });
    });

    it('treats a row as valid when any mapped back column has content', () => {
      const content = 'term,definition,example\nhello,a greeting,\nbye,,see you';
      const mapping = { front: 'term', back: ['definition', 'example'] };
      const result = parseCsvContent(content, mapping);
      expect(result.rows).toHaveLength(2);
      expect(result.invalidRows).toBe(0);
    });

    it('drops a row when every mapped back column is empty', () => {
      const content = 'term,definition,example\nhello,,';
      const mapping = { front: 'term', back: ['definition', 'example'] };
      const result = parseCsvContent(content, mapping);
      expect(result.rows).toHaveLength(0);
      expect(result.invalidRows).toBe(1);
    });

    it('handles empty file', () => {
      const result = parseCsvContent('', null);
      expect(result.rows).toHaveLength(0);
      expect(result.totalRows).toBe(0);
    });
  });

  describe('term/definition/example deck', () => {
    const content = [
      'term,definition,example',
      'ephemeral,lasting a very short time,"The trend proved ephemeral, gone within a month."',
      'ubiquitous,found everywhere,Smartphones are ubiquitous these days.',
    ].join('\n');

    it('defaults the back to definition and example combined', () => {
      const mapping = detectMapping(parseCsvContent(content, null).headers)!;
      expect(mapping.back).toEqual(['definition', 'example']);

      const { rows } = parseCsvContent(content, mapping);
      expect(joinBackValues(rows[0], mapping.back)).toBe(
        'lasting a very short time\n\nThe trend proved ephemeral, gone within a month.',
      );
    });

    it('honours narrowing the back down to a single column', () => {
      const mapping = { front: 'term', back: ['definition'] };
      const { rows } = parseCsvContent(content, mapping);
      expect(rows).toHaveLength(2);
      expect(joinBackValues(rows[0], mapping.back)).toBe('lasting a very short time');
    });
  });
});
