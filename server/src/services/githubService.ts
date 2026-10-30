import { Octokit } from '@octokit/rest';
import type {
  FileTreeNode,
  GithubContext,
  HighSignalFile,
  RawGithubIssue,
} from '../types.js';

// Dynamically create Octokit and headers so process.env.GITHUB_TOKEN is always read at runtime
export function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN?.trim() || undefined;
  return new Octokit({
    auth: token,
    userAgent: 'RepoPrism-Engine/1.0',
  });
}

export function getDefaultHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    'User-Agent': 'RepoPrism-Engine/1.0',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Noise filters: folders, file extensions, and lockfiles to ignore
 */
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.github',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'vendor',
  '.turbo',
  '.cache',
  'coverage',
  '.nyc_output',
  '__pycache__',
  '.venv',
  'env',
  'target',
  'out',
  '.idea',
  '.vscode',
  'fixtures',
  '__fixtures__',
  'test/fixtures',
  'tests/fixtures',
  'snapshots',
  '__snapshots__',
]);

const IGNORED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.mp4',
  '.webm',
  '.mp3',
  '.wav',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.7z',
  '.rar',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.map',
  '.min.js',
  '.min.css',
  '.snap',
  '.bin',
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'Cargo.lock',
  'poetry.lock',
  'Gemfile.lock',
  'composer.lock',
  '.ds_store',
  'thumbs.db',
]);

/**
 * Format stargazers count to readable string like "65.2k", "1.2M", etc.
 */
export function formatStars(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Parse GitHub URL into owner and repository name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const trimmed = url.trim();
  // Handle formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // github.com/owner/repo
  // owner/repo
  const match = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git|\/)?$/i
  ) || trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git|\/)?$/);

  if (!match || !match[1] || !match[2]) {
    throw new Error(
      `Invalid GitHub repository URL: "${url}". Expected format: https://github.com/owner/repo`
    );
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ''),
  };
}

/**
 * Filter tree items to eliminate noise (node_modules, binary assets, lockfiles, deep fixtures)
 */
