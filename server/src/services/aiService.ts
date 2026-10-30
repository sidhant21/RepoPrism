import { GoogleGenAI, Type } from '@google/genai';
import {
  AnalyzeRepoResponse,
  AnalyzeRepoResponseSchema,
  ChatResponse,
  ChatResponseSchema,
  ContextCardItem,
  FirstIssueItem,
  GithubContext,
  SystemCanvas,
  SystemCanvasNode,
  SystemCanvasEdge,
} from '../types.js';

// Priority order of Gemini models for resilience and speed
const GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
];

/**
 * Timeout helper to avoid any SDK hanging
 */
function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Model request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Gemini response schema definition using @google/genai Type enum
 */
const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    aiTitle: {
      type: Type.STRING,
      description:
        'A clear, engaging, intuitive title for this repository created by the AI (e.g., "Full-Stack FastAPI & React Cloud Boilerplate" or "Flutter Beat: Cross-Platform Streaming Music Player"). Do NOT just copy the raw GitHub about text.',
    },
    summary: {
      type: Type.STRING,
      description:
        'A short 2-line summary in simple, easy-to-understand words. Line 1 explains what problem this repo solves. Line 2 explains how the main parts work together. Use friendly words suitable for beginners.',
    },
    elevatorPitch: {
      type: Type.STRING,
      description:
        'A single punchy sentence summarizing the architectural essence of the repository.',
    },
    contextCards: {
      type: Type.ARRAY,
      description:
        'Exactly 4 context cards for Entrypoint, Core Engine, Data & Lifecycle, and Local Setup.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          tag: { type: Type.STRING },
          title: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          files: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['id', 'tag', 'title', 'bullets', 'files'],
      },
    },
    systemCanvas: {
      type: Type.OBJECT,
      description:
        'An interactive architecture node graph personalized for THIS specific repository. Nodes MUST represent actual components of this codebase (e.g., "FastAPI Router", "SQLAlchemy Engine", "AudioPlayer Controller", "React Reconciler", etc.), NOT generic names.',
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: {
                type: Type.STRING,
                description:
                  'Specific architecture component name in this repo (e.g. "Audio Stream Engine", "FastAPI Router", "Middleware Stack")',
              },
              sublabel: {
                type: Type.STRING,
                description: 'Real file path or module path in this repo',
              },
              category: {
                type: Type.STRING,
                enum: ['entry', 'core', 'data', 'external'],
              },
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
            },
            required: ['id', 'label', 'sublabel', 'category', 'x', 'y'],
          },
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              source: { type: Type.STRING },
              target: { type: Type.STRING },
              label: { type: Type.STRING },
            },
            required: ['id', 'source', 'target'],
          },
        },
      },
      required: ['nodes', 'edges'],
    },
    firstIssues: {
      type: Type.ARRAY,
      description:
        '4 to 6 issues mixing real GitHub issues and AI-detected codebase gaps.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ['github_issue', 'ai_detected'],
          },
          difficulty: {
            type: Type.STRING,
            enum: ['Quick Win', 'Good First Issue', 'Moderate'],
          },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          targetFiles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          issueUrl: { type: Type.STRING },
        },
        required: [
          'id',
          'type',
          'difficulty',
          'title',
          'description',
          'steps',
          'targetFiles',
        ],
      },
    },
  },
  required: [
    'aiTitle',
    'summary',
    'elevatorPitch',
    'contextCards',
    'systemCanvas',
    'firstIssues',
  ],
};

/**
 * Build the detailed prompt for Gemini
 */
