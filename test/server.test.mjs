import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

test('dev server returns 404 for a missing file and keeps running', async () => {
  const port = 3900 + Math.floor(Math.random() * 90);
  const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port) } });
  try {
    await new Promise((resolve, reject) => {
      srv.stdout.on('data', (d) => String(d).includes('running') && resolve());
      srv.on('exit', (code) => reject(new Error(`server exited ${code}`)));
    });
    const base = `http://localhost:${port}`;
    assert.equal((await fetch(`${base}/data/products.json`)).status, 404);
    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /text\/html/);
  } finally {
    srv.kill();
  }
});
