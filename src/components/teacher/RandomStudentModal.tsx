import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { pickRandom, type Pickable } from '@/services/class-picker';

/** Spin lengths, in milliseconds. */
const SPEEDS = [
  { key: 'fast', label: 'Fast', ms: 1000 },
  { key: 'normal', label: 'Normal', ms: 2500 },
  { key: 'slow', label: 'Slow', ms: 4000 },
] as const;

type SpeedKey = (typeof SPEEDS)[number]['key'];

const WHEEL_COLOURS = [
  '#2563eb', '#0891b2', '#7c3aed', '#db2777',
  '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
];

/**
 * Spins a wheel of student names and lands on one.
 *
 * The winner is drawn up front with `pickRandom` (crypto-backed, unbiased) and
 * the wheel is then rotated to wherever that name sits. The animation is
 * theatre; the draw is not influenced by it, by wheel geometry, or by how long
 * the spin runs.
 */
export function RandomStudentModal({
  open,
  students,
  onClose,
}: {
  open: boolean;
  students: Pickable[];
  onClose: () => void;
}) {
  const [speed, setSpeed] = useState<SpeedKey>('normal');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Pickable | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);

  const pool = students.filter(s => !excluded.has(s.id));
  const spinMs = SPEEDS.find(s => s.key === speed)!.ms;

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  // Reopening should not show the previous draw's winner. Modal routes every
  // dismissal — backdrop, close button and Escape — through onClose, so
  // resetting here covers them all.
  const handleClose = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setWinner(null);
    setSpinning(false);
    onClose();
  };

  const spin = () => {
    if (spinning || pool.length === 0) return;
    const chosen = pickRandom(pool);
    if (!chosen) return;

    setWinner(null);
    setSpinning(true);

    // Rotate so the chosen wedge finishes under the pointer at the top, after a
    // few full turns for the drama.
    const wedge = 360 / pool.length;
    const index = pool.findIndex(s => s.id === chosen.id);
    const target = 360 - (index * wedge + wedge / 2);
    const turns = speed === 'fast' ? 3 : speed === 'normal' ? 5 : 8;
    const next = rotation + turns * 360 + ((target - (rotation % 360)) + 360) % 360;
    setRotation(next);

    timerRef.current = window.setTimeout(() => {
      setWinner(chosen);
      setSpinning(false);
    }, spinMs);
  };

  const excludeWinner = () => {
    if (!winner) return;
    setExcluded(prev => new Set(prev).add(winner.id));
    setWinner(null);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Pick a student">
      <div className="space-y-4">
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">
            This class has no students yet. Share the join code or import a roster first.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SPEEDS.map(option => (
                <button
                  key={option.key}
                  onClick={() => setSpeed(option.key)}
                  disabled={spinning}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    speed === option.key
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {option.label}
                  <span className="ml-1 text-xs text-gray-400">{option.ms / 1000}s</span>
                </button>
              ))}
            </div>

            <Wheel names={pool.map(s => s.name)} rotation={rotation} spinMs={spinMs} spinning={spinning} />

            <div aria-live="polite" className="min-h-[3.5rem] text-center">
              {winner ? (
                <>
                  <p className="text-xs uppercase tracking-wide text-gray-400">It's</p>
                  <p className="text-2xl font-bold text-blue-700">{winner.name}</p>
                </>
              ) : (
                <p className="pt-4 text-sm text-gray-400">
                  {spinning ? 'Spinning…' : `${pool.length} student${pool.length === 1 ? '' : 's'} in the wheel`}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={spin} disabled={spinning || pool.length === 0}>
                {winner ? 'Spin again' : 'Spin'}
              </Button>
              {winner && (
                <Button variant="secondary" onClick={excludeWinner}>
                  Don't pick again
                </Button>
              )}
              {excluded.size > 0 && (
                <Button variant="ghost" onClick={() => setExcluded(new Set())}>
                  Reset ({excluded.size} set aside)
                </Button>
              )}
            </div>

            {pool.length === 0 && (
              <p className="text-center text-sm text-amber-700">
                Everyone has been picked. Reset to put them all back in.
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function Wheel({
  names,
  rotation,
  spinMs,
  spinning,
}: {
  names: string[];
  rotation: number;
  spinMs: number;
  spinning: boolean;
}) {
  if (names.length === 0) return null;

  const size = 260;
  const radius = size / 2;
  const wedge = 360 / names.length;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size + 14 }}>
      {/* Pointer sits above the wheel, aimed at the winning wedge. */}
      <div
        className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2"
        style={{
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '16px solid #1e293b',
        }}
        aria-hidden="true"
      />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="mt-3.5 drop-shadow"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? `transform ${spinMs}ms cubic-bezier(0.15, 0.6, 0.15, 1)`
            : 'none',
        }}
        role="img"
        aria-label={`Wheel of ${names.length} students`}
      >
        {names.map((name, i) => {
          const start = i * wedge - 90;
          const end = start + wedge;
          const mid = start + wedge / 2;
          return (
            <g key={`${name}-${i}`}>
              <path
                d={wedgePath(radius, radius, radius - 2, start, end, names.length)}
                fill={WHEEL_COLOURS[i % WHEEL_COLOURS.length]}
                stroke="#ffffff"
                strokeWidth={names.length > 24 ? 0.5 : 1.5}
              />
              {names.length <= 24 && (
                <text
                  x={radius + Math.cos((mid * Math.PI) / 180) * (radius * 0.62)}
                  y={radius + Math.sin((mid * Math.PI) / 180) * (radius * 0.62)}
                  fill="#ffffff"
                  fontSize={names.length > 14 ? 9 : 11}
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid + 90}, ${radius + Math.cos((mid * Math.PI) / 180) * (radius * 0.62)}, ${radius + Math.sin((mid * Math.PI) / 180) * (radius * 0.62)})`}
                >
                  {name.length > 12 ? `${name.slice(0, 11)}…` : name}
                </text>
              )}
            </g>
          );
        })}
        <circle cx={radius} cy={radius} r={16} fill="#ffffff" stroke="#e2e8f0" strokeWidth={2} />
      </svg>
    </div>
  );
}

/** One pie wedge. A single-name wheel is a full circle, which needs two arcs. */
function wedgePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  sliceCount: number,
): string {
  if (sliceCount === 1) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const toXY = (deg: number) => [
    cx + r * Math.cos((deg * Math.PI) / 180),
    cy + r * Math.sin((deg * Math.PI) / 180),
  ];
  const [x1, y1] = toXY(startDeg);
  const [x2, y2] = toXY(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}
