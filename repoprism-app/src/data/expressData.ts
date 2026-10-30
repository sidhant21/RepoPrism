// ─── Mock data for expressjs/express dashboard ───────────────────────────────

export const REPO_META = {
  owner: 'expressjs',
  name: 'express',
  stars: '65.2k',
  description: 'Fast, unopinionated, minimalist web framework for Node.js',
  language: 'JavaScript',
  license: 'MIT',
  openIssues: 142,
  lastCommit: '3 days ago',
}

// ─── File Tree ────────────────────────────────────────────────────────────────

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'dir'
  children?: FileNode[]
  summary?: string
  exports?: string[]
  lines?: number
}

export const FILE_TREE: FileNode[] = [
  {
    id: 'root-lib',
    name: 'lib',
    type: 'dir',
    children: [
      {
        id: 'lib-express',
        name: 'express.js',
        type: 'file',
        lines: 112,
        summary: 'The primary factory function that creates a new Express application instance. Merges the application prototype, request prototype, and response prototype onto a fresh function.',
        exports: ['createApplication', 'default'],
      },
      {
        id: 'lib-application',
        name: 'application.js',
        type: 'file',
        lines: 616,
        summary: 'Defines the `app` object prototype — the core of every Express application. Houses `app.use()`, `app.listen()`, `app.set()`, and the routing delegation logic.',
        exports: ['app'],
      },
      {
        id: 'lib-request',
        name: 'request.js',
        type: 'file',
        lines: 524,
        summary: 'Extends Node\'s native `http.IncomingMessage` to add convenience properties like `req.params`, `req.query`, `req.body`, and `req.get()`.',
        exports: ['req'],
      },
      {
        id: 'lib-response',
        name: 'response.js',
        type: 'file',
        lines: 1098,
        summary: 'Extends Node\'s native `http.ServerResponse` with high-level methods like `res.json()`, `res.send()`, `res.redirect()`, and `res.render()`.',
        exports: ['res'],
      },
      {
        id: 'lib-router-dir',
        name: 'router',
        type: 'dir',
        children: [
          {
            id: 'lib-router-index',
            name: 'index.js',
            type: 'file',
            lines: 691,
            summary: 'The Router class — a mini Express application with only routing and middleware capabilities. Supports `router.use()`, `router.route()`, and HTTP verb methods.',
            exports: ['Router'],
          },
          {
            id: 'lib-router-route',
            name: 'route.js',
            type: 'file',
            lines: 234,
            summary: 'The Route class binding a path string to an ordered set of middleware handlers. One Route per path, dispatching across multiple HTTP verbs.',
            exports: ['Route'],
          },
          {
            id: 'lib-router-layer',
            name: 'layer.js',
            type: 'file',
            lines: 155,
            summary: 'A single middleware or route wrapper. Handles path matching via `path-to-regexp`, error propagation, and invokes the handler with `(req, res, next)`.',
            exports: ['Layer'],
          },
        ],
      },
      {
        id: 'lib-middleware-dir',
        name: 'middleware',
        type: 'dir',
        children: [
          {
            id: 'lib-middleware-json',
            name: 'json.js',
            type: 'file',
            lines: 82,
            summary: 'Built-in middleware that parses incoming JSON payloads and exposes them on `req.body`. Wraps the `body-parser` JSON parser.',
            exports: ['json'],
          },
          {
            id: 'lib-middleware-query',
            name: 'query.js',
            type: 'file',
            lines: 47,
            summary: 'Parses the URL query string on every request and populates `req.query`. Uses the `qs` library for nested object parsing.',
            exports: ['query'],
          },
          {
            id: 'lib-middleware-static',
            name: 'static.js',
            type: 'file',
            lines: 36,
            summary: 'Re-exports `serve-static` as `express.static()` — the standard way to serve a directory of static files in Express.',
            exports: ['serveStatic'],
          },
        ],
      },
      {
        id: 'lib-utils',
        name: 'utils.js',
        type: 'file',
        lines: 333,
        summary: 'Internal utility belt: type coercion helpers, MIME type resolution, `setCharset`, `normalizeType`, and the `compileTrust` proxy-trust parser.',
        exports: ['setCharset', 'normalizeType', 'compileTrust'],
      },
      {
        id: 'lib-view',
        name: 'view.js',
        type: 'file',
        lines: 188,
        summary: 'The View class resolving and rendering template files via a pluggable engine system. Calls `engine(path, options, callback)` to render any registered template engine.',
        exports: ['View'],
      },
    ],
  },
  {
    id: 'root-test',
    name: 'test',
    type: 'dir',
    children: [
      { id: 'test-app', name: 'app.js', type: 'file', lines: 210, summary: 'Integration tests for core app-level settings, mounting, and trust proxy behaviour.', exports: [] },
      { id: 'test-req', name: 'req.js', type: 'file', lines: 880, summary: 'Exhaustive unit tests for all properties and methods exposed on the `req` object.', exports: [] },
      { id: 'test-res', name: 'res.js', type: 'file', lines: 1420, summary: 'Unit tests for every `res.*` method including json, send, redirect, cookie, and render.', exports: [] },
      { id: 'test-router', name: 'Router.js', type: 'file', lines: 690, summary: 'Tests for the Router class — mounting, nesting, param callbacks, and error handling.', exports: [] },
    ],
  },
  {
    id: 'root-index',
    name: 'index.js',
    type: 'file',
    lines: 11,
    summary: 'The package entry point. Simply re-exports `./lib/express` — exists to preserve backwards compatibility and npm publish hygiene.',
    exports: ['express'],
  },
  {
    id: 'root-package',
    name: 'package.json',
    type: 'file',
    lines: 58,
    summary: 'NPM package manifest declaring the `main` entry, peer dependencies (Node ≥ 0.10), and a large dependency list including `path-to-regexp`, `qs`, `depd`, and `debug`.',
    exports: [],
  },
  {
    id: 'root-readme',
    name: 'README.md',
    type: 'file',
    lines: 164,
    summary: 'The public-facing documentation stub. Points contributors to expressjs.com for full API docs, the GitHub Discussions forum, and the CONTRIBUTING.md guide.',
    exports: [],
  },
  {
    id: 'root-contributing',
    name: 'Contributing.md',
    type: 'file',
    lines: 60,
    summary: 'Contributor guide outlining the PR checklist, coding style, test coverage requirements, and the CLA signing process for new contributors.',
    exports: [],
  },
]

