import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
let html = await fs.readFile(path.join(root, 'dist/index.html'), 'utf8')
const script = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/)
const style = html.match(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/)
if (!script || !style) throw new Error('Cannot find built page resources')
const javascript = await fs.readFile(path.join(root, 'dist', script[1].replace(/^\//, '')), 'utf8')
const css = await fs.readFile(path.join(root, 'dist', style[1].replace(/^\//, '')), 'utf8')
html = html.replace(script[0], () => `<script type="module">${javascript.replace(/<\/script/gi, '<\\/script')}</script>`)
html = html.replace(style[0], () => `<style>${css}</style>`)
await fs.writeFile(path.join(root, '打开演示.html'), html)
console.log('Offline demo ready: 打开演示.html')
