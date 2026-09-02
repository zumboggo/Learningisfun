import { describe, expect, it } from 'vitest';
import { clipboardToMarkdown, htmlToMarkdown, markdownToEditorHtml } from '@/utils/rich-text';

describe('rich class notes conversion', () => {
  it('preserves bold, italics, and paragraph spacing from pasted HTML', () => {
    expect(htmlToMarkdown('<p><strong>Important</strong> and <em>emphasized</em>.</p><p>Second paragraph.</p>'))
      .toBe('**Important** and *emphasized*.\n\nSecond paragraph.');
  });

  it('keeps safe links attached to their linked words through paste and reopen', () => {
    const markdown = clipboardToMarkdown(
      '<p>Read <a href="https://example.com/article?q=world lit"><strong>the full article</strong></a>.</p>',
      'Read the full article.',
    );
    expect(markdown).toBe('Read [**the full article**](https://example.com/article?q=world%20lit).');
    expect(markdownToEditorHtml(markdown)).toContain('<a href="https://example.com/article?q=world%20lit"><strong>the full article</strong></a>');
  });

  it('keeps relative pasted links but removes unsafe link actions', () => {
    expect(htmlToMarkdown('<a href="/reading/one">Reading one</a>')).toBe('[Reading one](/reading/one)');
    expect(htmlToMarkdown('<a href="javascript:alert(1)">Unsafe</a>')).toBe('Unsafe');
  });

  it('removes scripts while preserving useful list structure', () => {
    expect(htmlToMarkdown('<script>alert(1)</script><ul><li>First</li><li><b>Second</b></li></ul>'))
      .toBe('- First\n- **Second**');
  });

  it('falls back to plain clipboard text', () => {
    expect(clipboardToMarkdown('', 'Line one\r\n\r\nLine two')).toBe('Line one\n\nLine two');
  });

  it('reopens stored Markdown as formatted editor content', () => {
    expect(markdownToEditorHtml('A **bold** and *italic* note.'))
      .toBe('<p>A <strong>bold</strong> and <em>italic</em> note.</p>');
  });

  it('reopens Markdown tables as editable tables', () => {
    expect(markdownToEditorHtml('| Term | Meaning |\n| --- | --- |\n| Theme | Central idea |'))
      .toContain('<table><thead><tr><th>Term</th><th>Meaning</th></tr></thead>');
  });
});
