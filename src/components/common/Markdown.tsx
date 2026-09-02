/* eslint-disable react-refresh/only-export-components -- this shared renderer also exposes its matching word counter */
import type { ReactNode } from 'react';

interface MarkdownProps {
  content: string;
  className?: string;
}

const INLINE_TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;

export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`space-y-3 leading-relaxed ${className}`}>
      {renderBlocks(content)}
    </div>
  );
}

export function countMarkdownWords(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

function renderBlocks(content: string): ReactNode[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (index + 1 < lines.length && isTableRow(trimmed) && isTableSeparator(lines[index + 1])) {
      const headers = tableCells(trimmed);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && isTableRow(lines[index].trim())) {
        rows.push(tableCells(lines[index].trim()));
        index += 1;
      }
      blocks.push(
        <div key={`table-${index}`} className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead><tr>{headers.map((cell, i) => <th key={i} className="border bg-gray-50 px-3 py-2 font-semibold">{renderInline(cell, `th-${index}-${i}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, r) => <tr key={r}>{headers.map((_, c) => <td key={c} className="border px-3 py-2 align-top">{renderInline(row[c] || '', `td-${index}-${r}-${c}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim();
        if (!item.startsWith('- ') && !item.startsWith('* ')) break;
        items.push(item.slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1">
          {items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>{renderInline(item, `${index}-${itemIndex}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = /^\d+\.\s+(.+)$/.exec(lines[index].trim());
        if (!match) break;
        items.push(match[1]); index += 1;
      }
      blocks.push(<ol key={`ol-${index}`} className="list-decimal space-y-1 pl-5">{items.map((item,itemIndex)=><li key={`${index}-${itemIndex}`}>{renderInline(item,`${index}-${itemIndex}`)}</li>)}</ol>);
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-gray-300 pl-3 text-gray-600">
          {renderInline(quoteLines.join(' '), `quote-${index}`)}
        </blockquote>,
      );
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const classes = level === 1
        ? 'text-2xl font-bold'
        : level === 2
          ? 'text-xl font-semibold'
          : 'text-lg font-semibold';
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3');
      blocks.push(
        <Tag key={`h-${index}`} className={classes}>
          {renderInline(text, `h-${index}`)}
        </Tag>,
      );
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || next.startsWith('- ') || next.startsWith('* ') || next.startsWith('>') || /^\d+\.\s+/.test(next) || /^#{1,3}\s+/.test(next)) break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap">
        {renderInline(paragraph.join(' '), `p-${index}`)}
      </p>,
    );
  }

  return blocks;
}

function isTableRow(line: string): boolean { return line.includes('|') && tableCells(line).length > 1; }
function isTableSeparator(line: string): boolean { const cells = tableCells(line.trim()); return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell)); }
function tableCells(line: string): string[] { return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()); }

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-${index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(<code key={`${keyPrefix}-${index}`} className="rounded bg-gray-100 px-1 py-0.5 text-sm">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const href = link ? safeHref(link[2]) : null;
      nodes.push(
        href ? (
          <a key={`${keyPrefix}-${index}`} href={href} className="text-blue-600 underline" target="_blank" rel="noreferrer">
            {renderInline(link?.[1] || '', `${keyPrefix}-${index}-link`)}
          </a>
        ) : token,
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`${keyPrefix}-${index}`}>{token.slice(1, -1)}</em>);
    } else {
      nodes.push(token);
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function safeHref(value: string): string | null {
  const trimmed = value.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return null;
}
