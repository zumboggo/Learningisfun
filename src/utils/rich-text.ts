const BLOCK_TAGS = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'ASIDE']);

export function htmlToMarkdown(html: string): string {
  if (!html.trim() || typeof DOMParser === 'undefined') return '';
  const document = new DOMParser().parseFromString(html, 'text/html');
  const markdown = [...document.body.childNodes].map(node => nodeToMarkdown(node)).join('');
  return cleanupMarkdown(markdown);
}

export function clipboardToMarkdown(html:string,plainText:string):string{
  return html.trim()?htmlToMarkdown(html):plainText.replace(/\r\n?/g,'\n').trim();
}

export function markdownToEditorHtml(markdown:string):string{
  const lines=markdown.replace(/\r\n?/g,'\n').split('\n'),blocks:string[]=[];
  for(let index=0;index<lines.length;){const line=lines[index],trimmed=line.trim();if(!trimmed){index++;continue;}
    if(index+1<lines.length&&line.includes('|')&&/^\s*\|?\s*:?-{3,}/.test(lines[index+1])){const rows:string[][]=[markdownTableCells(line)];index+=2;while(index<lines.length&&lines[index].includes('|')&&lines[index].trim())rows.push(markdownTableCells(lines[index++]));blocks.push(`<table><thead><tr>${rows[0].map(cell=>`<th>${inlineMarkdownToHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(row=>`<tr>${row.map(cell=>`<td>${inlineMarkdownToHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);continue;}
    const heading=/^(#{1,3})\s+(.+)$/.exec(trimmed);if(heading){blocks.push(`<h${heading[1].length}>${inlineMarkdownToHtml(heading[2])}</h${heading[1].length}>`);index++;continue;}
    if(/^[-*]\s+/.test(trimmed)){const items:string[]=[];while(index<lines.length&&/^[-*]\s+/.test(lines[index].trim()))items.push(`<li>${inlineMarkdownToHtml(lines[index++].trim().slice(2))}</li>`);blocks.push(`<ul>${items.join('')}</ul>`);continue;}
    if(/^\d+\.\s+/.test(trimmed)){const items:string[]=[];while(index<lines.length&&/^\d+\.\s+/.test(lines[index].trim()))items.push(`<li>${inlineMarkdownToHtml(lines[index++].trim().replace(/^\d+\.\s+/,''))}</li>`);blocks.push(`<ol>${items.join('')}</ol>`);continue;}
    const paragraph:string[]=[];while(index<lines.length&&lines[index].trim()&&!/^(#{1,3})\s+/.test(lines[index].trim())&&!/^[-*]\s+/.test(lines[index].trim())&&!/^\d+\.\s+/.test(lines[index].trim()))paragraph.push(lines[index++].trim());blocks.push(`<p>${inlineMarkdownToHtml(paragraph.join(' '))}</p>`);
  }return blocks.join('');
}

function escapeHtml(value:string):string{return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function inlineMarkdownToHtml(value:string):string{return escapeHtml(value).replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|mailto:[^)]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>')}
function markdownTableCells(line:string):string[]{return line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(cell=>cell.trim().replace(/\\\|/g,'|'))}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').replace(/\s+/g, ' ');
  if (!(node instanceof HTMLElement)) return '';
  const content = [...node.childNodes].map(child => nodeToMarkdown(child)).join('');
  const trimmed = content.trim();

  if (node.tagName === 'BR') return '\n';
  if (['STRONG', 'B'].includes(node.tagName)) return trimmed ? `**${trimmed}**` : '';
  if (['EM', 'I'].includes(node.tagName)) return trimmed ? `*${trimmed}*` : '';
  if (node.tagName === 'CODE' && node.parentElement?.tagName !== 'PRE') return trimmed ? `\`${trimmed}\`` : '';
  if (node.tagName === 'PRE') return trimmed ? `\n\n\`\`\`\n${node.textContent?.trim() || ''}\n\`\`\`\n\n` : '';
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') || '';
    return trimmed && /^(https?:|mailto:)/i.test(href) ? `[${trimmed}](${href})` : trimmed;
  }
  if (/^H[1-6]$/.test(node.tagName)) {
    const level = Math.min(3, Number(node.tagName.slice(1)) || 1);
    return trimmed ? `\n\n${'#'.repeat(level)} ${trimmed}\n\n` : '';
  }
  if (node.tagName === 'BLOCKQUOTE') {
    return trimmed ? `\n\n${trimmed.split('\n').map(line => `> ${line}`).join('\n')}\n\n` : '';
  }
  if (node.tagName === 'HR') return '\n\n---\n\n';
  if (node.tagName === 'UL' || node.tagName === 'OL') return listToMarkdown(node);
  if (node.tagName === 'TABLE') return tableToMarkdown(node);
  if (node.tagName === 'IMG') return '';
  if (BLOCK_TAGS.has(node.tagName)) return trimmed ? `\n\n${trimmed}\n\n` : '';
  return content;
}

function listToMarkdown(list: HTMLElement): string {
  const ordered = list.tagName === 'OL';
  const items = [...list.children].filter(child => child.tagName === 'LI').map((item, index) => {
    const text = [...item.childNodes]
      .filter(child => !(child instanceof HTMLElement && ['UL', 'OL'].includes(child.tagName)))
      .map(child => nodeToMarkdown(child)).join('').trim();
    return `${ordered ? `${index + 1}.` : '-'} ${text}`;
  }).filter(line => !/^(-|\d+\.)\s*$/.test(line));
  return items.length ? `\n\n${items.join('\n')}\n\n` : '';
}

function tableToMarkdown(table: HTMLElement): string {
  const rows = [...table.querySelectorAll('tr')].map(row => [...row.querySelectorAll(':scope > th, :scope > td')].map(cell => cleanupInline(nodeToMarkdown(cell)).replaceAll('|', '\\|'))).filter(row => row.length);
  if (!rows.length) return '';
  const width = Math.max(...rows.map(row => row.length));
  const normalized = rows.map(row => [...row, ...Array(width - row.length).fill('')]);
  return `\n\n| ${normalized[0].join(' | ')} |\n| ${Array(width).fill('---').join(' | ')} |\n${normalized.slice(1).map(row => `| ${row.join(' | ')} |`).join('\n')}\n\n`;
}

function cleanupInline(value: string): string { return value.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim(); }
function cleanupMarkdown(value: string): string {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +([,.;:!?])/g, '$1')
    .trim();
}
