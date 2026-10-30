import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyze.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration to support Vite frontend dev servers and standard localhost ports
app.use(
  cors({
    origin: [
      'http://localhost:5174',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Mount routes
app.use(analyzeRouter);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                      RepoPrism Backend Engine                             ║
║                                                                           ║
║  • Server listening on:  http://localhost:${PORT}                           ║
║  • Health check:        http://localhost:${PORT}/api/health                 ║
║  • Analyze endpoint:    POST http://localhost:${PORT}/api/analyze           ║
║  • Gemini 2.5 Flash:    ${process.env.GEMINI_API_KEY ? 'Configured (Active)' : 'Unset (Using high-fidelity synthesizer)'} ║
║  • GitHub Token:        ${process.env.GITHUB_TOKEN ? 'Configured (5k req/hr)' : 'Unset (Public tier: 60 req/hr)'}    ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
