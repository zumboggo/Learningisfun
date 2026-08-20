import { Client, Databases, ID, Query } from 'node-appwrite';

async function askWritingCoach({ studentText, context, feedbackRequest }) {
  const focus = feedbackRequest ? `\nThe writer specifically asks: ${feedbackRequest}` : '';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a supportive, age-appropriate writing coach. Return JSON with a concise www string describing specific strengths and an improvements array of exactly three specific, actionable suggestions. Address the writer’s requested focus when supplied. Do not assign a grade and do not rewrite the whole piece for them.',
        },
        { role: 'user', content: `${context}${focus}\n\nStudent writing:\n${studentText}` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const body = await response.json();
  const result = JSON.parse(body.choices?.[0]?.message?.content || '{}');
  return {
    www: String(result.www || ''),
    improvements: Array.isArray(result.improvements) ? result.improvements.slice(0, 3).map(String) : [],
  };
}

export default async ({ req, res, error }) => {
  try {
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ error: 'Authentication required' }, 401);
    const request = JSON.parse(req.bodyText || '{}');
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const db = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID || 'main';

    if (typeof request.personalText === 'string') {
      const profile = await db.getDocument(databaseId, 'users', userId);
      if (profile.role !== 'student') return res.json({ error: 'Student role required' }, 403);
      const studentText = request.personalText.trim();
      const feedbackRequest = typeof request.feedbackRequest === 'string' ? request.feedbackRequest.trim() : '';
      if (!studentText) return res.json({ error: 'There is nothing written yet' }, 400);
      if (studentText.length > 30000 || feedbackRequest.length > 1000) return res.json({ error: 'Writing or feedback request is too long' }, 400);
      const result = await askWritingCoach({
        studentText,
        feedbackRequest,
        context: 'This is the student’s own writing, not a class assignment. Give broadly useful feedback on ideas, organization, evidence, language, and conventions where relevant.',
      });
      return res.json({ ...result, generatedAt: new Date().toISOString() });
    }

    const submission = await db.getDocument(databaseId, 'writing_submissions', request.submissionId);
    const prompt = await db.getDocument(databaseId, 'writing_prompts', submission.promptId);
    if (!prompt.aiFeedbackEnabled) return res.json({ error: 'AI feedback is disabled' }, 403);
    const memberships = await db.listDocuments(databaseId, 'class_members', [
      Query.equal('classId', submission.classId), Query.equal('userId', userId), Query.limit(1),
    ]);
    if (!memberships.total && prompt.teacherId !== userId) return res.json({ error: 'Not enrolled' }, 403);
    if (submission.authorId !== userId && prompt.teacherId !== userId) return res.json({ error: 'Not your submission' }, 403);
    const studentText = submission.submittedMarkdown || submission.draftMarkdown;
    if (!studentText?.trim()) return res.json({ error: 'There is nothing written yet' }, 400);
    const result = await askWritingCoach({
      studentText,
      feedbackRequest: '',
      context: `Assignment: ${prompt.title}\nPrompt: ${prompt.promptMarkdown}\nInstructions: ${prompt.instructions || ''}\nRubric: ${prompt.rubricJson}`,
    });
    const now = new Date().toISOString();
    const payload = {
      submissionId: submission.$id,
      wwwSummary: result.www,
      improvementsJson: JSON.stringify(result.improvements),
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      generatedAt: now,
    };
    const existing = await db.listDocuments(databaseId, 'writing_ai_feedback', [Query.equal('submissionId', submission.$id), Query.limit(1)]);
    if (existing.total) await db.updateDocument(databaseId, 'writing_ai_feedback', existing.documents[0].$id, payload);
    else await db.createDocument(databaseId, 'writing_ai_feedback', ID.unique(), payload);
    return res.json({ www: result.www, improvements: result.improvements, generatedAt: now });
  } catch (cause) {
    error(cause.message);
    return res.json({ error: 'Could not generate feedback' }, 500);
  }
};
