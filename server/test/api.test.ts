import assert from 'node:assert';
import { parseGitHubUrl, formatStars } from '../src/services/githubService.js';
import { AnalyzeRepoResponseSchema } from '../src/types.js';

async function runTests() {
  console.log('Running RepoPrism Backend Test Suite...');

  // 1. Test formatStars
  assert.strictEqual(formatStars(950), '950');
  assert.strictEqual(formatStars(1500), '1.5k');
  assert.strictEqual(formatStars(65200), '65.2k');
  assert.strictEqual(formatStars(2500000), '2.5M');
  console.log('✓ formatStars passes');

  // 2. Test parseGitHubUrl
  assert.deepStrictEqual(parseGitHubUrl('https://github.com/expressjs/express'), {
    owner: 'expressjs',
    repo: 'express',
  });
  assert.deepStrictEqual(parseGitHubUrl('https://github.com/facebook/react.git'), {
    owner: 'facebook',
    repo: 'react',
  });
  assert.deepStrictEqual(parseGitHubUrl('trpc/trpc'), {
    owner: 'trpc',
    repo: 'trpc',
  });
  assert.throws(() => parseGitHubUrl('invalid_url'), /Invalid GitHub repository URL/);
  console.log('✓ parseGitHubUrl passes');

  // 3. Test API schema validation with live health & analyze endpoints
  const healthRes = await fetch('http://localhost:3001/api/health');
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok');
  console.log('✓ GET /api/health passes');

  const analyzeRes = await fetch('http://localhost:3001/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl: 'https://github.com/expressjs/express' }),
  });
  assert.strictEqual(analyzeRes.status, 200);
  const analyzeData = await analyzeRes.json();

  // Validate with Zod schema
  const parsed = AnalyzeRepoResponseSchema.safeParse(analyzeData);
  assert.strictEqual(parsed.success, true, 'Response must match AnalyzeRepoResponseSchema');
  assert.strictEqual(analyzeData.metadata.owner, 'expressjs');
  assert.strictEqual(analyzeData.contextCards.length, 4);
  assert.ok(analyzeData.systemCanvas.nodes.length >= 5);
  assert.ok(analyzeData.firstIssues.length >= 4);
  console.log('✓ POST /api/analyze conforms to strict frontend UI contract');

  console.log('\nAll tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
