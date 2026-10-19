import { Client, Databases } from 'node-appwrite';
import { handlePlanning } from './handler.js';
export default async ({ req, res, error }) => {
  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT || process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY);
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.bodyJson || req.body || {});
    const result = await handlePlanning({ db: new Databases(client), userId: req.headers['x-appwrite-user-id'], body,
      profileDatabase: process.env.APPWRITE_DATABASE_ID || 'main' });
    return res.json(result);
  } catch (err) {
    const code = [400, 401, 403, 404].includes(err.code) ? err.code : 500;
    if (code === 500) error('Planning request failed');
    return res.json({ error: code === 500 ? 'Planning sync is unavailable. Your local boards are safe.' : err.message }, code);
  }
};
