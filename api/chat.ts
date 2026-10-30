import 'dotenv/config';
import { ingestGithubRepo } from '../server/src/services/githubService.js';
import { askRepoAI } from '../server/src/services/aiService.js';
import { contextCache } from './cache.js';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repoUrl, question } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid "question" parameter in JSON body.',
    });
  }

  const targetUrl = repoUrl || 'https://github.com/expressjs/express';

  try {
    let context = contextCache.get(targetUrl);
    if (!context) {
      context = await ingestGithubRepo(targetUrl);
      contextCache.set(targetUrl, context);
    }

    const chatResponse = await askRepoAI(context, question);
    return res.status(200).json(chatResponse);
  } catch (err: any) {
    return res.status(500).json({
      error: `Failed to answer question: ${err.message || 'Unknown error'}`,
    });
  }
}
