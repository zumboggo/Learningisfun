function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inlineMarkdownToHtml(value: string): string {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|mailto:[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function markdownToEditorHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (index + 1 < lines.length && line.includes('|') && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const rows: string[][] = [tableCells(line)];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) rows.push(tableCells(lines[index++]));
      blocks.push(`<table><thead><tr>${rows[0].map(cell=>`<th>${inlineMarkdownToHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(row=>`<tr>${row.map(cell=>`<td>${inlineMarkdownToHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (heading) { blocks.push(`<h${heading[1].length}>${inlineMarkdownToHtml(heading[2])}</h${heading[1].length}>`); index += 1; continue; }
    if (/^[-*]\s+/.test(line.trim())) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) items.push(`<li>${inlineMarkdownToHtml(lines[index++].trim().slice(2))}</li>`);
      blocks.push(`<ul>${items.join('')}</ul>`); continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+/.test(lines[index].trim()) && !/^[-*]\s+/.test(lines[index].trim())) paragraph.push(lines[index++].trim());
    blocks.push(`<p>${inlineMarkdownToHtml(paragraph.join(' '))}</p>`);
  }
  return blocks.join('');
}

function tableCells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim().replace(/\\\|/g, '|'));
}

function safeLink(value: string | null): string | null {
  if (!value) return null;
  return /^(https?:|mailto:)/i.test(value.trim()) ? value.trim() : null;
}

export function htmlToMarkdown(html: string): string {
  const documentNode = new DOMParser().parseFromString(html, 'text/html');

  const convert = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').replace(/\u00a0/g, ' ');
    if (!(node instanceof HTMLElement)) return '';
    const tag = node.tagName.toLowerCase();
    if (['script', 'style', 'meta', 'link'].includes(tag)) return '';
    const children = [...node.childNodes].map(convert).join('');
    if (tag === 'br') return '\n';
    if (tag === 'strong' || tag === 'b') return children.trim() ? `**${children.trim()}**` : '';
    if (tag === 'em' || tag === 'i') return children.trim() ? `*${children.trim()}*` : '';
    if (/^h[1-3]$/.test(tag)) return `${'#'.repeat(Number(tag[1]))} ${children.trim()}\n\n`;
    if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article') return `${children.trim()}\n\n`;
    if (tag === 'li') return `- ${children.trim()}\n`;
    if (tag === 'ul' || tag === 'ol') return `${children.trimEnd()}\n\n`;
    if (tag === 'blockquote') return `${children.trim().split('\n').map(line => `> ${line}`).join('\n')}\n\n`;
    if (tag === 'a') { const href = safeLink(node.getAttribute('href')); return href ? `[${children.trim()}](${href})` : children; }
    if (tag === 'table') return tableToMarkdown(node);
    return children;
  };

  return [...documentNode.body.childNodes].map(convert).join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tableToMarkdown(table: HTMLElement): string {
  const rows = [...table.querySelectorAll('tr')].map(row => [...row.querySelectorAll(':scope > th, :scope > td')].map(cell => (cell.textContent || '').trim().replace(/\|/g, '\\|'))).filter(row => row.length);
  if (!rows.length) return '';
  const width = Math.max(...rows.map(row => row.length));
  const normalized = rows.map(row => [...row, ...Array(width - row.length).fill('')]);
  return `${normalized.map(row => `| ${row.join(' | ')} |`).join('\n').replace('\n', `\n| ${Array(width).fill('---').join(' | ')} |\n`)}\n\n`;
}

export function clipboardToMarkdown(html: string, plainText: string): string {
  return html.trim() ? htmlToMarkdown(html) : plainText.replace(/\r\n?/g, '\n').trim();
}
