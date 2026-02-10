import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticate } from '../src/middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function mockReq(headers = {}) {
  return { headers };
}

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe('Middleware authenticate', () => {
  it('devrait rejeter une requête sans header Authorization', () => {
    const req = mockReq({});
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Token manquant');
    assert.equal(nextCalled, false);
  });

  it('devrait rejeter un header Authorization sans "Bearer"', () => {
    const req = mockReq({ authorization: 'Basic abc123' });
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Token manquant');
    assert.equal(nextCalled, false);
  });

  it('devrait rejeter un token JWT invalide', () => {
    const req = mockReq({ authorization: 'Bearer token.invalide.ici' });
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Token invalide ou expiré');
    assert.equal(nextCalled, false);
  });

  it('devrait accepter un token JWT valide et attacher req.user', () => {
    const payload = { id: 'user123', email: 'alice@campus.fr', role: 'user' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
    assert.equal(req.user.id, 'user123');
    assert.equal(req.user.email, 'alice@campus.fr');
    assert.equal(req.user.role, 'user');
  });

  it('devrait rejeter un token JWT expiré', () => {
    const payload = { id: 'user123', email: 'alice@campus.fr', role: 'user' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Token invalide ou expiré');
    assert.equal(nextCalled, false);
  });
});
