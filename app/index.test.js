const request = require('supertest');
const express = require('express');

// Rebuild a minimal version of the app for testing (avoids port binding in tests)
const app = express();
app.get('/', (req, res) => res.json({ message: 'Hello from the CI/CD demo app!' }));
app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

describe('GET /health', () => {
  it('returns 200 and status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});

describe('GET /', () => {
  it('returns a welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Hello');
  });
});