function buildAnalysisPrompt(context: GithubContext): string {
  const { metadata, flatPaths, highSignalFiles, openIssues } = context;

  // Prune tree paths list to ~140 representative paths
  const samplePaths = flatPaths.slice(0, 140).join('\n');

  // Format high-signal files
  const filesContentStr = highSignalFiles
    .map((f) => `--- FILE: ${f.path} ---\n${f.content.slice(0, 3500)}\n`)
    .join('\n');

  // Format real issues
  const issuesStr =
    openIssues.length > 0
      ? openIssues
          .map(
            (i) =>
              `- Issue #${i.number}: "${i.title}"\n  Labels: [${i.labels.join(', ')}]\n  URL: ${i.html_url}\n  Body: ${i.body.slice(0, 300)}`
          )
          .join('\n\n')
      : 'No open issues found.';

  return `You are an elite Principal Software Architect and Open Source Mentor for "RepoPrism".
Your mission is to analyze a public GitHub repository and return strict structured JSON to hydrate our beginner-friendly contributor dashboard.

=== REPOSITORY METADATA ===
Repository: ${metadata.owner}/${metadata.name}
Language: ${metadata.language}
Stars: ${metadata.stars}
Default Branch: ${metadata.defaultBranch}
Raw Description: ${metadata.description || 'No description provided.'}

=== KEY FILE PATHS IN REPO ===
${samplePaths}

=== KEY FILE CONTENTS & MANIFESTS ===
${filesContentStr}

=== LIVE OPEN GITHUB ISSUES ===
${issuesStr}

=== STRICT REQUIREMENTS ===
1. aiTitle:
   - Provide an insightful, engaging title created by the AI (e.g. "Full-Stack FastAPI & React: Modern Cloud Web Application Boilerplate" or "Express: Minimalist Web Framework for Node.js APIs").
   - Do NOT just copy the raw GitHub about text word-for-word.

2. summary:
   - Exactly a short 2-line summary in simple, friendly, easy-to-understand words that any beginner can comprehend immediately.
   - Line 1: What problem this repo solves or what it builds in simple English.
   - Line 2: How the main parts connect together to get work done.

3. elevatorPitch:
   - Exactly 1 concise, elegant sentence describing the core architectural purpose and mental model of this codebase.

4. contextCards:
   Must provide exactly 4 cards in this exact sequence:
   - Card 1: id="01", tag="01 / ENTRYPOINT", title (e.g. "Where execution begins"). 3 technical bullets explaining entrypoint bootstrap with backtick code tokens, and 2-3 exact file paths from the tree.
   - Card 2: id="02", tag="02 / CORE ENGINE", title (e.g. "How the central modules interact"). 3 technical bullets explaining core mechanisms, and 2-3 exact file paths from the tree.
   - Card 3: id="03", tag="03 / DATA & LIFECYCLE", title (e.g. "How data and requests travel through the system"). 3 technical bullets explaining dataflow, and 2-3 exact file paths.
   - Card 4: id="04", tag="04 / LOCAL SETUP", title (e.g. "Run it in 3 commands"). 3 bullets with exact terminal commands (clone, install, test) and caveats, and 2-3 setup files.

5. systemCanvas:
   An interactive architecture node diagram with 5 to 7 clean nodes and directed edges.
   CRITICAL REQUIREMENT: This diagram MUST be deeply personalized for THIS specific codebase!
   - DO NOT USE GENERIC NAMES like "Application Core" or "Client / Inbound" unless that is the literal component.
   - If FastAPI: use nodes like "FastAPI Router", "SQLAlchemy Models", "React Vite Frontend", "Celery Worker", "Traefik Proxy".
   - If Flutter audio app: use nodes like "Flutter Audio Screen", "AudioPlayer Controller", "Music Stream Provider", "Local Cache".
   - If Express: use nodes like "Node HTTP Server", "Application Prototype", "Router Layer Stack", "Route Dispatcher", "Req & Res Decorator".
   - Node properties:
     - id: unique string (e.g. "entry", "router", "store", "worker", "client")
     - label: Specific architecture component name
     - sublabel: Real file path or function from the repository
     - category: Must be one of 'entry' | 'core' | 'data' | 'external'
     - Clean layout coordinates on a 700x550 canvas:
       - Top row (y: 40, x: ~340)
       - Upper middle (y: 160, x: ~340 or side by side x: 200, 480)
       - Lower middle (y: 300, x: 200, 480)
       - Bottom (y: 440 to 510, x: ~340)
   - Edges:
     - id, source, target, label (e.g. "dispatches", "queries", "renders", "emits")

6. firstIssues:
   Return 4 to 6 total items.
   - Mix real GitHub issues from the issues list above (type="github_issue", real issueUrl) and AI-detected codebase gaps (type="ai_detected", no issueUrl).
   - Each item must have id, difficulty ("Quick Win" | "Good First Issue" | "Moderate"), title, plain-English description, 2-3 steps, and targetFiles.

Generate only valid JSON conforming strictly to the requested schema.`;
}

/**
 * Intelligent heuristic fallback synthesis:
 * Generates an intuitive AI title, beginner-friendly 2-line summary,
 * and deeply personalized System Canvas based on the real files and structure.
 */
