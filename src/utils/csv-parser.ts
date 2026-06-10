import type { CsvMapping, CsvPreview } from '@/types';

export function parseCsvLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const KNOWN_FRONT_HEADERS = ['front', 'term', 'question', 'word', 'english', 'hanzi', 'kanji'];
const KNOWN_BACK_HEADERS = ['back', 'definition', 'answer', 'meaning', 'translation', 'pinyin', 'reading'];

export function detectMapping(headers: string[]): CsvMapping | null {
  const lower = headers.map(h => h.toLowerCase().trim());
  const frontIdx = lower.findIndex(h => KNOWN_FRONT_HEADERS.includes(h));
  const backIdx = lower.findIndex(h => KNOWN_BACK_HEADERS.includes(h));
  if (frontIdx >= 0 && backIdx >= 0) {
    return { front: headers[frontIdx], back: headers[backIdx] };
  }
  if (lower.length >= 2) {
    return { front: headers[0], back: headers[1] };
  }
  return null;
}

export function parseCsvContent(
  content: string,
  mapping: CsvMapping | null,
): CsvPreview {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, invalidRows: 0, emptyRows: 0, duplicates: 0, longFields: 0 };
  }

  const headers = parseCsvLine(lines[0]);
  const autoMapping = mapping || detectMapping(headers);
  if (!autoMapping) {
    return { headers, rows: [], totalRows: 0, invalidRows: 0, emptyRows: 0, duplicates: 0, longFields: 0 };
  }

  const frontIdx = headers.indexOf(autoMapping.front);
  const backIdx = headers.indexOf(autoMapping.back);

  const rows: Record<string, string>[] = [];
  const seen = new Set<string>();
  let invalidRows = 0;
  let emptyRows = 0;
  let duplicates = 0;
  let longFields = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const front = values[frontIdx]?.trim() || '';
    const back = values[backIdx]?.trim() || '';

    if (!front && !back) {
      emptyRows++;
      continue;
    }
    if (!front || !back) {
      invalidRows++;
      continue;
    }
    if (front.length > 5000 || back.length > 5000) {
      longFields++;
    }

    const key = `${front}|||${back}`;
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() || '';
    });
    rows.push(row);
  }

  return {
    headers,
    rows,
    totalRows: lines.length - 1,
    invalidRows,
    emptyRows,
    duplicates,
    longFields,
  };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'UTF-8');
  });
}
