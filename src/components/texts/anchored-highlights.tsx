import { Children, cloneElement, isValidElement, type ReactNode } from 'react';

export type PassageHighlight = { id: string; quote: string };

// Work on rendered text, so a selection spanning bold/italic/link nodes stays anchored.
export function anchorHighlights(nodes: ReactNode, highlights: PassageHighlight[], onOpen?: (id: string) => void): ReactNode {
  const plain = (node: ReactNode): string => Children.toArray(node).map(child =>
    typeof child === 'string' || typeof child === 'number' ? String(child) :
      isValidElement<{ children?: ReactNode }>(child) ? plain(child.props.children) : '',
  ).join('');
  const text = plain(nodes);
  const ranges = highlights.flatMap(({ id, quote }) => {
    const start = quote ? text.indexOf(quote) : -1;
    // Older records have no offsets: never guess between repeated phrases.
    return start >= 0 && text.indexOf(quote, start + 1) < 0 ? [{ id, start, end: start + quote.length }] : [];
  });
  let offset = 0;
  const visit = (node: ReactNode): ReactNode => Children.map(node, child => {
    if (typeof child === 'string' || typeof child === 'number') {
      const value = String(child), start = offset; offset += value.length;
      const cuts = [...new Set([0, value.length, ...ranges.flatMap(range => [range.start - start, range.end - start]).filter(n => n > 0 && n < value.length)])].sort((a, b) => a - b);
      return cuts.slice(0, -1).map((cut, i) => {
        const match = ranges.find(range => range.start <= start + cut && range.end > start + cut);
        const part = value.slice(cut, cuts[i + 1]);
        return match ? <mark key={cut} className="passage-highlight" role="button" tabIndex={0} aria-label="Show notes for highlighted passage" onClick={event => { event.preventDefault(); event.stopPropagation(); onOpen?.(match.id); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onOpen?.(match.id); } }}>{part}</mark> : part;
      });
    }
    return isValidElement<{ children?: ReactNode }>(child) ? cloneElement(child, {}, visit(child.props.children)) : child;
  });
  return visit(nodes);
}
