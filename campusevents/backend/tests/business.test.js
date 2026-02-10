import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

describe('Hashage de mot de passe (bcrypt)', () => {
  it('devrait hasher un mot de passe et le vérifier correctement', async () => {
    const password = 'monSuperMotDePasse123';
    const hash = await bcrypt.hash(password, 10);
    assert.notEqual(hash, password);
    const isValid = await bcrypt.compare(password, hash);
    assert.equal(isValid, true);
  });

  it('devrait rejeter un mauvais mot de passe', async () => {
    const hash = await bcrypt.hash('correct', 10);
    const isValid = await bcrypt.compare('incorrect', hash);
    assert.equal(isValid, false);
  });
});

describe('Génération et vérification JWT', () => {
  it('devrait générer un token contenant les données utilisateur', () => {
    const user = { id: 'abc123', email: 'alice@campus.fr', role: 'user' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 0);
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.equal(decoded.id, 'abc123');
    assert.equal(decoded.email, 'alice@campus.fr');
    assert.equal(decoded.role, 'user');
  });

  it('devrait rejeter un token signé avec un mauvais secret', () => {
    const token = jwt.sign({ id: '1' }, 'mauvais-secret');
    assert.throws(() => {
      jwt.verify(token, JWT_SECRET);
    }, { name: 'JsonWebTokenError' });
  });

  it('devrait distinguer les rôles admin et user dans le token', () => {
    const adminToken = jwt.sign({ id: '1', role: 'admin' }, JWT_SECRET);
    const userToken = jwt.sign({ id: '2', role: 'user' }, JWT_SECRET);
    const adminDecoded = jwt.verify(adminToken, JWT_SECRET);
    const userDecoded = jwt.verify(userToken, JWT_SECRET);
    assert.equal(adminDecoded.role, 'admin');
    assert.equal(userDecoded.role, 'user');
    assert.notEqual(adminDecoded.role, userDecoded.role);
  });
});
