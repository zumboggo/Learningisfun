import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createDeck, addCard, publishDeck, assignDeck } from '@/services/flashcard.service';
import { detectMapping, joinBackValues, parseCsvContent, readFileAsText } from '@/utils/csv-parser';
import { parseTags } from '@/utils/helpers';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CsvDropzone } from '@/components/common/CsvDropzone';
import { BackColumnSelect } from '@/components/common/BackColumnSelect';
import type { CsvMapping, CsvPreview } from '@/types';

interface PendingCard {
  front: string;
  back: string;
  hint: string;
  tags: string[];
}

type ImportMode = 'new' | 'add' | 'update';

export function CreateDeckPage() {
  const { user, isTeacher } = useAuth();
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
  const [cardFormat, setCardFormat] = useState<'basic'|'reverse'|'cloze'>('basic');

  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showPasteImport, setShowPasteImport] = useState(false);
  const [pastedCards, setPastedCards] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [csvMapping, setCsvMapping] = useState<CsvMapping | null>(null);

  const [importMode, setImportMode] = useState<ImportMode>('new');
  const [targetDeckId, setTargetDeckId] = useState('');

  const classes = useLiveQuery(
    () => (user ? db.classes.where('teacherId').equals(user.$id).toArray() : []),
    [user?.$id],
  );

  const existingDecks = useLiveQuery(
    () => (user ? db.flashcard_decks.where('creatorId').equals(user.$id).toArray() : []),
    [user?.$id],
  );

  const addManualCard = () => {
    if (!front.trim() || (cardFormat !== 'cloze' && !back.trim())) return;
    const clozeMatches=[...front.matchAll(/\{\{c\d+::(.*?)(?:::.*?)?\}\}/g)].map(match=>match[1]);
    const clozeFront=front.replace(/\{\{c\d+::(.*?)(?:::.*?)?\}\}/g,'[…]');
    const first={
      front: cardFormat==='cloze'?clozeFront:front.trim(),
      back: cardFormat==='cloze'?`${front.replace(/\{\{c\d+::(.*?)(?:::.*?)?\}\}/g,'**$1**')}\n\n${back}`.trim():back.trim(),
      hint: hint.trim(),
      tags: parseTags(tags),
    };
    if(cardFormat==='cloze'&&!clozeMatches.length)return;
    setCards(prev => [...prev, first, ...(cardFormat==='reverse'?[{...first,front:first.back,back:first.front}]:[])]);
    setFront('');
    setBack('');
    setHint('');
    setTags('');
  };

  const removeCard = (index: number) => {
    setCards(prev => prev.filter((_, i) => i !== index));
  };
  const importPastedCards = () => {
    const rows = pastedCards.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const columns = line.includes('\t') ? line.split('\t') : line.split(',');
      return { front: (columns[0] || '').trim(), back: (columns[1] || '').trim(), hint: (columns[2] || '').trim(), tags: parseTags(columns.slice(3).join(',')) };
    }).filter(card => card.front && card.back);
    setCards(current => [...current, ...rows]); setPastedCards(''); setShowPasteImport(false);
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
      back: joinBackValues(row, csvMapping.back),
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
    if (!user) return;
    if (importMode === 'new' && (!title.trim() || cards.length === 0)) return;
    if ((importMode === 'add' || importMode === 'update') && (!targetDeckId || cards.length === 0)) return;
    setLoading(true);
    setError('');

    try {
      let deckId: string;

      if (importMode === 'new') {
        const deck = await createDeck(user.$id, title, description, isTeacher ? 'teacher' : 'personal');
        deckId = deck.$id;
        for (const c of cards) {
          await addCard(deckId, c.front, c.back, { hint: c.hint, tags: c.tags });
        }
        if (isTeacher) {
          await publishDeck(deckId, user.$id);
          for (const classId of selectedClasses) await assignDeck(deckId, classId, false, dailyTarget || null);
        }
      } else if (importMode === 'add') {
        deckId = targetDeckId;
        for (const c of cards) {
          await addCard(deckId, c.front, c.back, { hint: c.hint, tags: c.tags });
        }
        for (const classId of selectedClasses) {
          await assignDeck(deckId, classId, false, dailyTarget || null);
        }
      } else {
        deckId = targetDeckId;
        const existingCards = await db.flashcard_cards.where('deckId').equals(deckId).toArray();
        const existingFrontsLower = new Map(
          existingCards.map(card => [card.front.trim().toLowerCase(), card]),
        );
        for (const c of cards) {
          const frontLower = c.front.trim().toLowerCase();
          const duplicate = existingFrontsLower.get(frontLower);
          if (duplicate) {
            await db.flashcard_cards.update(duplicate.$id, {
              back: c.back,
              backMarkdown: c.back,
              hint: c.hint,
              tags: c.tags,
            });
          } else {
            await addCard(deckId, c.front, c.back, { hint: c.hint, tags: c.tags });
          }
        }
        for (const classId of selectedClasses) {
          await assignDeck(deckId, classId, false, dailyTarget || null);
        }
      }

      navigate('/decks');
    } catch {
      setError('Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  const showTitleFields = importMode === 'new';
  const canSubmit = importMode === 'new'
    ? title.trim() && cards.length > 0
    : targetDeckId && cards.length > 0;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isTeacher ? 'Create Flashcard Deck' : 'Create My Deck'}</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="space-y-6">
        <div className="space-y-4">
          {showTitleFields && (
            <>
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
            </>
          )}
          {isTeacher && <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily target for assigned classes</label>
            <input
              type="number"
              min={0}
              value={dailyTarget}
              onChange={e => setDailyTarget(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Cards ({cards.length})</h2>
            <div className="flex gap-2">
              <Button onClick={() => setShowCsvImport(true)} size="sm" variant="secondary">
                Import CSV
              </Button>
              <Button onClick={() => setShowPasteImport(true)} size="sm" variant="secondary">Paste cards</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-2">
            <select value={cardFormat} onChange={event=>setCardFormat(event.target.value as typeof cardFormat)} className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"><option value="basic">Basic · front → back</option><option value="reverse">Basic + reverse card</option><option value="cloze">Cloze · use {'{{c1::answer}}'}</option></select>
            <input
              value={front}
              onChange={e => setFront(e.target.value)}
              placeholder="Front Markdown"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              value={back}
              onChange={e => setBack(e.target.value)}
              placeholder={cardFormat==='cloze'?'Optional extra explanation':'Back Markdown'}
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

        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Import mode</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 mb-4">
            <button
              type="button"
              onClick={() => { setImportMode('new'); setTargetDeckId(''); }}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${importMode === 'new' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Create new deck
            </button>
            <button
              type="button"
              onClick={() => setImportMode('add')}
              className={`flex-1 py-2 px-3 text-sm font-medium border-l border-gray-300 transition-colors ${importMode === 'add' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Add to existing deck
            </button>
            <button
              type="button"
              onClick={() => setImportMode('update')}
              className={`flex-1 py-2 px-3 text-sm font-medium border-l border-gray-300 transition-colors ${importMode === 'update' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Update duplicates
            </button>
          </div>

          {(importMode === 'add' || importMode === 'update') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target deck</label>
              <select
                value={targetDeckId}
                onChange={e => setTargetDeckId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              >
                <option value="">Select a deck...</option>
                {existingDecks?.map(deck => (
                  <option key={deck.$id} value={deck.$id}>{deck.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {classes && classes.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {importMode === 'new' ? 'Assign to classes' : 'Additionally assign to classes'}
            </label>
            <div className="space-y-2">
              {classes.map(cls => (
                <label key={cls.$id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedClasses.has(cls.$id)}
                    onChange={() => toggleClass(cls.$id)}
                    className="rounded"
                  />
                  <span>{cls.courseName} <span className="text-gray-400">({cls.name})</span></span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => void handleSubmit()}
          loading={loading}
          disabled={!canSubmit}
          className="w-full"
          size="lg"
        >
          {importMode === 'new'
            ? `${isTeacher ? 'Create & publish deck' : 'Create my deck'} (${cards.length} cards)`
            : importMode === 'add'
              ? `Add ${cards.length} cards to deck`
              : `Add/update ${cards.length} cards in deck`}
        </Button>
      </div>

      <Modal open={showCsvImport} onClose={() => setShowCsvImport(false)} title="Import CSV">
        <div className="space-y-4">
          <CsvDropzone file={csvFile} onFile={file => void handleCsvFile(file)} />

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
                <BackColumnSelect
                  headers={csvPreview.headers}
                  value={csvMapping.back}
                  onChange={back => setCsvMapping({ ...csvMapping, back })}
                />
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
                        <td className="px-2 py-1 truncate max-w-[150px]">{joinBackValues(row, csvMapping.back)}</td>
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
      <Modal open={showPasteImport} onClose={() => setShowPasteImport(false)} title="Paste cards"><div className="space-y-4"><p className="text-sm text-gray-600">Paste rows copied from Google Sheets or Excel. Use columns in this order: front, back, optional hint, optional tags.</p><textarea autoFocus rows={10} className="w-full rounded-lg border px-3 py-2 font-mono text-sm" value={pastedCards} onChange={event => setPastedCards(event.target.value)} placeholder={'Term 1\tDefinition 1\nTerm 2\tDefinition 2'} /><Button className="w-full" disabled={!pastedCards.trim()} onClick={importPastedCards}>Add pasted cards</Button></div></Modal>
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