// ─── Context Cards ────────────────────────────────────────────────────────────

export const ELEVATOR_PITCH =
  'Express is a thin routing and middleware layer that wraps Node\'s HTTP server — every request flows through a linear stack of functions until a response is sent.'

export interface ContextCard {
  id: string
  index: string
  label: string
  tagline: string
  bullets: string[]
  files: { label: string; path: string }[]
}

export const CONTEXT_CARDS: ContextCard[] = [
  {
    id: 'card-entrypoint',
    index: '01',
    label: 'ENTRYPOINT',
    tagline: 'Where execution begins',
    bullets: [
      '`index.js` re-exports `lib/express.js`',
      '`createApplication()` merges app, req & res prototypes',
      'Default middleware (query parser, init) is mounted automatically',
    ],
    files: [
      { label: 'index.js', path: 'index.js' },
      { label: 'lib/express.js', path: 'lib/express.js' },
    ],
  },
  {
    id: 'card-core',
    index: '02',
    label: 'CORE ENGINE',
    tagline: 'How the central folders interact',
    bullets: [
      '`application.js` owns `app.use()` and delegates to `Router`',
      '`Router` chains `Layer` instances in a middleware stack',
      'Each `Layer` wraps one handler + a compiled path matcher',
    ],
    files: [
      { label: 'lib/application.js', path: 'lib/application.js' },
      { label: 'lib/router/index.js', path: 'lib/router/index.js' },
    ],
  },
  {
    id: 'card-data',
    index: '03',
    label: 'DATA & LIFECYCLE',
    tagline: 'How a request travels through Express',
    bullets: [
      'HTTP request → `app.handle()` → `Router.handle()` → Layer stack',
      'Each layer calls `next()` or terminates with `res.send()`',
      '`req` and `res` are decorated once at app creation time',
    ],
    files: [
      { label: 'lib/request.js', path: 'lib/request.js' },
      { label: 'lib/response.js', path: 'lib/response.js' },
    ],
  },
  {
    id: 'card-setup',
    index: '04',
    label: 'LOCAL SETUP',
    tagline: 'Run it in 3 commands',
    bullets: [
      'git clone https://github.com/expressjs/express.git',
      'npm install',
      'npm test  # runs the full Mocha suite',
    ],
    files: [
      { label: 'package.json', path: 'package.json' },
      { label: 'Contributing.md', path: 'Contributing.md' },
    ],
  },
]

