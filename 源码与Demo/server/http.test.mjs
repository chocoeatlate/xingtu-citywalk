import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

let child, base
before(async () => {
  child = spawn(process.execPath, ['server/index.mjs'], { cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '0', HOST: '127.0.0.1', AMAP_WEB_KEY: 'test-placeholder' }, stdio: ['ignore', 'pipe', 'pipe'] })
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 5000)
    child.on('error', (error) => { clearTimeout(timer); reject(error) })
    child.stdout.on('data', (chunk) => {
      const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/)
      if (match) { clearTimeout(timer); resolve(match[0]) }
    })
  })
})
after(async () => { if (child && child.exitCode === null) { const stopped = once(child, 'exit'); child.kill(); await stopped } })
const post = (body) => fetch(base + '/api/walking', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } })

test('malformed URL returns 400 and server remains available', async () => {
  assert.equal((await fetch(base + '/%FF')).status, 400)
  assert.equal((await fetch(base + '/api/status')).status, 200)
})
test('null route entries return 400 rather than terminating the process', async () => {
  assert.equal((await post(JSON.stringify({ pairs: [null] }))).status, 400)
  assert.equal((await fetch(base + '/api/status')).status, 200)
})
test('invalid JSON and out-of-pilot coordinates are rejected before upstream calls', async () => {
  assert.equal((await post('{')).status, 400)
  assert.equal((await post(JSON.stringify({ pairs: [{ fromId: 'a', toId: 'b', from: [0, 0], to: [0, 0] }] }))).status, 400)
})
test('request body and route count limits are enforced', async () => {
  assert.equal((await post('x'.repeat(21000))).status, 413)
  assert.equal((await post(JSON.stringify({ pairs: Array(21).fill(null) }))).status, 400)
})
test('status does not expose configured secrets and unknown endpoints are 404', async () => {
  const response = await fetch(base + '/api/status')
  assert.deepEqual(await response.json(), { mode: 'amap' })
  assert.equal((await fetch(base + '/api/missing')).status, 404)
})
