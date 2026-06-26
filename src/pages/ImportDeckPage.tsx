import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { importDeckFromCsv } from '@/services/flashcard.service';
import { detectMapping, parseCsvContent, readFileAsText } from '@/utils/csv-parser';
import { Button } from '@/components/common/Button';
import type { CsvMapping, CsvPreview } from '@/types';

export function ImportDeckPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [csvMapping, setCsvMapping] = useState<CsvMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setCsvFile(file);
    setError('');
    try {
      const content = await readFileAsText(file);
      const preview = parseCsvContent(content, null);
      setCsvPreview(preview);
      if (preview.rows.length === 0) {
        setError('No valid cards found in file');
        return;
      }
      setCsvMapping(detectMapping(preview.headers));
    } catch {
      setError('Failed to read file');
    }
  };

  const handleImport = async () => {
    if (!user || !csvFile || !csvMapping || !title.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { deck } = await importDeckFromCsv(user.$id, title.trim(), csvFile, csvMapping, 'personal');
      navigate(`/decks/${deck.$id}/review`);
    } catch {
      setError('Failed to import deck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Import Flashcard Deck</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deck title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="My vocabulary deck"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CSV file</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">
            Supports UTF-8 CSV with columns like front/back, term/definition, question/answer
          </p>
        </div>

        {csvPreview && csvMapping && (
          <>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Cards found:</span>
                  <span className="ml-1 font-medium">{csvPreview.rows.length}</span>
                </div>
                {csvPreview.invalidRows > 0 && (
                  <div>
                    <span className="text-gray-500">Invalid rows:</span>
                    <span className="ml-1 text-orange-600">{csvPreview.invalidRows}</span>
                  </div>
                )}
                {csvPreview.emptyRows > 0 && (
                  <div>
                    <span className="text-gray-500">Empty rows:</span>
                    <span className="ml-1">{csvPreview.emptyRows}</span>
                  </div>
                )}
                {csvPreview.duplicates > 0 && (
                  <div>
                    <span className="text-gray-500">Duplicates:</span>
                    <span className="ml-1">{csvPreview.duplicates}</span>
                  </div>
                )}
                {csvPreview.longFields > 0 && (
                  <div>
                    <span className="text-gray-500">Long fields:</span>
                    <span className="ml-1 text-orange-600">{csvPreview.longFields}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Front column</label>
                <select
                  value={csvMapping.front}
                  onChange={e => setCsvMapping({ ...csvMapping, front: e.target.value })}
                  className="w-full text-sm border rounded-lg px-2 py-1.5"
                >
                  {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Back column</label>
                <select
                  value={csvMapping.back}
                  onChange={e => setCsvMapping({ ...csvMapping, back: e.target.value })}
                  className="w-full text-sm border rounded-lg px-2 py-1.5"
                >
                  {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <OptionalColumnSelect
                label="Hint column"
                value={csvMapping.hint || ''}
                headers={csvPreview.headers}
                onChange={value => setCsvMapping({ ...csvMapping, hint: value || undefined })}
              />
              <OptionalColumnSelect
                label="Tags column"
                value={csvMapping.tags || ''}
                headers={csvPreview.headers}
                onChange={value => setCsvMapping({ ...csvMapping, tags: value || undefined })}
              />
              <OptionalColumnSelect
                label="Source column"
                value={csvMapping.source || ''}
                headers={csvPreview.headers}
                onChange={value => setCsvMapping({ ...csvMapping, source: value || undefined })}
              />
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Front</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Back</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 truncate max-w-[150px]">{row[csvMapping.front]}</td>
                      <td className="px-3 py-2 truncate max-w-[150px]">{row[csvMapping.back]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvPreview.rows.length > 10 && (
                <div className="text-xs text-gray-400 text-center py-2 border-t">
                  …and {csvPreview.rows.length - 10} more cards
                </div>
              )}
            </div>

            <Button
              onClick={() => void handleImport()}
              loading={loading}
              disabled={!title.trim()}
              className="w-full"
              size="lg"
            >
              Import {csvPreview.rows.length} cards
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function OptionalColumnSelect({
  label,
  value,
  headers,
  onChange,
}: {
  label: string;
  value: string;
  headers: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex-1">
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm border rounded-lg px-2 py-1.5"
      >
        <option value="">None</option>
        {headers.map(header => <option key={header} value={header}>{header}</option>)}
      </select>
    </div>
  );
}
