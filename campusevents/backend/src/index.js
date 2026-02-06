// ═══════════════════════════════════════════════
// CampusEvents — Backend Express
// Point d'entrée principal
// ═══════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './lib/swagger.js';

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

// ── Documentation Swagger ───────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'CampusEvents API',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Endpoint JSON brut de la spec (utile pour Postman/Insomnia)
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// ── Routes API ──────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);

// ── 404 — Route non trouvée ─────────────────
app.use((req, res) => {
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
  console.log(`   Swagger: http://localhost:${PORT}/api/docs`);
});
