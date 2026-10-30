import { Router, Request, Response } from 'express';
import { ingestGithubRepo } from '../services/githubService.js';
import { generateRepoAnalysis, askRepoAI } from '../services/aiService.js';
import type { GithubContext } from '../types.js';

export const analyzeRouter = Router();

// In-memory cache of recent repository contexts to accelerate chat Q&A without re-fetching GitHub
const contextCache = new Map<string, GithubContext>();

/**
 * POST /api/analyze
 * Ingests a public GitHub repo, processes its file tree and key files,
 * orchestrates Gemini structured analysis, and returns the
 * full payload required to hydrate the RepoPrism dashboard.
 */
analyzeRouter.post('/api/analyze', async (req: Request, res: Response): Promise<void> => {
  const { repoUrl } = req.body || {};

  if (!repoUrl || typeof repoUrl !== 'string') {
    res.status(400).json({
      error: 'Missing or invalid "repoUrl" parameter in JSON body. Expected format: { "repoUrl": "https://github.com/owner/repo" }',
    });
    return;
  }

  const startTime = Date.now();
  console.log(`[POST /api/analyze] Starting analysis for: ${repoUrl}`);

  try {
    // Step A: Parallel GitHub ingestion & smart tree pruning
    const githubContext = await ingestGithubRepo(repoUrl);
    contextCache.set(repoUrl, githubContext);

    // Step B: Gemini structured analysis & schema validation
    const responseData = await generateRepoAnalysis(githubContext);

    const elapsed = Date.now() - startTime;
    console.log(
      `[POST /api/analyze] Completed successfully for ${githubContext.metadata.owner}/${githubContext.metadata.name} in ${elapsed}ms`
    );

    res.status(200).json(responseData);
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[POST /api/analyze] Error after ${elapsed}ms:`, err.message);

    // Differentiate status codes based on error type
    const message: string = err.message || 'An unexpected error occurred';

    if (message.includes('Invalid GitHub repository URL')) {
      res.status(400).json({ error: message });
      return;
    }

    if (message.includes('Not Found') || message.includes('status 404')) {
      res.status(404).json({
        error: `GitHub repository not found: ${repoUrl}. Please ensure the repository is public and spelled correctly.`,
      });
      return;
    }

    if (
      message.includes('rate limit') ||
      message.includes('API rate limit') ||
      message.includes('status 403')
    ) {
      res.status(429).json({
        error:
          'GitHub API rate limit reached. Add a GITHUB_TOKEN to the server .env to increase the rate limit to 5,000 requests/hour.',
      });
      return;
    }

    res.status(500).json({
      error: `Failed to analyze repository: ${message}`,
    });
  }
});

/**
 * POST /api/chat
 * Answers questions about the ingested repository using Gemini and codebase context
 */
analyzeRouter.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const { repoUrl, question } = req.body || {};

  if (!question || typeof question !== 'string') {
    res.status(400).json({
      error: 'Missing or invalid "question" parameter in JSON body.',
    });
    return;
  }

  const targetUrl = repoUrl || 'https://github.com/expressjs/express';
  console.log(`[POST /api/chat] Question for ${targetUrl}: "${question}"`);

  try {
    let context = contextCache.get(targetUrl);
    if (!context) {
      console.log(`[POST /api/chat] Cache miss for ${targetUrl}, ingesting...`);
      context = await ingestGithubRepo(targetUrl);
      contextCache.set(targetUrl, context);
    }

    const chatResponse = await askRepoAI(context, question);
    res.status(200).json(chatResponse);
  } catch (err: any) {
    console.error('[POST /api/chat] Error:', err.message);
    res.status(500).json({
      error: `Failed to answer question: ${err.message || 'Unknown error'}`,
    });
  }
});

/**
 * GET /api/health
 * Simple connectivity and status check
 */
analyzeRouter.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'RepoPrism Backend Engine',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    githubTokenConfigured: Boolean(process.env.GITHUB_TOKEN?.trim()),
    cachedRepos: Array.from(contextCache.keys()),
    timestamp: new Date().toISOString(),
  });
});
