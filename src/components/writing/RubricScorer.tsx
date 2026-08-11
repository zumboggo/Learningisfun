import type { RubricCriterion } from '@/types';
import { formatScore } from '@/services/writing.service';

interface RubricScorerProps {
  rubric: RubricCriterion[];
  scores: Record<string, number>;
  onChange: (criterionId: string, points: number) => void;
  disabled?: boolean;
}

/**
 * Level buttons rather than a free number field: students judge against the
 * descriptor they are reading, which is the skill the rubric is meant to build.
 */
export function RubricScorer({ rubric, scores, onChange, disabled }: RubricScorerProps) {
  return (
    <div className="space-y-3">
      {rubric.map(criterion => {
        const selected = scores[criterion.id];
        return (
          <fieldset key={criterion.id} className="rounded-lg border border-gray-200 p-3">
            <legend className="px-1 text-sm font-semibold text-gray-900">
              {criterion.name}
              <span className="ml-2 font-normal text-xs text-gray-400">/ {criterion.maxPoints}</span>
            </legend>
            {criterion.description && (
              <p className="mb-2 text-xs text-gray-500">{criterion.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {criterion.levels.map(level => {
                const active = selected === level.points;
                return (
                  <button
                    key={level.points}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(criterion.id, level.points)}
                    title={level.descriptor}
                    aria-pressed={active}
                    className={`flex-1 min-w-[110px] rounded-lg border px-2 py-2 text-left transition-colors disabled:opacity-60 ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {level.points} · {level.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
                      {level.descriptor}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

interface RubricScoreTableProps {
  rubric: RubricCriterion[];
  columns: Array<{ key: string; label: string; scores: Record<string, number>; total: number }>;
  perCriterionAverage: Record<string, number | null>;
  averageTotal: number | null;
  maxTotal: number;
}

/** Criteria down the side, one column per marker, averages in the last column. */
export function RubricScoreTable({
  rubric,
  columns,
  perCriterionAverage,
  averageTotal,
  maxTotal,
}: RubricScoreTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="py-2 pr-3 font-medium">Criterion</th>
            {columns.map(col => (
              <th key={col.key} className="px-2 py-2 text-center font-medium">{col.label}</th>
            ))}
            <th className="px-2 py-2 text-center font-medium text-blue-600">Average</th>
          </tr>
        </thead>
        <tbody>
          {rubric.map(criterion => (
            <tr key={criterion.id} className="border-b border-gray-100">
              <td className="py-2 pr-3">
                <span className="font-medium text-gray-800">{criterion.name}</span>
                <span className="ml-1 text-xs text-gray-400">/ {criterion.maxPoints}</span>
              </td>
              {columns.map(col => (
                <td key={col.key} className="px-2 py-2 text-center text-gray-700">
                  {col.scores[criterion.id] ?? '—'}
                </td>
              ))}
              <td className="px-2 py-2 text-center font-semibold text-blue-700">
                {formatScore(perCriterionAverage[criterion.id] ?? null)}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            <td className="py-2 pr-3 font-semibold text-gray-900">Total</td>
            {columns.map(col => (
              <td key={col.key} className="px-2 py-2 text-center font-semibold text-gray-900">
                {col.total}/{maxTotal}
              </td>
            ))}
            <td className="px-2 py-2 text-center font-bold text-blue-700">
              {formatScore(averageTotal)}/{maxTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
