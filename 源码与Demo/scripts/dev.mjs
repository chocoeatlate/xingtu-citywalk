import { spawn } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
try { process.loadEnvFile(path.join(root, '.env')) } catch { /* Optional local configuration. */ }
const api = spawn(process.execPath, ['server/index.mjs'], { cwd: root, stdio: 'inherit' })
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', process.env.HOST || '127.0.0.1', '--strictPort'], { cwd: root, stdio: 'inherit' })

function stop() {
  if (!api.killed) api.kill()
  if (!web.killed) web.kill()
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
api.on('exit', (code) => { if (code && !web.killed) { stop(); process.exitCode = code } })
web.on('exit', (code) => { if (code && !api.killed) { stop(); process.exitCode = code } })
