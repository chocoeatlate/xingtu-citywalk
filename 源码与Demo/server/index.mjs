import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { wgs84ToGcj02 } from './geo.mjs'

try { process.loadEnvFile(path.resolve(import.meta.dirname, '../.env')) } catch { /* no local key */ }

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT || 4174)
const key = process.env.AMAP_WEB_KEY || ''
const cache = new Map()
const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(body))
}

function validPoint(point) {
  return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
    && point[0] >= 31.19 && point[0] <= 31.23 && point[1] >= 121.42 && point[1] <= 121.45
}

async function walk(pair) {
  const id = `${pair.fromId}>${pair.toId}`
  const cacheKey = `${pair.from.join(',')}>${pair.to.join(',')}`
  if (cache.has(cacheKey)) return { id, ...cache.get(cacheKey) }
  const from = wgs84ToGcj02(pair.from)
  const to = wgs84ToGcj02(pair.to)
  const query = new URLSearchParams({ key, origin: `${from[1].toFixed(6)},${from[0].toFixed(6)}`, destination: `${to[1].toFixed(6)},${to[0].toFixed(6)}`, show_fields: 'cost' })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 9000)
  try {
    const response = await fetch(`https://restapi.amap.com/v5/direction/walking?${query}`, { signal: controller.signal })
    const body = await response.json()
    const route = body.route?.paths?.[0]
    const meters = Number(route?.distance)
    const duration = Number(route?.cost?.duration)
    if (!response.ok || body.status !== '1' || !Number.isFinite(meters) || meters < 0 || !Number.isFinite(duration) || duration < 0) return { id, error: 'No walking route' }
    const result = { meters: Math.ceil(meters), minutes: Math.max(1, Math.ceil(duration / 60)) }
    if (cache.size >= 500) cache.delete(cache.keys().next().value)
    cache.set(cacheKey, result)
    return { id, ...result }
  } catch { return { id, error: 'Routing service unavailable' } }
  finally { clearTimeout(timer) }
}

async function handleMatrix(request, response) {
  if (!key) return json(response, 503, { mode: 'estimate', error: 'AMAP_WEB_KEY is not configured' })
  let raw = ''
  for await (const chunk of request) {
    raw += chunk
    if (raw.length > 20000) return json(response, 413, { error: 'Request too large' })
  }
  let pairs
  try { pairs = JSON.parse(raw).pairs } catch { return json(response, 400, { error: 'Invalid JSON' }) }
  if (!Array.isArray(pairs) || pairs.length > 20 || pairs.some((item) => !item || !validPoint(item.from) || !validPoint(item.to) || typeof item.fromId !== 'string' || typeof item.toId !== 'string' || !/^[a-z0-9]{1,32}$/.test(item.fromId) || !/^[a-z0-9]{1,32}$/.test(item.toId))) return json(response, 400, { error: 'Invalid route pairs' })
  const result = []
  for (let index = 0; index < pairs.length; index += 3) result.push(...await Promise.all(pairs.slice(index, index + 3).map(walk)))
  json(response, 200, { mode: 'amap', results: result })
}

const server = http.createServer(async (request, response) => {
  try {
  const url = new URL(request.url || '/', 'http://localhost')
  if (url.pathname === '/api/status') return json(response, 200, { mode: key ? 'amap' : 'estimate' })
  if (url.pathname === '/api/walking' && request.method === 'POST') return await handleMatrix(request, response)
  if (url.pathname.startsWith('/api/')) return json(response, 404, { error: 'Not found' })
  let pathname
  try { pathname = decodeURIComponent(url.pathname) } catch { return json(response, 400, { error: 'Invalid URL' }) }
  if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 405, { error: 'Method not allowed' })
  const requested = path.resolve(dist, `.${pathname}`)
  const safePath = requested.startsWith(dist + path.sep) ? requested : path.join(dist, 'index.html')
  const file = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(dist, 'index.html')
  if (!fs.existsSync(file)) return json(response, 404, { error: 'Run npm run build first' })
  response.writeHead(200, { 'Content-Type': type[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' })
  if (request.method === 'HEAD') return response.end()
  fs.createReadStream(file).on('error', () => response.destroy()).pipe(response)
  } catch {
    if (!response.headersSent) json(response, 500, { error: 'Request failed' })
    else response.destroy()
  }
})

const host = process.env.HOST || '127.0.0.1'
server.listen(port, host, () => console.log(`Xingtu API / preview: http://${host}:${server.address().port}`))
