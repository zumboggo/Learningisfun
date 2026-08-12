import { useRef, useState } from 'react';

interface CsvDropzoneProps {
  file: File | null;
  onFile: (file: File) => void;
  /** Shown under the prompt, e.g. which columns are expected. */
  hint?: string;
}

/**
 * Drop target for a CSV that doubles as a file picker when clicked. Rendered as
 * a button so keyboard users get the picker too.
 */
export function CsvDropzone({ file, onFile, hint }: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked) onFile(picked);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files);
        }}
        className={`w-full rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
        }`}
      >
        <svg
          className={`mx-auto h-10 w-10 ${dragging ? 'text-blue-500' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
          />
        </svg>

        {file ? (
          <>
            <p className="mt-3 text-sm font-medium text-gray-900">{file.name}</p>
            <p className="mt-1 text-xs text-gray-500">Drop another file or click to replace</p>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-gray-700">Drop your CSV file here</p>
            <p className="mt-1 text-xs text-gray-500">or click to choose a file</p>
          </>
        )}
      </button>

      {hint && <p className="mt-2 text-xs text-gray-400">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={e => {
          take(e.target.files);
          // Allows picking the same file again after a failed parse.
          e.target.value = '';
        }}
      />
    </div>
  );
}
