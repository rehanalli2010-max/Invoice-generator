const request = require('supertest');
const app = require('../app');

let authToken;
let userId;
let csrfToken;

async function fetchCsrfToken(token) {
  const res = await request(app)
    .get('/api/auth/csrf-token')
    .set('Authorization', `Bearer ${token}`);
  if (res.status === 200) {
    csrfToken = res.body.csrfToken;
  }
}

function authSet() {
  let obj = { 'Authorization': `Bearer ${authToken}` };
  if (csrfToken) {
    obj['X-CSRF-Token'] = csrfToken;
  }
  return obj;
}

describe('Auth API', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'password123';

  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.tier).toBe('free');

      authToken = res.body.accessToken;
      userId = res.body.user.id;
      await fetchCsrfToken(authToken);
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(409);
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'x@x.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      authToken = res.body.accessToken;
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('rejects nonexistent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'x' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(userId);
      expect(res.body.user.email).toBe(testEmail);
    });

    it('rejects without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });
});

describe('Invoices API', () => {
  let invoiceId;

  describe('POST /api/invoices', () => {
    it('creates an invoice', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set(authSet())
        .send({
          data: {
            invoiceNumber: 'INV-TST-001',
            clientName: 'Test Client',
            total: 500,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.data.invoiceNumber).toBe('INV-TST-001');
      invoiceId = res.body.id;
    });

    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({ data: { invoiceNumber: 'INV-002' } });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/invoices', () => {
    it('lists invoices for the user', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.invoices.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/invoices/count', () => {
    it('returns usage count', async () => {
      const res = await request(app)
        .get('/api/invoices/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.used).toBeGreaterThanOrEqual(1);
      expect(res.body.tier).toBe('free');
    });
  });

  describe('DELETE /api/invoices/:id', () => {
    it('deletes an invoice', async () => {
      await fetchCsrfToken(authToken);
      const res = await request(app)
        .delete(`/api/invoices/${invoiceId}`)
        .set(authSet());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for nonexistent invoice', async () => {
      await fetchCsrfToken(authToken);
      const res = await request(app)
        .delete('/api/invoices/nonexistent-id')
        .set(authSet());

      expect(res.status).toBe(404);
    });
  });
});

describe('Clients API', () => {
  let clientId;

  describe('POST /api/clients', () => {
    it('creates a client', async () => {
      await fetchCsrfToken(authToken);
      const res = await request(app)
        .post('/api/clients')
        .set(authSet())
        .send({
          name: 'New Client',
          email: 'client@test.com',
          phone: '555-0100',
          address: '123 Test St',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      clientId = res.body.id;
    });

    it('updates existing client by name', async () => {
      await fetchCsrfToken(authToken);
      const res = await request(app)
        .post('/api/clients')
        .set(authSet())
        .send({ name: 'New Client', email: 'updated@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
    });

    it('rejects client without name', async () => {
      await fetchCsrfToken(authToken);
      const res = await request(app)
        .post('/api/clients')
        .set(authSet())
        .send({ email: 'noname@test.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/clients', () => {
    it('lists clients', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.clients.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('deletes a client', async () => {
      await fetchCsrfToken(authToken);
      const res = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set(authSet());

      expect(res.status).toBe(200);
    });
  });
});

describe('Subscription API', () => {
  describe('POST /api/subscription/checkout', () => {
    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/subscription/checkout')
        .send({ tier: 'pro', interval: 'monthly' });

      expect(res.status).toBe(401);
    });

    it('rejects invalid tier', async () => {
      await fetchCsrfToken(authToken);
      const res = await request(app)
        .post('/api/subscription/checkout')
        .set(authSet())
        .send({ tier: 'enterprise' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/subscription/portal', () => {
    it('rejects without auth', async () => {
      const res = await request(app)
        .post('/api/subscription/portal');

      expect(res.status).toBe(401);
    });
  });
});

describe('Health & Config', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/config returns ad config', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.googleAdSense).toBeDefined();
  });
});
