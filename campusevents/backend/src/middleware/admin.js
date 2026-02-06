// ═══════════════════════════════════════════════
// Middleware Admin — Vérifie le rôle admin
//
// IMPORTANT : doit être utilisé APRÈS authenticate
//   router.post('/events', authenticate, requireAdmin, handler);
//
// authenticate met req.user, puis requireAdmin vérifie le rôle.
// ═══════════════════════════════════════════════

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
}