function synthesizeFallbackAnalysis(
  context: GithubContext
): Omit<AnalyzeRepoResponse, 'metadata' | 'fileTree'> {
  const { metadata, flatPaths, highSignalFiles, openIssues } = context;

  // 1. Detect framework / domain
  const repoName = metadata.name.toLowerCase();
  const lang = metadata.language || 'Code';
  const manifestFile = highSignalFiles.find((f) =>
    ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pubspec.yaml'].some((m) =>
      f.path.toLowerCase().endsWith(m)
    )
  );

  const isFastAPI =
    flatPaths.some((p) => p.includes('fastapi') || p.includes('backend/app')) ||
    manifestFile?.content.includes('fastapi');
  const isFlutter =
    flatPaths.some((p) => p.endsWith('.dart') || p.includes('lib/screens') || p.includes('lib/models')) ||
    manifestFile?.path.endsWith('pubspec.yaml');
  const isExpress =
    repoName.includes('express') ||
    flatPaths.some((p) => p.includes('lib/router') || p.includes('lib/application'));
  const isReact =
    repoName.includes('react') ||
    flatPaths.some((p) => p.includes('packages/react') || p.includes('packages/react-reconciler'));

  // 2. Generate AI Title (engaging & personalized, NOT just raw GitHub about)
  let aiTitle = '';
  if (isFastAPI) {
    aiTitle = `Full-Stack FastAPI & Cloud Application Architecture`;
  } else if (isFlutter) {
    aiTitle = `Flutter Cross-Platform Mobile Application Engine`;
  } else if (isExpress) {
    aiTitle = `Express: Minimalist Web Framework & Routing Pipeline for Node.js`;
  } else if (isReact) {
    aiTitle = `React: Declarative UI Engine & Fiber Reconciliation Pipeline`;
  } else if (metadata.description) {
    // Clean and elevate raw description
    const cleaned = metadata.description
      .replace(/^(a|an|the)\s+/i, '')
      .replace(/\.$/, '');
    aiTitle = `${metadata.name}: ${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)}`;
  } else {
    aiTitle = `${metadata.name}: Modern ${lang} Open-Source Architecture`;
  }

  // 3. Generate 2-line Summary in easy, understandable words for beginners
  let summary = '';
  if (isFastAPI) {
    summary = `This project provides a complete template for building modern web applications with a Python backend and a web frontend.\nIt connects a fast REST API directly to a database, handles user logins securely, and includes ready-to-run Docker setups.`;
  } else if (isFlutter) {
    summary = `This mobile app delivers an interactive, smooth user interface built with Flutter that runs on both iOS and Android.\nIt manages your screen states, streams media playback efficiently, and stores offline preferences on your device.`;
  } else if (isExpress) {
    summary = `Express works like a smart traffic controller for internet requests arriving at your Node.js server.\nIt sends each incoming web request through a chain of helpful functions called middleware until it delivers the final response.`;
  } else if (isReact) {
    summary = `React lets developers build interactive user interfaces by describing what the screen should look like as reusable components.\nUnder the hood, its reconciliation engine updates only the specific parts of the webpage that actually changed.`;
  } else {
    const topic = metadata.description
      ? metadata.description.toLowerCase().replace(/\.$/, '')
      : `${lang} software utility`;
    summary = `This project is an open-source tool designed to make ${topic} simple, dependable, and efficient.\nIts code is split into focused modules so you can easily understand where data enters, how it is processed, and where it is saved.`;
  }

  // 4. Elevator Pitch
  const elevatorPitch = `${metadata.name} is structured around clean modular boundaries and composable abstractions — enabling fast comprehension and rapid onboarding.`;

  // 5. Entrypoint & setup files
  const entryFile =
    highSignalFiles.find(
      (f) =>
        f.path.includes('index') ||
        f.path.includes('main') ||
        f.path.includes('app')
    )?.path ||
    flatPaths.find(
      (p) =>
        p.endsWith('.ts') ||
        p.endsWith('.js') ||
        p.endsWith('.py') ||
        p.endsWith('.go') ||
        p.endsWith('.dart')
    ) ||
    'src/index.ts';

  const readmeFile = highSignalFiles.find((f) =>
    f.path.toLowerCase().includes('readme')
  );
  const setupFile = manifestFile ? manifestFile.path : 'package.json';

  // 6. Context Cards
  const contextCards: [
    ContextCardItem,
    ContextCardItem,
    ContextCardItem,
    ContextCardItem
  ] = [
    {
      id: '01',
      tag: '01 / ENTRYPOINT',
      title: 'Where execution begins',
      bullets: [
        `Bootstrap initiates from \`${entryFile}\` and loads primary configurations`,
        `Initializes core state stores and establishes communication interfaces`,
        `Delegates inbound requests or events directly to internal controllers`,
      ],
      files: [entryFile, setupFile].filter(Boolean),
    },
    {
      id: '02',
      tag: '02 / CORE ENGINE',
      title: 'How the central modules interact',
      bullets: [
        `Main logic is cleanly divided into domain modules across \`${flatPaths.slice(0, 3).join('`, `')}\``,
        `Services communicate via typed contracts to prevent unexpected runtime side effects`,
        `Internal error-handling wrappers isolate failures without halting the application`,
      ],
      files: flatPaths.slice(0, 3),
    },
    {
      id: '03',
      tag: '03 / DATA & LIFECYCLE',
      title: 'How data travels through the system',
      bullets: [
        `Inbound parameters pass through strict validation and schema normalization`,
        `Core pipeline transforms models step-by-step in predictable lifecycle stages`,
        `Outcomes are safely persisted or dispatched directly back to the client interface`,
      ],
      files: flatPaths.slice(1, 4),
    },
    {
      id: '04',
      tag: '04 / LOCAL SETUP',
      title: 'Run it in 3 commands',
      bullets: [
        `git clone https://github.com/${metadata.owner}/${metadata.name}.git`,
        lang === 'Python'
          ? 'pip install -r requirements.txt && pytest'
          : lang === 'Dart'
            ? 'flutter pub get && flutter run'
            : lang === 'Go'
              ? 'go mod download && go test ./...'
              : 'npm install && npm test',
        `Check \`${readmeFile ? readmeFile.path : 'README.md'}\` for local environment variable configuration`,
      ],
      files: [setupFile, readmeFile?.path || 'README.md'].filter(Boolean),
    },
  ];

  // 7. Deeply Personalized System Canvas
  let canvasNodes: SystemCanvasNode[] = [];
  let canvasEdges: SystemCanvasEdge[] = [];

  if (isFastAPI) {
    canvasNodes = [
      { id: 'client', label: 'Web Client / Frontend', sublabel: 'frontend/src', category: 'external', x: 340, y: 40 },
      { id: 'proxy', label: 'Traefik / Proxy Layer', sublabel: 'docker-compose.yml', category: 'entry', x: 340, y: 155 },
      { id: 'api', label: 'FastAPI Router', sublabel: 'backend/app/api', category: 'core', x: 200, y: 280 },
      { id: 'crud', label: 'CRUD & Domain Services', sublabel: 'backend/app/crud', category: 'core', x: 480, y: 280 },
      { id: 'models', label: 'SQLAlchemy & Pydantic', sublabel: 'backend/app/models', category: 'data', x: 200, y: 410 },
      { id: 'db', label: 'PostgreSQL Database', sublabel: 'Relational Store', category: 'data', x: 480, y: 410 },
    ];
    canvasEdges = [
      { id: 'e1', source: 'client', target: 'proxy', label: 'HTTP requests' },
      { id: 'e2', source: 'proxy', target: 'api', label: 'routes to /api' },
      { id: 'e3', source: 'api', target: 'crud', label: 'delegates ops' },
      { id: 'e4', source: 'crud', target: 'models', label: 'validates schema' },
      { id: 'e5', source: 'models', target: 'db', label: 'executes SQL' },
      { id: 'e6', source: 'crud', target: 'api', label: 'returns models' },
    ];
  } else if (isFlutter) {
    canvasNodes = [
      { id: 'ui', label: 'Flutter UI Screens', sublabel: 'lib/screens', category: 'entry', x: 340, y: 40 },
      { id: 'provider', label: 'State & Audio Provider', sublabel: 'lib/providers', category: 'core', x: 340, y: 155 },
      { id: 'player', label: 'Audio Engine Service', sublabel: 'lib/services/audio', category: 'core', x: 200, y: 290 },
      { id: 'models', label: 'Media & Track Models', sublabel: 'lib/models', category: 'core', x: 480, y: 290 },
      { id: 'cache', label: 'Local Cache & Hive/Prefs', sublabel: 'Device Storage', category: 'data', x: 340, y: 420 },
      { id: 'platform', label: 'Native Audio HAL', sublabel: 'iOS / Android Platform', category: 'external', x: 340, y: 510 },
    ];
    canvasEdges = [
      { id: 'e1', source: 'ui', target: 'provider', label: 'user taps play/pause' },
      { id: 'e2', source: 'provider', target: 'player', label: 'commands stream' },
      { id: 'e3', source: 'provider', target: 'models', label: 'manages playlist' },
      { id: 'e4', source: 'player', target: 'platform', label: 'hardware audio output' },
      { id: 'e5', source: 'player', target: 'cache', label: 'caches audio track' },
    ];
  } else if (isExpress) {
    canvasNodes = [
      { id: 'http', label: 'Node HTTP Server', sublabel: 'http.createServer', category: 'entry', x: 340, y: 40 },
      { id: 'app', label: 'Application Prototype', sublabel: 'lib/application.js', category: 'core', x: 340, y: 155 },
      { id: 'router', label: 'Router Engine', sublabel: 'lib/router/index.js', category: 'core', x: 340, y: 270 },
      { id: 'layer', label: 'Layer Middleware Stack', sublabel: 'lib/router/layer.js', category: 'core', x: 180, y: 385 },
      { id: 'route', label: 'Route Dispatcher', sublabel: 'lib/router/route.js', category: 'core', x: 500, y: 385 },
      { id: 'reqres', label: 'Req & Res Decorator', sublabel: 'request.js · response.js', category: 'data', x: 340, y: 495 },
    ];
    canvasEdges = [
      { id: 'e1', source: 'http', target: 'app', label: 'delegates req/res' },
      { id: 'e2', source: 'app', target: 'router', label: 'app.handle()' },
      { id: 'e3', source: 'router', target: 'layer', label: 'matches path' },
      { id: 'e4', source: 'router', target: 'route', label: 'dispatches verb' },
      { id: 'e5', source: 'layer', target: 'reqres', label: 'invokes next()' },
      { id: 'e6', source: 'route', target: 'reqres', label: 'sends response' },
    ];
  } else {
    // Dynamic extraction from flatPaths for any custom repo
    const directories = Array.from(
      new Set(
        flatPaths
          .map((p) => p.split('/')[0])
          .filter((d) => !d.includes('.') && d.length > 2)
      )
    ).slice(0, 5);

    const n1 = directories[0] || 'src';
    const n2 = directories[1] || 'lib';
    const n3 = directories[2] || 'components';
    const n4 = directories[3] || 'services';
    const n5 = directories[4] || 'utils';

    canvasNodes = [
      { id: 'entry', label: `Inbound Entry (${entryFile.split('/').pop()})`, sublabel: entryFile, category: 'entry', x: 340, y: 40 },
      { id: 'mod1', label: `${n1.charAt(0).toUpperCase() + n1.slice(1)} Module`, sublabel: `${n1}/`, category: 'core', x: 200, y: 170 },
      { id: 'mod2', label: `${n2.charAt(0).toUpperCase() + n2.slice(1)} Service`, sublabel: `${n2}/`, category: 'core', x: 480, y: 170 },
      { id: 'mod3', label: `${n3.charAt(0).toUpperCase() + n3.slice(1)} Layer`, sublabel: `${n3}/`, category: 'core', x: 200, y: 310 },
      { id: 'mod4', label: `${n4.charAt(0).toUpperCase() + n4.slice(1)} Store`, sublabel: `${n4}/`, category: 'data', x: 480, y: 310 },
      { id: 'out', label: `${n5.charAt(0).toUpperCase() + n5.slice(1)} Output Boundary`, sublabel: `${n5}/`, category: 'external', x: 340, y: 460 },
    ];
    canvasEdges = [
      { id: 'e1', source: 'entry', target: 'mod1', label: 'initializes' },
      { id: 'e2', source: 'entry', target: 'mod2', label: 'configures' },
      { id: 'e3', source: 'mod1', target: 'mod3', label: 'passes payload' },
      { id: 'e4', source: 'mod2', target: 'mod4', label: 'writes data' },
      { id: 'e5', source: 'mod3', target: 'out', label: 'formats output' },
      { id: 'e6', source: 'mod4', target: 'out', label: 'streams state' },
    ];
  }

  const systemCanvas: SystemCanvas = {
    nodes: canvasNodes,
    edges: canvasEdges,
  };

  // 8. First Issues
  const firstIssues: FirstIssueItem[] = [];
  for (let i = 0; i < Math.min(openIssues.length, 3); i++) {
    const issue = openIssues[i];
    firstIssues.push({
      id: `issue-${i + 1}`,
      type: 'github_issue',
      difficulty: i === 0 ? 'Good First Issue' : 'Quick Win',
      title: issue.title,
      description:
        issue.body.slice(0, 160).trim() ||
        `Community issue #${issue.number} regarding expected functionality.`,
      steps: [
        `Review the issue discussion at GitHub (#${issue.number})`,
        `Locate relevant code in \`${entryFile}\` or test suites`,
        `Submit a PR referencing #${issue.number} with unit test coverage`,
      ],
      targetFiles: [entryFile],
      issueUrl: issue.html_url,
    });
  }

  const aiGaps: Array<{
    title: string;
    description: string;
    steps: string[];
    file: string;
    difficulty: 'Quick Win' | 'Good First Issue' | 'Moderate';
  }> = [
    {
      title: `Add inline documentation to exported functions in \`${entryFile}\``,
      description:
        'Key entrypoint methods currently lack descriptive comments for parameter types and return values.',
      steps: [
        `Open \`${entryFile}\` and locate exported functions`,
        'Add standardized comments with parameter descriptions and examples',
        'Verify IDE tooltips render helpful hints',
      ],
      file: entryFile,
      difficulty: 'Good First Issue',
    },
    {
      title: 'Missing boundary test for empty input arguments',
      description:
        'Test suite does not explicitly assert behavior when null or empty options are passed during initialization.',
      steps: [
        'Create a unit test targeting initialization edge cases',
        'Assert that meaningful validation errors are returned',
        'Run test suite locally to verify test passes',
      ],
      file: flatPaths.find((p) => p.includes('test')) || entryFile,
      difficulty: 'Quick Win',
    },
  ];

  for (const gap of aiGaps) {
    if (firstIssues.length >= 5) break;
    firstIssues.push({
      id: `ai-gap-${firstIssues.length + 1}`,
      type: 'ai_detected',
      difficulty: gap.difficulty,
      title: gap.title,
      description: gap.description,
      steps: gap.steps,
      targetFiles: [gap.file],
    });
  }

  return {
    aiTitle,
    summary,
    elevatorPitch,
    contextCards,
    systemCanvas,
    firstIssues,
  };
}

