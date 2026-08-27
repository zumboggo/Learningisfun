import { describe,expect,it } from 'vitest';
import { splitParagraphs } from '@/services/text.service';
import { htmlToMarkdown } from '@/utils/rich-text';

describe('text paragraph import',()=>{
  it('splits blank-line paragraphs and joins plain wrapped lines',()=>{
    expect(splitParagraphs('First line\nwraps here.\n\nSecond paragraph.')).toEqual(['First line wraps here.','Second paragraph.']);
  });
  it('preserves markdown lists and tables inside one annotatable block',()=>{
    expect(splitParagraphs('- One\n- Two\n\n| A | B |\n| --- | --- |\n| 1 | 2 |')).toEqual(['- One\n- Two','| A | B |\n| --- | --- |\n| 1 | 2 |']);
  });
  it('ignores empty paragraphs and normalizes Windows line endings',()=>{
    expect(splitParagraphs('  One\r\n\r\n\r\n Two  ')).toEqual(['One','Two']);
  });
  it('converts common rich-text formatting into markdown',()=>{
    expect(htmlToMarkdown('<h2>Focus</h2><p>A <strong>bold</strong> and <em>careful</em> claim.</p><ul><li>First</li><li>Second</li></ul>')).toBe('## Focus\n\nA **bold** and *careful* claim.\n\n- First\n- Second');
  });
  it('converts pasted tables into markdown tables',()=>{
    expect(htmlToMarkdown('<table><tr><th>Name</th><th>Score</th></tr><tr><td>Ana</td><td>3</td></tr></table>')).toContain('| Name | Score |\n| --- | --- |\n| Ana | 3 |');
  });
});