// ─── System Canvas Nodes ──────────────────────────────────────────────────────

export interface CanvasNode {
  id: string
  label: string
  sublabel: string
  x: number
  y: number
}

export interface CanvasEdge {
  from: string
  to: string
  label?: string
}

export const CANVAS_NODES: CanvasNode[] = [
  { id: 'http', label: 'Node HTTP', sublabel: 'http.createServer', x: 340, y: 40 },
  { id: 'app', label: 'Application', sublabel: 'lib/application.js', x: 340, y: 155 },
  { id: 'router', label: 'Router', sublabel: 'lib/router/index.js', x: 340, y: 270 },
  { id: 'layer', label: 'Layer Stack', sublabel: 'lib/router/layer.js', x: 160, y: 380 },
  { id: 'route', label: 'Route', sublabel: 'lib/router/route.js', x: 520, y: 380 },
  { id: 'reqres', label: 'Req / Res', sublabel: 'request.js · response.js', x: 340, y: 490 },
]

export const CANVAS_EDGES: CanvasEdge[] = [
  { from: 'http', to: 'app', label: 'delegates' },
  { from: 'app', to: 'router', label: 'app.handle()' },
  { from: 'router', to: 'layer', label: 'match' },
  { from: 'router', to: 'route', label: 'route()' },
  { from: 'layer', to: 'reqres', label: 'next()' },
  { from: 'route', to: 'reqres', label: 'dispatch' },
]

// ─── First Issues ─────────────────────────────────────────────────────────────

export type IssueTag = 'Good First Issue' | 'AI Detected Gap' | 'Documentation'

export interface ContributionCard {
  id: string
  tag: IssueTag
  number?: string
  title: string
  description: string
  steps: string[]
  targetFile: string
  difficulty: 'Easy' | 'Medium'
}

