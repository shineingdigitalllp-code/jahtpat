import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { app } from '../src/app.js';

interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

function invokeApp(
  method: string,
  url: string,
  options: { headers?: Record<string, string>; body?: any; cookies?: Record<string, string> } = {},
): Promise<MockResponse> {
  return new Promise((resolve) => {
    const req = new EventEmitter() as any;
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.baseUrl = '';
    req.path = url.split('?')[0];
    req.headers = {
      host: 'localhost',
      'content-type': 'application/json',
      ...(options.headers || {}),
    };
    req.cookies = options.cookies || {};
    req.body = options.body;
    req.query = {};
    req.socket = { remoteAddress: '127.0.0.1' };
    req.ip = '127.0.0.1';

    let statusCode = 200;
    const resHeaders: Record<string, string> = {};
    let resBody: any = null;

    const res = new EventEmitter() as any;
    res.statusCode = 200;
    res.status = (code: number) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    };
    res.setHeader = (key: string, value: string) => {
      resHeaders[key.toLowerCase()] = value;
      return res;
    };
    res.removeHeader = (key: string) => {
      delete resHeaders[key.toLowerCase()];
      return res;
    };
    res.getHeader = (key: string) => resHeaders[key.toLowerCase()];
    res.json = (data: any) => {
      resBody = data;
      resolve({ status: statusCode, headers: resHeaders, body: resBody });
      return res;
    };
    res.send = (data: any) => {
      resBody = data;
      resolve({ status: statusCode, headers: resHeaders, body: resBody });
      return res;
    };
    res.end = () => {
      resolve({ status: statusCode, headers: resHeaders, body: resBody });
      return res;
    };

    app.handle(req, res);
  });
}

describe('HTTP API Endpoints & Envelope Handling', () => {
  it('returns structured 404 envelope for non-existent routes', async () => {
    const res = await invokeApp('GET', '/api/v1/non-existent-route');
    assert.equal(res.status, 404);
    assert.equal(res.body?.error?.code, 'NOT_FOUND');
    assert.equal(res.body?.error?.message, 'Route not found');
  });

  it('returns 422 validation error envelope when admin login payload is missing email', async () => {
    const res = await invokeApp('POST', '/api/v1/admin/auth/login', {
      headers: {
        origin: 'http://localhost:3001',
      },
      body: { password: 'SomePassword123' },
    });

    assert.equal(res.status, 422);
    assert.ok(res.body?.error);
  });

  it('blocks state-changing admin requests from untrusted foreign origins with 403', async () => {
    const res = await invokeApp('POST', '/api/v1/admin/auth/login', {
      headers: {
        origin: 'https://malicious-external-site.com',
      },
      body: { email: 'admin@jhatpat.com', password: 'Password123!' },
    });

    assert.equal(res.status, 403);
    assert.equal(res.body?.error?.code, 'FORBIDDEN');
  });
});
