// ═══════════════════════════════════════════════
// CampusEvents — Backend Express
// Point d'entrée principal
// ═══════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Routes
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globaux ──────────────────────
app.use(cors());                    // Autorise les requêtes cross-origin (frontend → backend)
app.use(express.json());            // Parse le body JSON des requêtes
app.use(morgan('[:date[iso]] :method :url :status :response-time ms'));  // Logs HTTP lisibles

// ── Healthcheck ─────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes API ──────────────────────────────
// #region agent log
const mountPayload = { location: 'index.js:mount', message: 'mounting events and auth routes', data: { eventsMount: '/api/events', authMount: '/api/auth' }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H2' };
fetch('http://127.0.0.1:7242/ingest/83b86bb7-af3e-4e95-ac3f-07136a90e463',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(mountPayload)}).catch(()=>{});
console.log('[DEBUG]', JSON.stringify(mountPayload));
// #endregion
app.use('/api/events', eventsRoutes);
app.use('/api/auth', authRoutes);

// ── 404 — Route non trouvée ─────────────────
app.use((req, res) => {
  // #region agent log
  const payload = { location: 'index.js:404', message: '404 handler hit', data: { method: req.method, path: req.path, originalUrl: req.originalUrl, baseUrl: req.baseUrl }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1' };
  fetch('http://127.0.0.1:7242/ingest/83b86bb7-af3e-4e95-ac3f-07136a90e463',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
  console.log('[DEBUG]', JSON.stringify(payload));
  // #endregion
  res.status(404).json({ error: `Route ${req.method} ${req.path} non trouvée` });
});

// ── Gestion d'erreurs globale ───────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ── Démarrage ───────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Auth:    http://localhost:${PORT}/api/auth`);
});
