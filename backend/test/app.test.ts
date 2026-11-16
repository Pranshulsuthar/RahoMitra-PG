import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

describe('Application Factory', () => {
  it('createApp successfully initializes Express application instance', () => {
    const app = createApp();
    assert.ok(app);
    assert.equal(typeof app.listen, 'function');
    assert.equal(typeof app.use, 'function');
    assert.equal(typeof app.get, 'function');
  });
});
