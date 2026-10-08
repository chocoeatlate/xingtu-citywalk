import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const root = path.resolve(import.meta.dirname, '..')
const html = await fs.readFile(path.join(root, '打开演示.html'), 'utf8')
assert.ok(!/<script\b[^>]*\bsrc=/.test(html), 'Offline page must not need an external script')
assert.ok(!/<link\b[^>]*\brel="stylesheet"/.test(html), 'Offline page must inline its styles')
const javascript = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1]
assert.ok(javascript)
const dom = new JSDOM(html.replace(/<script[\s\S]*?<\/script>/, ''), { url: 'file:///Startrail/打开演示.html', runScripts: 'outside-only', pretendToBeVisual: true })
dom.window.scrollTo = () => {}
dom.window.eval(javascript)
const tick = () => new Promise((resolve) => setTimeout(resolve, 80))
await tick()
function click(label) {
  const button = [...dom.window.document.querySelectorAll('button')].find((node) => node.textContent.trim() === label || node.getAttribute('aria-label') === label)
  assert.ok(button, `Button unavailable: ${label}`)
  button.click()
}
click('开启街区探索'); await tick()
assert.match(dom.window.document.body.textContent, /记下一个看到的细节/)
click('暂时跳过'); await tick()
assert.match(dom.window.document.body.textContent, /接下来去哪里/)
click('前往武康路旅游咨询中心'); await tick()
assert.match(dom.window.document.querySelector('.task-content h2').textContent, /旅游咨询中心/)
click('暂时跳过'); await tick()
click('结束本次探索'); await tick()
assert.ok(dom.window.document.querySelector('.summary-page'))
click('重新探索'); await tick()
assert.ok(dom.window.document.querySelector('.setup-page'))
dom.window.close()
console.log('Offline inline bundle passes file-origin DOM smoke test: start, skip, arrive, recap, reset.')
