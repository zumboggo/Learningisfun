import type { KnownGrowthPoint } from '@/services/study-insights';

const W = 320;
const H = 110;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 16;

function friendlyDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Growth of the student's known-word count.
 *
 * Counts words currently at a two-week interval or longer, placed at the date
 * they were last reviewed, so the line only ever climbs.
 */
export function KnownGrowthChart({ points }: { points: KnownGrowthPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="py-4 text-center text-sm text-slate-400">
        Keep reviewing — your growth curve appears once you have a few days of history.
      </p>
    );
  }

  const first = points[0].known;
  const last = points[points.length - 1].known;
  const gained = last - first;
  const yMax = Math.max(1, last) * 1.1;

  const x = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / (points.length - 1);
  const y = (v: number) => H - PAD_B - (v / yMax) * (H - PAD_T - PAD_B);

  const line = points.map((p, i) => `${x(i)},${y(p.known)}`).join(' ');
  const area = `${PAD_L},${H - PAD_B} ${line} ${x(points.length - 1)},${H - PAD_B}`;

  return (
    <div>
      <dl className="pace-summary">
        <div>
          <dt>Known now</dt>
          <dd>{last}</dd>
        </div>
        <div>
          <dt>Gained</dt>
          <dd>{gained > 0 ? `+${gained}` : gained}</dd>
        </div>
        <div>
          <dt>Since</dt>
          <dd>{friendlyDate(points[0].date)}</dd>
        </div>
      </dl>

      <svg
        className="growth-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Known words grew from ${first} to ${last} since ${friendlyDate(points[0].date)}.`}
      >
        <polygon className="growth-area" points={area} />
        <polyline className="growth-line" points={line} />
        <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} className="pace-axis" />
        <text x={2} y={PAD_T + 4} className="pace-tick">{Math.round(yMax)}</text>
        <text x={2} y={H - PAD_B} className="pace-tick">0</text>
        <circle className="growth-head" cx={x(points.length - 1)} cy={y(last)} r={3} />
      </svg>

      <div className="pace-axis-labels">
        <span>{friendlyDate(points[0].date)}</span>
        <span>{friendlyDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
