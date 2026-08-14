import { useMemo } from 'react';
import type { PaceSeries } from '@/services/study-insights';
import { getPaceVerdict } from '@/services/study-insights';

const W = 320;
const H = 128;
const PAD_L = 26;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 18;

function friendlyDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Daily reviewing pace against the learner's own normal range.
 *
 * The shaded band is the range this student usually works in, computed from
 * their own history — not a target to hit. Days outside it are worth a look:
 * a slow day often means interruptions or a card you got stuck on, a fast one
 * often means clicking through without really recalling.
 */
export function ReviewPaceChart({ series }: { series: PaceSeries }) {
  const { points, center, upperLimit, lowerLimit } = series;
  const verdict = getPaceVerdict(series);

  const chart = useMemo(() => {
    const values = points
      .map(p => p.value)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const max = Math.max(1, upperLimit ?? 0, ...values);
    const yMax = max * 1.12;

    const x = (i: number) =>
      points.length <= 1
        ? PAD_L
        : PAD_L + (i * (W - PAD_L - PAD_R)) / (points.length - 1);
    const y = (v: number) => H - PAD_B - (v / yMax) * (H - PAD_T - PAD_B);

    // Break the line wherever a run of study days is interrupted, so a gap
    // reads as "no study" rather than a straight line through it.
    const segments: Array<Array<{ x: number; y: number }>> = [];
    let current: Array<{ x: number; y: number }> = [];
    points.forEach((point, i) => {
      if (point.value === null) {
        if (current.length) segments.push(current);
        current = [];
      } else {
        current.push({ x: x(i), y: y(point.value) });
      }
    });
    if (current.length) segments.push(current);

    return { x, y, yMax, segments };
  }, [points, upperLimit]);

  const studied = points.filter(p => p.value !== null);
  if (studied.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-400">
        Review some cards to start tracking your pace.
      </p>
    );
  }

  const latest = studied[studied.length - 1];
  const hasBand = center !== null && upperLimit !== null && lowerLimit !== null;

  return (
    <div>
      <dl className="pace-summary">
        <div>
          <dt>Latest</dt>
          <dd>{latest.value?.toFixed(1)} / 10 min</dd>
        </div>
        <div>
          <dt>Your normal</dt>
          <dd>{center !== null ? `${center.toFixed(1)} / 10 min` : 'Building'}</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>
            {hasBand ? `${lowerLimit.toFixed(1)}-${upperLimit.toFixed(1)}` : '--'}
          </dd>
        </div>
      </dl>

      <span className={`pace-verdict pace-verdict-${verdict.verdict}`}>{verdict.label}</span>

      <svg
        className="pace-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          `Reviewing pace over ${points.length} days. Latest ${latest.value?.toFixed(1)} ` +
          `successful recalls per 10 minutes. ${verdict.label}.`
        }
      >
        {hasBand && (
          <>
            {/* The normal range. */}
            <rect
              x={PAD_L}
              y={chart.y(upperLimit)}
              width={W - PAD_L - PAD_R}
              height={Math.max(1, chart.y(lowerLimit) - chart.y(upperLimit))}
              className="pace-band"
            />
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={chart.y(center)}
              y2={chart.y(center)}
              className="pace-center"
            />
          </>
        )}

        {/* Baseline. */}
        <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} className="pace-axis" />

        <text x={2} y={PAD_T + 4} className="pace-tick">{Math.round(chart.yMax)}</text>
        <text x={2} y={H - PAD_B} className="pace-tick">0</text>

        {chart.segments.map((segment, i) => (
          <polyline
            key={i}
            className="pace-line"
            points={segment.map(p => `${p.x},${p.y}`).join(' ')}
          />
        ))}

        {points.map((point, i) =>
          point.value === null ? null : (
            <circle
              key={point.date}
              cx={chart.x(i)}
              cy={chart.y(point.value)}
              r={point.signal ? 3.5 : 2}
              className={`pace-dot${point.signal ? ` pace-dot-${point.signal}` : ''}`}
            >
              <title>
                {`${friendlyDate(point.date)}: ${point.value.toFixed(1)} per 10 min ` +
                  `(${point.successfulRecalls}/${point.recallAttempts} good or easy, ` +
                  `${point.studyMinutes.toFixed(0)} min)`}
              </title>
            </circle>
          ),
        )}
      </svg>

      <div className="pace-axis-labels">
        <span>{friendlyDate(points[0].date)}</span>
        <span>{friendlyDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
