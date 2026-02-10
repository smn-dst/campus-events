import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requireAdmin } from '../src/middleware/admin.js';

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

describe('Middleware requireAdmin', () => {
  it('devrait laisser passer un utilisateur admin', () => {
    const req = { user: { id: '1', email: 'admin@campus.fr', role: 'admin' } };
    const res = mockRes();
    let nextCalled = false;
    requireAdmin(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });

  it('devrait bloquer un utilisateur avec le rôle "user"', () => {
    const req = { user: { id: '2', email: 'alice@campus.fr', role: 'user' } };
    const res = mockRes();
    let nextCalled = false;
    requireAdmin(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'Accès réservé aux administrateurs');
  });
});
