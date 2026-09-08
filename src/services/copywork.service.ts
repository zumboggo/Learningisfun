import { executeLearningContent } from './learning-content.service';
import type { CopyworkEntry } from '@/types';

export const readCopywork = () => executeLearningContent<{ entries: CopyworkEntry[] }>({ action: 'readCopywork' });
export const addCopywork = (content: string, sourceTitle = '', sourceUrl = '', observations: string[] = []) => executeLearningContent<{ entry: CopyworkEntry }>({ action: 'addCopywork', content, sourceTitle, sourceUrl, observations: observations.map(value => value.trim()).filter(Boolean) });
export const deleteCopywork = (entryId: string) => executeLearningContent({ action: 'deleteCopywork', entryId });

export function copyworkMarkdown(entries: CopyworkEntry[]) {
  const body = entries.map(entry => {
    const date = new Date(entry.createdAt).toLocaleString();
    const source = entry.sourceTitle ? `\n\n— ${entry.sourceUrl ? `[${entry.sourceTitle}](${entry.sourceUrl})` : entry.sourceTitle}` : '';
    const observations = entry.observations?.length ? `\n\n### My observations\n\n${entry.observations.map((value, index) => `${index + 1}. ${value.replace(/\n/g, '\n   ')}`).join('\n')}` : '';
    return `## ${date}\n\n${entry.content.trim()}${source}${observations}`;
  }).join('\n\n---\n\n');
  return `# My Copywork\n\n${body}\n`;
}
