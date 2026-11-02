import type { ReactNode } from 'react';
import './weekly-materials.css';

export type MaterialColor = 'emerald' | 'orange' | 'blue' | 'fuchsia' | 'slate' | 'cyan' | 'violet' | 'amber';
const symbols: Record<MaterialColor, string> = { emerald: '▤', orange: '▶', blue: '▥', fuchsia: '↗', slate: '▤', cyan: '✎', violet: '☏', amber: '?' };
export function WeeklyMaterialRow({ title, count, color, children, columns = 2 }: { title: string; count: number; color: MaterialColor; children: ReactNode; columns?: 1 | 2 | 3 }) {
  return <section className={`weekly-row weekly-${color}`} aria-label={title}>
    <h3 className="weekly-row-heading"><span className="weekly-type-icon" aria-hidden="true">{symbols[color]}</span>{title}<span className="weekly-count">{count} {count === 1 ? 'item' : 'items'}</span></h3>
    <div className={`weekly-tiles weekly-columns-${columns}`}>{children}</div>
  </section>;
}