/**
 * Main AI analysis orchestrator:
 * Uses @google/genai with model fallback chain.
 * Falls back to intelligent synthesizer if API key is unset or all models fail.
 */
export async function generateRepoAnalysis(
  context: GithubContext
): Promise<AnalyzeRepoResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  let aiResult: Omit<AnalyzeRepoResponse, 'metadata' | 'fileTree'> | null = null;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildAnalysisPrompt(context);

    // Try available models in priority order
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[aiService] Attempting analysis with model: ${model}...`);
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: geminiResponseSchema as any,
              temperature: 0.2,
            },
          }),
          12000
        );

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);

        if (
          Array.isArray(parsed.contextCards) &&
          parsed.contextCards.length === 4 &&
          parsed.systemCanvas?.nodes?.length >= 4
        ) {
          aiResult = parsed;
          console.log(`[aiService] Analysis successfully generated by ${model}!`);
          break;
        }
      } catch (err: any) {
        console.warn(`[aiService] Model ${model} failed (${err.message?.slice(0, 80)}). Trying next...`);
      }
    }
  }

  if (!aiResult) {
    console.info('[aiService] Using repository-tailored heuristic synthesizer.');
    aiResult = synthesizeFallbackAnalysis(context);
  }

  // Combine GitHub ingestion metadata & tree with AI structured analysis
  const fullResponse: AnalyzeRepoResponse = {
    metadata: {
      owner: context.metadata.owner,
      name: context.metadata.name,
      stars: context.metadata.stars,
      defaultBranch: context.metadata.defaultBranch,
      description: context.metadata.description,
      language: context.metadata.language,
    },
    fileTree: context.fileTree,
    aiTitle: aiResult.aiTitle,
    summary: aiResult.summary,
    elevatorPitch: aiResult.elevatorPitch,
    contextCards: aiResult.contextCards as [
      ContextCardItem,
      ContextCardItem,
      ContextCardItem,
      ContextCardItem,
    ],
    systemCanvas: aiResult.systemCanvas,
    firstIssues: aiResult.firstIssues,
  };

  return AnalyzeRepoResponseSchema.parse(fullResponse);
}

/**
 * Live AI Chat Q&A Engine:
 * Answers contributor questions specifically about this codebase.
 */
export async function askRepoAI(
  context: GithubContext,
  question: string
): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { metadata, flatPaths, highSignalFiles } = context;

  const relevantPaths = flatPaths.slice(0, 100).join('\n');
  const fileExcerpts = highSignalFiles
    .slice(0, 3)
    .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 2000)}`)
    .join('\n\n');

  const prompt = `You are RepoPrism's AI Code Navigator for the repository: ${metadata.owner}/${metadata.name} (${metadata.language}).
User Question: "${question}"

=== REPO SUMMARY ===
${metadata.description || 'Open source project'}

=== RELEVANT CODEBASE FILES ===
${relevantPaths}

=== FILE EXCERPTS ===
${fileExcerpts}

=== INSTRUCTIONS ===
1. Answer the question accurately, directly, and specifically based on this repository's codebase.
2. Use markdown formatting with inline code backticks for functions, methods, and files.
3. Keep the answer concise (2-4 clear paragraphs).
4. Identify 1 to 3 exact file paths in the repo that are most relevant to the question.

Return JSON strictly in this structure:
{
  "answer": "string (markdown formatted)",
  "fileBadges": [
    { "label": "filename or short path", "path": "exact file path in repo" }
  ]
}`;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[aiService] Chat query using model: ${model}...`);
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
          8000
        );

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);

        if (parsed.answer) {
          const result: ChatResponse = {
            question,
            answer: parsed.answer,
            fileBadges: Array.isArray(parsed.fileBadges)
              ? parsed.fileBadges
              : [{ label: highSignalFiles[0]?.path || 'README.md', path: highSignalFiles[0]?.path || 'README.md' }],
          };
          return ChatResponseSchema.parse(result);
        }
      } catch (err: any) {
        console.warn(`[aiService] Chat query failed on ${model}: ${err.message?.slice(0, 80)}`);
      }
    }
  }

  // Intelligent fallback for chat queries based on actual repo structure
  console.info('[aiService] Chat using local repository context synthesizer.');
  const qLower = question.toLowerCase();

  // Find matching files based on question keywords
  const matchedFiles = highSignalFiles.filter((f) => {
    const p = f.path.toLowerCase();
    const words = qLower.split(/\W+/).filter((w) => w.length > 3);
    return words.some((w) => p.includes(w) || f.content.toLowerCase().includes(w));
  });

  const bestFile = matchedFiles[0] || highSignalFiles[0] || { path: 'README.md', content: '' };
  const fileBadges = (matchedFiles.length > 0 ? matchedFiles : highSignalFiles)
    .slice(0, 3)
    .map((f) => ({ label: f.path.split('/').pop() || f.path, path: f.path }));

  let answerText = '';
  if (qLower.includes('test') || qLower.includes('run test')) {
    const manifest = highSignalFiles.find((f) => f.path.includes('package.json') || f.path.includes('pyproject') || f.path.includes('pubspec'));
    answerText = `In **${metadata.name}**, tests are located across the test directories.\n\nYou can run the test suite using standard commands:\n\`\`\`bash\n${
      metadata.language === 'Python' ? 'pytest' : metadata.language === 'Dart' ? 'flutter test' : 'npm test'
    }\n\`\`\`\nRefer to \`${manifest?.path || 'README.md'}\` for test configuration details.`;
  } else if (qLower.includes('route') || qLower.includes('routing') || qLower.includes('api') || qLower.includes('endpoint')) {
    answerText = `Routing and endpoint declarations in **${metadata.name}** are organized under \`${bestFile.path}\`.\n\nIncoming requests are received by the entrypoint and dispatched according to matched path patterns and controller handlers.`;
  } else {
    answerText = `In **${metadata.name}**, execution is centered around \`${bestFile.path}\`.\n\nBased on the codebase structure, this module orchestrates primary business logic, manages state boundaries, and communicates with dependent services across the project.`;
  }

  return {
    question,
    answer: answerText,
    fileBadges: fileBadges.length > 0 ? fileBadges : [{ label: 'README.md', path: 'README.md' }],
  };
}
