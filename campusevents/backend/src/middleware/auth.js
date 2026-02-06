// ═══════════════════════════════════════════════
// Middleware Auth — Vérifie le token JWT
//
// Utilisation dans une route :
//   import { authenticate } from '../middleware/auth.js';
//   router.get('/protected', authenticate, (req, res) => {
//     console.log(req.user); // { id, email, role }
//   });
// ═══════════════════════════════════════════════

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function authenticate(req, res, next) {
  // 1. Récupérer le header Authorization
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  // 2. Extraire le token (enlever "Bearer ")
  const token = header.split(' ')[1];

  try {
    // 3. Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Attacher les infos user à la requête
    // Toutes les routes suivantes auront accès à req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
