import { z } from 'zod';

// ─── File Tree Node ─────────────────────────────────────────────────────────
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  lines?: string; // e.g. "113L"
  children?: FileTreeNode[];
}

export const FileTreeNodeSchema: z.ZodType<FileTreeNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    path: z.string(),
    type: z.enum(['folder', 'file']),
    lines: z.string().optional(),
    children: z.array(FileTreeNodeSchema).optional(),
  })
);

// ─── Context Cards ──────────────────────────────────────────────────────────
export interface ContextCardItem {
  id: '01' | '02' | '03' | '04' | string;
  tag: '01 / ENTRYPOINT' | '02 / CORE ENGINE' | '03 / DATA & LIFECYCLE' | '04 / LOCAL SETUP' | string;
  title: string;
  bullets: string[];
  files: string[];
}

export const ContextCardItemSchema = z.object({
  id: z.string(),
  tag: z.string(),
  title: z.string(),
  bullets: z.array(z.string()),
  files: z.array(z.string()),
});

// ─── System Canvas ──────────────────────────────────────────────────────────
export interface SystemCanvasNode {
  id: string;
  label: string;
  sublabel: string;
  category: 'entry' | 'core' | 'data' | 'external';
  x: number;
  y: number;
}

export const SystemCanvasNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string(),
  category: z.enum(['entry', 'core', 'data', 'external']),
  x: z.number(),
  y: z.number(),
});

export interface SystemCanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export const SystemCanvasEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

export interface SystemCanvas {
  nodes: SystemCanvasNode[];
  edges: SystemCanvasEdge[];
}

export const SystemCanvasSchema = z.object({
  nodes: z.array(SystemCanvasNodeSchema),
  edges: z.array(SystemCanvasEdgeSchema),
});

// ─── First Issues ───────────────────────────────────────────────────────────
export interface FirstIssueItem {
  id: string;
  type: 'github_issue' | 'ai_detected';
  difficulty: 'Quick Win' | 'Good First Issue' | 'Moderate';
  title: string;
  description: string;
  steps: string[];
  targetFiles: string[];
  issueUrl?: string;
}

export const FirstIssueItemSchema = z.object({
  id: z.string(),
  type: z.enum(['github_issue', 'ai_detected']),
  difficulty: z.enum(['Quick Win', 'Good First Issue', 'Moderate']),
  title: z.string(),
  description: z.string(),
  steps: z.array(z.string()),
  targetFiles: z.array(z.string()),
  issueUrl: z.string().optional(),
});

// ─── Analyze Repo Response ──────────────────────────────────────────────────
export interface AnalyzeRepoResponse {
  metadata: {
    owner: string;
    name: string;
    stars: string; // e.g. "65.2k"
    defaultBranch: string;
    description?: string;
    language?: string;
  };
  fileTree: FileTreeNode[];
  aiTitle?: string;
  summary?: string;
  elevatorPitch: string;
  contextCards: [
    ContextCardItem,
    ContextCardItem,
    ContextCardItem,
    ContextCardItem
  ];
  systemCanvas: SystemCanvas;
  firstIssues: FirstIssueItem[];
}

export const AnalyzeRepoResponseSchema = z.object({
  metadata: z.object({
    owner: z.string(),
    name: z.string(),
    stars: z.string(),
    defaultBranch: z.string(),
    description: z.string().optional(),
    language: z.string().optional(),
  }),
  fileTree: z.array(FileTreeNodeSchema),
  aiTitle: z.string().optional(),
  summary: z.string().optional(),
  elevatorPitch: z.string(),
  contextCards: z.tuple([
    ContextCardItemSchema,
    ContextCardItemSchema,
    ContextCardItemSchema,
    ContextCardItemSchema,
  ]),
  systemCanvas: SystemCanvasSchema,
  firstIssues: z.array(FirstIssueItemSchema),
});

// ─── Chat Types ─────────────────────────────────────────────────────────────
export interface ChatRequest {
  repoUrl: string;
  question: string;
}

export interface ChatResponse {
  question: string;
  answer: string;
  fileBadges: Array<{ label: string; path: string }>;
}

export const ChatResponseSchema = z.object({
  question: z.string(),
  answer: z.string(),
  fileBadges: z.array(
    z.object({
      label: z.string(),
      path: z.string(),
    })
  ),
});

// ─── GitHub Ingestion Context ───────────────────────────────────────────────
export interface HighSignalFile {
  path: string;
  content: string; // capped at ~8,000 chars
}

export interface RawGithubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: string[];
  html_url: string;
}

export interface GithubContext {
  metadata: {
    owner: string;
    name: string;
    stars: string;
    defaultBranch: string;
    description: string;
    language: string;
  };
  fileTree: FileTreeNode[];
  flatPaths: string[];
  highSignalFiles: HighSignalFile[];
  openIssues: RawGithubIssue[];
}
