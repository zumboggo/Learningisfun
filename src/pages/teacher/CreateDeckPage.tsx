import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createDeck, addCard, publishDeck, assignDeck } from '@/services/flashcard.service';
import { detectMapping, parseCsvContent, readFileAsText } from '@/utils/csv-parser';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import type { CsvMapping, CsvPreview } from '@/types';

interface PendingCard {
  front: string;
  back: string;
  hint: string;
  tags: string[];
}

export function CreateDeckPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [dailyTarget, setDailyTarget] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cards, setCards] = useState<PendingCard[]>([]);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [tags, setTags] = useState('');

  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [csvMapping, setCsvMapping] = useState<CsvMapping | null>(null);

  const classes = useLiveQuery(
    () => (user ? db.classes.where('teacherId').equals(user.$id).toArray() : []),
    [user?.$id],
  );

  const addManualCard = () => {
    if (!front.trim() || !back.trim()) return;
    setCards(prev => [...prev, {
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim(),
      tags: parseTags(tags),
    }]);
    setFront('');
    setBack('');
    setHint('');
    setTags('');
  };

  const removeCard = (index: number) => {
    setCards(prev => prev.filter((_, i) => i !== index));
  };

  const handleCsvFile = async (file: File) => {
    setCsvFile(file);
      const content = await readFileAsText(file);
      const preview = parseCsvContent(content, null);
      setCsvPreview(preview);
      setCsvMapping(detectMapping(preview.headers));
  };

  const confirmCsvImport = async () => {
    if (!csvFile || !csvMapping || !user) return;
    const content = await readFileAsText(csvFile);
    const preview = parseCsvContent(content, csvMapping);
    const newCards = preview.rows.map(row => ({
      front: row[csvMapping.front] || '',
      back: row[csvMapping.back] || '',
      hint: csvMapping.hint ? row[csvMapping.hint] || '' : '',
      tags: [
        ...parseTags(csvMapping.tags ? row[csvMapping.tags] || '' : ''),
        ...parseTags(csvMapping.source ? row[csvMapping.source] || '' : ''),
      ],
    })).filter(c => c.front && c.back);
    setCards(prev => [...prev, ...newCards]);
    setShowCsvImport(false);
    setCsvFile(null);
    setCsvPreview(null);
    setCsvMapping(null);
  };

  const toggleClass = (id: string) => {
    setSelectedClasses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || cards.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const deck = await createDeck(user.$id, title, description, 'teacher');
      for (const c of cards) {
        await addCard(deck.$id, c.front, c.back, { hint: c.hint, tags: c.tags });
      }
      await publishDeck(deck.$id, user.$id);
      for (const classId of selectedClasses) {
        await assignDeck(deck.$id, classId, false, dailyTarget || null);
      }
      navigate('/decks');
    } catch {
      setError('Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Flashcard Deck</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deck title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily target for assigned classes</label>
            <input
              type="number"
              min={0}
              value={dailyTarget}
              onChange={e => setDailyTarget(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Cards ({cards.length})</h2>
            <div className="flex gap-2">
              <Button onClick={() => setShowCsvImport(true)} size="sm" variant="secondary">
                Import CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-2">
            <input
              value={front}
              onChange={e => setFront(e.target.value)}
              placeholder="Front Markdown"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              value={back}
              onChange={e => setBack(e.target.value)}
              placeholder="Back Markdown"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="Hint (optional)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Tags, comma separated"
                className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <Button onClick={addManualCard} size="sm">Add</Button>
            </div>
          </div>

          {cards.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cards.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg text-sm">
                  <span className="flex-1 truncate">{c.front}</span>
                  <span className="text-gray-400">→</span>
                  <span className="flex-1 truncate">{c.back}</span>
                  {c.tags.length > 0 && <span className="text-xs text-gray-400">{c.tags.join(', ')}</span>}
                  <button onClick={() => removeCard(i)} className="text-gray-400 hover:text-red-500">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {classes && classes.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign to classes</label>
            <div className="space-y-2">
              {classes.map(cls => (
                <label key={cls.$id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedClasses.has(cls.$id)}
                    onChange={() => toggleClass(cls.$id)}
                    className="rounded"
                  />
                  <span>{cls.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => void handleSubmit()}
          loading={loading}
          disabled={!title.trim() || cards.length === 0}
          className="w-full"
          size="lg"
        >
          Create & publish deck ({cards.length} cards)
        </Button>
      </div>

      <Modal open={showCsvImport} onClose={() => setShowCsvImport(false)} title="Import CSV">
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) void handleCsvFile(file);
            }}
            className="w-full"
          />

          {csvPreview && csvMapping && (
            <div>
              <div className="text-sm text-gray-600 mb-2">
                {csvPreview.rows.length} cards found
                {csvPreview.invalidRows > 0 && ` · ${csvPreview.invalidRows} invalid rows`}
                {csvPreview.duplicates > 0 && ` · ${csvPreview.duplicates} duplicates removed`}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-gray-500">Front column</label>
                  <select
                    value={csvMapping.front}
                    onChange={e => setCsvMapping({ ...csvMapping, front: e.target.value })}
                    className="block w-full text-sm border rounded px-2 py-1"
                  >
                    {csvPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Back column</label>
                  <select
                    value={csvMapping.back}
                    onChange={e => setCsvMapping({ ...csvMapping, back: e.target.value })}
                    className="block w-full text-sm border rounded px-2 py-1"
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

              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr><th className="px-2 py-1 text-left">Front</th><th className="px-2 py-1 text-left">Back</th></tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1 truncate max-w-[150px]">{row[csvMapping.front]}</td>
                        <td className="px-2 py-1 truncate max-w-[150px]">{row[csvMapping.back]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button onClick={() => void confirmCsvImport()} className="w-full">
                Import {csvPreview.rows.length} cards
              </Button>
            </div>
          )}
        </div>
      </Modal>
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
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="block w-full text-sm border rounded px-2 py-1"
      >
        <option value="">None</option>
        {headers.map(header => <option key={header} value={header}>{header}</option>)}
      </select>
    </div>
  );
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(/[;,]/).map(tag => tag.trim()).filter(Boolean))];
}
