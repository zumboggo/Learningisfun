interface BackColumnSelectProps {
  headers: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * Picks one or more columns for the back of the card. Multi-select because a
 * definition and its example usually belong together; deselecting down to a
 * single column is still allowed.
 */
export function BackColumnSelect({ headers, value, onChange }: BackColumnSelectProps) {
  const toggle = (header: string) => {
    const selected = value.includes(header)
      ? value.filter(h => h !== header)
      // Rebuild from `headers` so the back always reads in CSV column order,
      // no matter which order the boxes were ticked.
      : headers.filter(h => value.includes(h) || h === header);

    // The back cannot be empty — every card needs one.
    if (selected.length === 0) return;
    onChange(selected);
  };

  return (
    <div className="col-span-2">
      <label className="text-xs text-gray-500">Back column(s)</label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {headers.map(header => {
          const checked = value.includes(header);
          return (
            <button
              key={header}
              type="button"
              onClick={() => toggle(header)}
              aria-pressed={checked}
              className={`rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${
                checked
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              <span className="mr-1.5" aria-hidden="true">{checked ? '✓' : '+'}</span>
              {header}
            </button>
          );
        })}
      </div>
      {value.length > 1 && (
        <p className="mt-1 text-xs text-gray-400">
          Combined in this order: {value.join(' → ')}
        </p>
      )}
    </div>
  );
}
