# RepoPrism ✦

> **Understand any codebase. Make your first contribution.**  
> An AI-powered GitHub repository explainer built for beginner contributors, featuring a pure monochrome glassmorphic developer dashboard.

---

## ✦ Key Features

- **Personalized Architecture Overview**: Instant AI-crafted title and plain-English 2-line summary explaining the codebase mental model.
- **Dynamic System Canvas**: Interactive architecture node diagram personalized for each unique repository (FastAPI, Flutter, Express, React, etc.) with clean dataflow edges.
- **Modular Context Cards**:
  - `01 / ENTRYPOINT`: Where execution begins, bootstrap lifecycle, and entry files.
  - `02 / CORE ENGINE`: Primary subsystems, request/state pipelines, and engine files.
  - `03 / DATA & LIFECYCLE`: Data mutations, persistence models, and schemas.
  - `04 / LOCAL SETUP`: Minimal terminal commands and prerequisites to build & test locally.
- **Live AI Code Navigator**: Interactive chat box powered by Gemini with repository context and clickable file badges.
- **Curated First Issues**: Live open GitHub issues combined with AI-detected codebase gaps (missing tests, typed interfaces, documentation).
- **Interactive File Explorer**: Full directory tree navigation with file badges and line counts.

---

## ✦ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide React
- **Design System**: Ultra-minimalist pure monochrome glassmorphism (`#000000`, `#050505`, `#ffffff`, neutral zinc)
- **Backend**: Node.js, Express, TypeScript, `@google/genai` (Gemini SDK), `@octokit/rest` (GitHub REST API v3)
- **Deployment**: Vercel Serverless Functions (`/api/analyze`, `/api/chat`, `/api/health`) + Vite SPA static hosting

---

## ✦ Local Development

### Prerequisites
- Node.js 18+ (tested on Node 22+)
- A GitHub Personal Access Token (optional, increases rate limit to 5,000 req/hr)
- A Google Gemini API Key

### 1. Clone & Install
```bash
git clone https://github.com/sidhant21/RepoPrism.git
cd RepoPrism

# Install dependencies
npm install
cd repoprism-app && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Configure Environment
Create `server/.env`:
```env
PORT=3001
GITHUB_TOKEN=your_github_personal_access_token
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Locally
Run both backend and frontend:
```bash
# Terminal 1: Backend Server (port 3001)
npm run dev:backend

# Terminal 2: Frontend Vite App (port 5173 or 5174)
npm run dev:frontend
```

Open `http://localhost:5174` in your browser.

---

## ✦ Vercel Deployment

RepoPrism includes full Vercel serverless configuration out-of-the-box (`vercel.json` and `api/`).

1. Push your repository to GitHub.
2. Import the project on [Vercel](https://vercel.com/new).
3. Set Environment Variables in Vercel Project Settings:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
4. Deploy! Vercel automatically builds the frontend and provisions the serverless `/api` endpoints.

---

## ✦ License

MIT © [sidhant21](https://github.com/sidhant21)
