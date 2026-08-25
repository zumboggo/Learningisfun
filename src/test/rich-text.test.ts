import { describe, expect, it } from 'vitest';
import { clipboardToMarkdown, htmlToMarkdown, markdownToEditorHtml } from '@/utils/rich-text';

describe('rich class notes conversion', () => {
  it('preserves bold, italics, and paragraph spacing from pasted HTML', () => {
    expect(htmlToMarkdown('<p><strong>Important</strong> and <em>emphasized</em>.</p><p>Second paragraph.</p>'))
      .toBe('**Important** and *emphasized*.\n\nSecond paragraph.');
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
