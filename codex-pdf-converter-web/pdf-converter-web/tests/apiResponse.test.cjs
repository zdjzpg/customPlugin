const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('readApiResponse parses JSON responses', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'apiResponse.mjs')
  ).href;
  const { readApiResponse } = await import(moduleUrl);

  const response = new Response(JSON.stringify({ ok: false, reason: 'X' }), {
    status: 400,
    headers: {
      'content-type': 'application/json'
    }
  });

  const payload = await readApiResponse(response);

  assert.deepEqual(payload, { ok: false, reason: 'X' });
});

test('readApiResponse falls back to text when the server returns non-json content', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'apiResponse.mjs')
  ).href;
  const { readApiResponse } = await import(moduleUrl);

  const response = new Response('<!DOCTYPE html><h1>413</h1>', {
    status: 413,
    headers: {
      'content-type': 'text/html'
    }
  });

  const payload = await readApiResponse(response);

  assert.deepEqual(payload, {
    ok: false,
    message: '<!DOCTYPE html><h1>413</h1>'
  });
});
