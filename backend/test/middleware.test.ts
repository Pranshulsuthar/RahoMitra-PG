import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { requestIdMiddleware } from '../src/middleware/requestId.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { notFoundHandler } from '../src/middleware/notFound.js';
import { AppError } from '../src/utils/errors.js';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  status(code: number): MockResponse;
  setHeader(key: string, val: string): MockResponse;
  json(data: unknown): MockResponse;
}

function createMockResponse(): MockResponse & Response {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(key: string, val: string) {
      this.headers[key.toLowerCase()] = val;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res as unknown as MockResponse & Response;
}

describe('Middleware & Error Handling Unit Tests', () => {
  it('requestIdMiddleware generates a UUID when X-Request-Id is not provided', () => {
    const req = { headers: {} } as Request;
    const res = createMockResponse();
    let nextCalled = false;

    requestIdMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.ok(nextCalled);
    assert.ok(req.id);
    assert.equal(typeof req.id, 'string');
    assert.equal(res.headers['x-request-id'], req.id);
  });

  it('requestIdMiddleware preserves incoming X-Request-Id header', () => {
    const customId = 'incoming-trace-id-12345';
    const req = { headers: { 'x-request-id': customId } } as unknown as Request;
    const res = createMockResponse();
    let nextCalled = false;

    requestIdMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.ok(nextCalled);
    assert.equal(req.id, customId);
    assert.equal(res.headers['x-request-id'], customId);
  });

  it('notFoundHandler returns standard 404 error envelope', () => {
    const req = { method: 'GET', originalUrl: '/api/v1/missing' } as Request;
    const res = createMockResponse();

    notFoundHandler(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Cannot GET /api/v1/missing',
      },
    });
  });

  it('errorHandler formats AppError correctly with status and code', () => {
    const req = { method: 'POST', originalUrl: '/api/v1/test', id: 'req-1' } as Request;
    const res = createMockResponse();
    const appErr = AppError.forbidden('You do not own this PG property', 'OWNER_FORBIDDEN');

    errorHandler(appErr, req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      error: {
        code: 'OWNER_FORBIDDEN',
        message: 'You do not own this PG property',
        details: undefined,
      },
    });
  });

  it('errorHandler catches ZodError and returns 400 VALIDATION_ERROR envelope', () => {
    const req = { method: 'POST', originalUrl: '/api/v1/test', id: 'req-2' } as Request;
    const res = createMockResponse();

    const schema = z.object({ email: z.string().email() });
    const parseResult = schema.safeParse({ email: 'not-an-email' });
    assert.equal(parseResult.success, false);

    if (!parseResult.success) {
      errorHandler(parseResult.error, req, res, () => {});

      assert.equal(res.statusCode, 400);
      const body = res.body as { error: { code: string; message: string; details: unknown[] } };
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.equal(body.error.message, 'Request validation failed');
      assert.ok(Array.isArray(body.error.details));
    }
  });

  it('errorHandler catches SyntaxError for malformed JSON and returns 400 INVALID_JSON_BODY', () => {
    const req = { method: 'POST', originalUrl: '/api/v1/test', id: 'req-3' } as Request;
    const res = createMockResponse();

    const syntaxErr = new SyntaxError('Unexpected token');
    Object.assign(syntaxErr, { status: 400, body: '{ malformed' });

    errorHandler(syntaxErr, req, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      error: {
        code: 'INVALID_JSON_BODY',
        message: 'Malformed JSON payload in request body',
      },
    });
  });

  it('errorHandler catches Prisma unique constraint violation P2002 and returns 409', () => {
    const req = { method: 'POST', originalUrl: '/api/v1/test', id: 'req-4' } as Request;
    const res = createMockResponse();

    const prismaErr = new Error('Unique constraint failed on the fields: (`email`)');
    Object.assign(prismaErr, { code: 'P2002', meta: { target: ['email'] } });

    errorHandler(prismaErr, req, res, () => {});

    assert.equal(res.statusCode, 409);
    const body = res.body as { error: { code: string; message: string } };
    assert.equal(body.error.code, 'UNIQUE_CONSTRAINT_VIOLATION');
  });
});
