import 'dotenv/config';
import { ingestGithubRepo } from '../server/src/services/githubService.js';
import { generateRepoAnalysis } from '../server/src/services/aiService.js';
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

  const { repoUrl } = req.body || {};
  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid "repoUrl" parameter in JSON body.',
    });
  }

  try {
    const githubContext = await ingestGithubRepo(repoUrl);
    contextCache.set(repoUrl, githubContext);
    const responseData = await generateRepoAnalysis(githubContext);
    return res.status(200).json(responseData);
  } catch (err: any) {
    const message = err.message || 'An unexpected error occurred';
    if (message.includes('Invalid GitHub repository URL')) {
      return res.status(400).json({ error: message });
    }
    if (message.includes('Not Found') || message.includes('status 404')) {
      return res.status(404).json({
        error: `GitHub repository not found: ${repoUrl}. Please ensure the repository is public and spelled correctly.`,
      });
    }
    if (message.includes('rate limit') || message.includes('status 403')) {
      return res.status(429).json({
        error: 'GitHub API rate limit reached. Configure GITHUB_TOKEN in Vercel settings for 5,000 req/hr.',
      });
    }
    return res.status(500).json({
      error: `Failed to analyze repository: ${message}`,
    });
  }
}