export const CONTRIBUTION_CARDS: ContributionCard[] = [
  {
    id: 'issue-1',
    tag: 'Good First Issue',
    number: '#5654',
    title: 'Add JSDoc to res.clearCookie()',
    description: 'The clearCookie method lacks inline documentation, making IDE hover help unhelpful for new users.',
    steps: [
      'Open `lib/response.js` and find `res.clearCookie`',
      'Add a JSDoc block with @param, @returns, and a one-line example',
    ],
    targetFile: 'lib/response.js',
    difficulty: 'Easy',
  },
  {
    id: 'issue-2',
    tag: 'Good First Issue',
    number: '#5601',
    title: 'Fix typo in error message string',
    description: 'The trust proxy validation error in application.js says "invald" instead of "invalid".',
    steps: [
      'Search for "invald" in `lib/application.js` (line ~204)',
      'Fix the typo and add a regression test in `test/app.js`',
    ],
    targetFile: 'lib/application.js',
    difficulty: 'Easy',
  },
  {
    id: 'issue-3',
    tag: 'AI Detected Gap',
    number: undefined,
    title: 'Missing test for Router param() edge case',
    description: 'AI scan found no test coverage for `router.param()` when the callback throws synchronously.',
    steps: [
      'Add a new `it()` block in `test/Router.js` for the sync-throw case',
      'Assert that `next(err)` is called with the thrown error object',
    ],
    targetFile: 'test/Router.js',
    difficulty: 'Medium',
  },
  {
    id: 'issue-4',
    tag: 'Documentation',
    number: '#5589',
    title: 'Document res.locals scoping rules',
    description: '`res.locals` lifetime and isolation between requests is not documented anywhere in the codebase.',
    steps: [
      'Add an inline comment block above `res.locals` in `lib/response.js`',
      'Cross-reference it from the README\'s "Advanced Topics" section',
    ],
    targetFile: 'lib/response.js',
    difficulty: 'Easy',
  },
  {
    id: 'issue-5',
    tag: 'AI Detected Gap',
    number: undefined,
    title: 'Layer.match() has no boundary test',
    description: 'No test exercises the case where path is an empty string, which currently returns a falsy match unexpectedly.',
    steps: [
      'Reproduce: `new Layer("", {}, fn).match("/")` — observe `false`',
      'Add a guard in `lib/router/layer.js` and cover with a unit test',
    ],
    targetFile: 'lib/router/layer.js',
    difficulty: 'Medium',
  },
  {
    id: 'issue-6',
    tag: 'Good First Issue',
    number: '#5571',
    title: 'Improve utils.setCharset() error message',
    description: 'When passed a non-string charset the function silently returns `undefined` instead of throwing a descriptive error.',
    steps: [
      'Add an `typeof` guard at the top of `setCharset` in `lib/utils.js`',
      'Throw a `TypeError` with a descriptive message and update the test',
    ],
    targetFile: 'lib/utils.js',
    difficulty: 'Easy',
  },
]

// ─── AI Q&A ───────────────────────────────────────────────────────────────────

export interface AIAnswer {
  question: string
  answer: string
  fileBadges: { label: string; path: string }[]
}

export const AI_QUICK_PROMPTS = [
  'Where is routing handled?',
  'How do I run tests?',
  'What does req.params contain?',
  'How does res.json() work?',
]

export const AI_ANSWERS: AIAnswer[] = [
  {
    question: 'Where is routing handled?',
    answer: 'Routing is handled by the `Router` class. When you call `app.use()` or `app.get()`, the call is forwarded to an internal `Router` instance living on `app._router`. The Router maintains a stack of `Layer` objects — each holding a compiled path pattern and a handler function. On every incoming request, `Router.handle()` iterates the stack and calls the first matching Layer.',
    fileBadges: [
      { label: 'lib/router/index.js', path: 'lib/router/index.js' },
      { label: 'lib/application.js', path: 'lib/application.js' },
      { label: 'lib/router/layer.js', path: 'lib/router/layer.js' },
    ],
  },
  {
    question: 'How do I run tests?',
    answer: 'After cloning and running `npm install`, execute `npm test` — this runs the full Mocha test suite located in the `test/` directory. Individual files can be run with `npx mocha test/req.js`. Coverage reports can be generated with `npm run test-ci` if configured.',
    fileBadges: [
      { label: 'package.json', path: 'package.json' },
      { label: 'test/app.js', path: 'test/app.js' },
    ],
  },
  {
    question: 'What does req.params contain?',
    answer: '`req.params` is an object populated by `Layer.match()` when a named route parameter (e.g. `:id`) is matched. The Router extracts capture groups from the path-to-regexp result and assigns them by name. The object is attached to `req` before the handler is invoked, so it\'s always ready to read inside any middleware.',
    fileBadges: [
      { label: 'lib/request.js', path: 'lib/request.js' },
      { label: 'lib/router/layer.js', path: 'lib/router/layer.js' },
    ],
  },
  {
    question: 'How does res.json() work?',
    answer: '`res.json()` in `lib/response.js` JSON-serializes its argument via `JSON.stringify`, sets the `Content-Type` header to `application/json`, and delegates to `res.send()`. It respects the `json replacer` and `json spaces` app settings, making pretty-printing configurable globally.',
    fileBadges: [
      { label: 'lib/response.js', path: 'lib/response.js' },
      { label: 'lib/utils.js', path: 'lib/utils.js' },
    ],
  },
]
