import { functions, FUNCTION_IDS } from '@/lib/appwrite';
import { getTimestamp } from '@/utils/helpers';

export async function generatePersonalWritingFeedback(
  studentText: string,
  feedbackRequest: string,
): Promise<{ www: string; improvements: string[]; errorLogSuggestions: Array<{ problem: string; fix: string }>; generatedAt: string }> {
  const text = studentText.trim();
  if (!text) throw new Error('Paste or write something first.');
  if (!FUNCTION_IDS.writingAiFeedback) throw new Error('AI feedback is not configured on the server yet.');
  const execution = await functions.createExecution(
    FUNCTION_IDS.writingAiFeedback,
    JSON.stringify({ personalText: text, feedbackRequest: feedbackRequest.trim() }),
  );
  if (execution.status === 'failed') throw new Error(execution.errors || 'AI feedback failed');
  const result = JSON.parse(execution.responseBody || '{}') as { error?: string; www?: string; improvements?: string[]; errorLogSuggestions?: Array<{ problem?: string; fix?: string }>; generatedAt?: string };
  if (result.error) throw new Error(result.error);
  return {
    www: result.www || '',
    improvements: Array.isArray(result.improvements) ? result.improvements : [],
    errorLogSuggestions: Array.isArray(result.errorLogSuggestions)
      ? result.errorLogSuggestions.flatMap(item => {
        const problem = String(item?.problem || '').trim();
        const fix = String(item?.fix || '').trim();
        return problem && fix ? [{ problem, fix }] : [];
      })
      : (Array.isArray(result.improvements) ? result.improvements.map(item => ({ problem: 'A pattern noticed in my AI feedback', fix: String(item) })) : []),
    generatedAt: result.generatedAt || getTimestamp(),
  };
}