function isNoisePath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const fileName = parts[parts.length - 1].toLowerCase();

  // Check ignored directories
  for (const part of parts) {
    if (IGNORED_DIRECTORIES.has(part.toLowerCase())) {
      return true;
    }
  }

  // Check specific ignored files (e.g. lockfiles)
  if (IGNORED_FILES.has(fileName)) {
    return true;
  }

  // Check ignored extensions
  for (const ext of IGNORED_EXTENSIONS) {
    if (fileName.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Build a nested hierarchical file tree for the left sidebar UI
 */
export function buildNestedTree(
  items: Array<{ path: string; type: string; size?: number }>,
  maxDepth = 5
): FileTreeNode[] {
  const rootNodes: FileTreeNode[] = [];

  for (const item of items) {
    const parts = item.path.split('/');
    if (parts.length > maxDepth) continue;

    let currentLevel = rootNodes;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1 && item.type === 'blob';

      let existing = currentLevel.find((n) => n.name === part);

      if (!existing) {
        if (isFile) {
          const estimatedLines =
            Math.max(1, Math.round((item.size || 70) / 35)) + 'L';
          existing = {
            name: part,
            path: currentPath,
            type: 'file',
            lines: estimatedLines,
          };
        } else {
          existing = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
          };
        }
        currentLevel.push(existing);
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }

  // Recursively sort folders first (alphabetical), then files (alphabetical)
  function sortTree(nodes: FileTreeNode[]) {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    for (const node of nodes) {
      if (node.children) {
        sortTree(node.children);
      }
    }
  }

  sortTree(rootNodes);
  return rootNodes;
}

/**
 * Fetch raw text content for a specific file capped at ~8,000 characters
 */
async function fetchFileContent(
  owner: string,
  repo: string,
  defaultBranch: string,
  filePath: string
): Promise<string | null> {
  const headers = getDefaultHeaders();
  // Strategy 1: Fast direct raw fetch
  try {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(defaultBranch)}/${filePath}`;
    const res = await fetch(rawUrl, {
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const text = await res.text();
      return text.slice(0, 8000);
    }
  } catch (err) {
    // Continue to fallback
  }

  // Strategy 2: Octokit getContent API
  try {
    const octokit = getOctokit();
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: defaultBranch,
    });

    if (!Array.isArray(data) && 'content' in data && data.content) {
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      return decoded.slice(0, 8000);
    }
  } catch (err) {
    // File not found or inaccessible
  }

  return null;
}

/**
 * Identify high-signal files from filtered tree paths:
 * - README.md / CONTRIBUTING.md
 * - Package manifest (package.json, pyproject.toml, Cargo.toml, go.mod, Dockerfile)
 * - Up to 2 likely entrypoint files
 */
export function identifyHighSignalFiles(paths: string[]): {
  readmePath?: string;
  contributingPath?: string;
  manifestPath?: string;
  entrypointPaths: string[];
} {
  const lowerMap = new Map<string, string>();
  for (const p of paths) {
    lowerMap.set(p.toLowerCase(), p);
  }

  // 1. README
  const readmeCandidates = ['readme.md', 'readme.markdown', 'readme.txt', 'readme'];
  let readmePath: string | undefined;
  for (const c of readmeCandidates) {
    if (lowerMap.has(c)) {
      readmePath = lowerMap.get(c);
      break;
    }
  }

  // 2. CONTRIBUTING
  const contributingCandidates = ['contributing.md', 'contributing.markdown', 'contributing'];
  let contributingPath: string | undefined;
  for (const c of contributingCandidates) {
    if (lowerMap.has(c)) {
      contributingPath = lowerMap.get(c);
      break;
    }
  }

  // 3. Manifest
  const manifestCandidates = [
    'package.json',
    'pyproject.toml',
    'cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'gemfile',
    'requirements.txt',
    'dockerfile',
  ];
  let manifestPath: string | undefined;
  for (const c of manifestCandidates) {
    if (lowerMap.has(c)) {
      manifestPath = lowerMap.get(c);
      break;
    }
  }

  // 4. Likely entrypoint files (up to 2)
  const entrypointCandidates = [
    'src/index.ts',
    'src/index.js',
    'src/main.ts',
    'src/main.js',
    'src/app.ts',
    'src/app.js',
    'src/app.tsx',
    'src/main.tsx',
    'lib/express.js',
    'lib/index.js',
    'index.ts',
    'index.js',
    'main.py',
    'app.py',
    'src/main.py',
    'main.go',
    'cmd/main.go',
    'src/main.rs',
    'src/lib.rs',
  ];

  const entrypointPaths: string[] = [];
  for (const candidate of entrypointCandidates) {
    if (entrypointPaths.length >= 2) break;
    if (lowerMap.has(candidate)) {
      const realPath = lowerMap.get(candidate)!;
      if (!entrypointPaths.includes(realPath)) {
        entrypointPaths.push(realPath);
      }
    }
  }

  // If no standard candidate matched, look for top-level or src/* files
  if (entrypointPaths.length < 2) {
    for (const p of paths) {
      if (entrypointPaths.length >= 2) break;
      const lower = p.toLowerCase();
      if (
        (lower.startsWith('src/') || !lower.includes('/')) &&
        (lower.endsWith('.ts') ||
          lower.endsWith('.js') ||
          lower.endsWith('.py') ||
          lower.endsWith('.go') ||
          lower.endsWith('.rs')) &&
        !lower.includes('test') &&
        !lower.includes('spec') &&
        !entrypointPaths.includes(p) &&
        p !== manifestPath &&
        p !== readmePath
      ) {
        entrypointPaths.push(p);
      }
    }
  }

  return {
    readmePath,
    contributingPath,
    manifestPath,
    entrypointPaths,
  };
}

/**
 * Filter and prioritize live open issues
 */
function processOpenIssues(issuesData: any[]): RawGithubIssue[] {
  if (!Array.isArray(issuesData)) return [];

  // Exclude Pull Requests (GitHub issues API includes PRs with pull_request key)
  const realIssues = issuesData.filter((i) => !i.pull_request);

  // Preferred issue label keywords
  const preferredKeywords = [
    'good first issue',
    'help wanted',
    'bug',
    'documentation',
    'easy',
    'beginner',
    'starter',
  ];

  // Score issues by label priority
  const scored = realIssues.map((issue) => {
    const labels = (issue.labels || []).map((l: any) =>
      typeof l === 'string' ? l : l.name || ''
    );
    const labelString = labels.join(' ').toLowerCase();
    let score = 0;

    for (const kw of preferredKeywords) {
      if (labelString.includes(kw)) {
        score += kw === 'good first issue' || kw === 'help wanted' ? 10 : 5;
      }
    }

    return {
      issue,
      labels,
      score,
    };
  });

  // Sort by score descending, then by issue number descending
  scored.sort((a, b) => b.score - a.score || b.issue.number - a.issue.number);

  return scored.slice(0, 8).map(({ issue, labels }) => ({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: (issue.body || '').slice(0, 500),
    labels,
    html_url: issue.html_url,
  }));
}

/**
 * Main ingestion entrypoint: executes fast, parallelized GitHub requests
 */
export async function ingestGithubRepo(repoUrl: string): Promise<GithubContext> {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const octokit = getOctokit();

  // Step 1: Execute parallel primary requests
  const [repoMetaRes, treeRes, issuesRes] = await Promise.all([
    // A: Metadata
    octokit.repos
      .get({ owner, repo })
      .then((r) => r.data)
      .catch((err) => {
        throw new Error(
          `Failed to fetch GitHub repository "${owner}/${repo}": ${err.message || 'Not found'}`
        );
      }),

    // B: Recursive File Tree (fetch default branch or master/main first from metadata)
    octokit.repos
      .get({ owner, repo })
      .then(async (m) => {
        const branch = m.data.default_branch || 'main';
        return octokit.git
          .getTree({
            owner,
            repo,
            tree_sha: branch,
            recursive: '1',
          })
          .then((r) => ({ branch, tree: r.data.tree || [] }))
          .catch(async () => {
            // Fallback: try master
            return octokit.git
              .getTree({
                owner,
                repo,
                tree_sha: 'master',
                recursive: '1',
              })
              .then((r) => ({ branch: 'master', tree: r.data.tree || [] }));
          });
      })
      .catch(() => ({ branch: 'main', tree: [] })),

    // C: Live Open Issues
    octokit.issues
      .listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 25,
      })
      .then((r) => r.data)
      .catch(() => []),
  ]);

  const defaultBranch = repoMetaRes.default_branch || treeRes.branch || 'main';
  const starsFormatted = formatStars(repoMetaRes.stargazers_count || 0);

  // Filter raw tree items with explicit typing
  const rawTree = Array.isArray(treeRes.tree) ? treeRes.tree : [];
  const cleanTreeItems: Array<{ path: string; type: string; size?: number }> = [];
  for (const item of rawTree) {
    if (
      typeof item.path === 'string' &&
      typeof item.type === 'string' &&
      !isNoisePath(item.path)
    ) {
      cleanTreeItems.push({
        path: item.path,
        type: item.type,
        size: typeof item.size === 'number' ? item.size : undefined,
      });
    }
  }

  const flatPaths = cleanTreeItems.map((item) => item.path);

  // Build clean nested hierarchical tree for UI
  const nestedTree = buildNestedTree(cleanTreeItems);

  // Process live open issues
  const openIssues = processOpenIssues(issuesRes);

  // Identify high-signal files
  const { readmePath, contributingPath, manifestPath, entrypointPaths } =
    identifyHighSignalFiles(flatPaths);

  const filesToFetch = [
    readmePath,
    contributingPath,
    manifestPath,
    ...entrypointPaths,
  ].filter(Boolean) as string[];

  // Fetch file contents in parallel
  const highSignalFiles: HighSignalFile[] = [];
  await Promise.all(
    filesToFetch.map(async (filePath) => {
      const content = await fetchFileContent(
        owner,
        repo,
        defaultBranch,
        filePath
      );
      if (content) {
        highSignalFiles.push({ path: filePath, content });
      }
    })
  );

  return {
    metadata: {
      owner: repoMetaRes.owner?.login || owner,
      name: repoMetaRes.name || repo,
      stars: starsFormatted,
      defaultBranch,
      description: repoMetaRes.description || '',
      language: repoMetaRes.language || 'Unknown',
    },
    fileTree: nestedTree,
    flatPaths,
    highSignalFiles,
    openIssues,
  };
}
