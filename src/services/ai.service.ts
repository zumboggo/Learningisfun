const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export interface GeneratedCard {
  front: string;
  back: string;
  hint: string;
  tags: string[];
}

export async function getApiKey(): Promise<string | null> {
  const { db } = await import('@/db/schema');
  const entry = await db.app_metadata.get('openrouter_api_key');
  return entry?.value || null;
}

export async function setApiKey(key: string): Promise<void> {
  const { db } = await import('@/db/schema');
  await db.app_metadata.put({ key: 'openrouter_api_key', value: key });
}

export async function testApiKey(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
        max_tokens: 5,
      }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return { ok: false, error: data.error?.message || `HTTP ${resp.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function generateFlashcardsFromNotes(
  notes: string,
  apiKey: string,
  model: string = DEFAULT_MODEL,
): Promise<GeneratedCard[]> {
  const systemPrompt = `You are a flashcard generator for a classroom learning app. Given discussion notes from a class session, generate study flashcards.

Rules:
- Return a JSON array of objects with keys: front, back, hint, tags
- Generate UP TO 12 potential flashcards from the content
- FAVOR vocabulary words, key terms, and specific facts over general summaries
- For vocabulary cards: "front" should be the word/term, "back" should be a SHORT definition (7-12 words max), and "hint" should be an example sentence using the word in context
- For fact cards: "front" should be a clear question, "back" should be a concise answer
- "tags" is an array of topic tags
- Make cards clear, specific, and unambiguous
- Use the same language as the notes
- Prioritize the most important 8-12 pieces of information

Return ONLY valid JSON, no markdown fences, no explanation.`;

  const resp = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate flashcards from these class discussion notes:\n\n${notes}` },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error?.message || `API error: HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';

  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Expected an array of cards');

  return parsed.map((card: Record<string, unknown>) => ({
    front: String(card.front || ''),
    back: String(card.back || ''),
    hint: String(card.hint || ''),
    tags: Array.isArray(card.tags) ? card.tags.map(String) : [],
  }));
}

export async function generateQuizFromSources(
  notes: string,
  flashcardFronts: string[],
  questionCount: number,
  weights: { notes: number; flashcards: number },
  apiKey: string,
  model: string = DEFAULT_MODEL,
): Promise<QuizQuestion[]> {
  const systemPrompt = `You are a quiz generator for a classroom learning app. Generate quiz questions based on the provided sources.

Rules:
- Return a JSON array of quiz question objects
- Each object has: type ("mc" or "cloze"), questionText, options (array of 4 strings, only for MC), correctIndex (0-3, only for MC), clozeAnswer (only for cloze), explanation
- Mix multiple-choice and cloze (fill-in-the-blank) questions
- ${questionCount} questions total
- Weight: ${weights.notes}% from discussion notes, ${weights.flashcards}% from flashcard content
- Make questions clear and test understanding, not just recall
- For cloze questions, use ___ for the blank in questionText

Return ONLY valid JSON, no markdown fences, no explanation.`;

  const userContent = `Discussion notes:\n${notes}\n\nFlashcard content:\n${flashcardFronts.join('\n')}`;

  const resp = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error?.message || `API error: HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';

  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(cleaned);
}

export interface QuizQuestion {
  type: 'mc' | 'cloze';
  questionText: string;
  options?: string[];
  correctIndex?: number;
  clozeAnswer?: string;
  explanation: string;
}
