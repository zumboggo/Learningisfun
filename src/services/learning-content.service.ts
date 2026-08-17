import { functions, FUNCTION_IDS } from '@/lib/appwrite';

export async function executeLearningContent<T>(payload: Record<string, unknown>): Promise<T> {
  if (!FUNCTION_IDS.learningContent) throw new Error('Secure learning-content function is not configured');
  const execution = await functions.createExecution(FUNCTION_IDS.learningContent, JSON.stringify(payload));
  if (execution.status === 'failed') throw new Error(execution.errors || 'Secure content request failed');
  const body = JSON.parse(execution.responseBody || '{}') as T & { error?: string };
  if (body.error) throw new Error(body.error);
  return body;
}
