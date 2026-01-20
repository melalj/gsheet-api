import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import type { Server } from 'http';
import app from '../src/api/index.js';

let server: Server;
const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

beforeAll(() => {
  return new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      resolve();
    });
  });
});

afterAll(() => {
  return new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

describe('API Health Endpoints', () => {
  test('GET /health returns ok', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('ok');
  });

  test('GET /~health returns ok', async () => {
    const response = await fetch(`${BASE_URL}/~health`);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('ok');
  });
});

describe('API Not Found', () => {
  test('GET path with special characters returns 404', async () => {
    // Paths with special characters that don't match the route patterns
    const response = await fetch(`${BASE_URL}/@invalid`);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: 'Not found' });
  });

  test('GET path with spaces returns 404', async () => {
    const response = await fetch(`${BASE_URL}/invalid%20path`);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: 'Not found' });
  });
});

describe('API Trailing Slash Redirect', () => {
  test('handles trailing slash on paths', async () => {
    // Test that paths with trailing slashes are handled correctly
    // The middleware should redirect or the route should still work
    const response = await fetch(`${BASE_URL}/~health/`);
    // Either redirected and followed (200) or direct response
    expect([200, 301]).toContain(response.status);
  });
});

describe('API Authentication', () => {
  test('allows requests without PRIVATE_API_KEY when not set', async () => {
    // The server was started without PRIVATE_API_KEY set
    const response = await fetch(`${BASE_URL}/health`);
    expect(response.status).toBe(200);
  });
});

describe('Express App Configuration', () => {
  test('returns JSON with correct content-type', async () => {
    const response = await fetch(`${BASE_URL}/@invalid`);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  test('does not expose x-powered-by header', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    expect(response.headers.get('x-powered-by')).toBeNull();
  });
});
