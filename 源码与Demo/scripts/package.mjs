import fs from 'node:fs/promises'
import path from 'node:path'
import { deflateRawSync } from 'node:zlib'
import { createHash } from 'node:crypto'

const root = path.resolve(import.meta.dirname, '../..')
const entries = []
async function collect(relative) {
  const file = path.join(root, relative)
  let stat
  try { stat = await fs.stat(file) } catch (error) {
    if (relative === '源码与Demo/public' && error.code === 'ENOENT') return
    throw error
  }
  if (stat.isDirectory()) {
    for (const name of (await fs.readdir(file)).sort()) await collect(`${relative}/${name}`)
  } else entries.push({ name: relative, data: await fs.readFile(file) })
}
// Explicit allowlist keeps local secrets, dependencies and build caches out of the delivery.
for (const item of ['src', 'server', 'scripts', 'public', 'dist', '打开演示.html', '启动网页.cmd', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', '.env.example', '.gitignore']) await collect(`源码与Demo/${item}`)
await collect('参赛材料')

const table = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1
  return n >>> 0
})
function crc32(data) {
  let crc = 0xffffffff
  for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
const local = [], central = []
let offset = 0
for (const entry of entries) {
  const name = Buffer.from(entry.name, 'utf8')
  const compressed = deflateRawSync(entry.data)
  const crc = crc32(entry.data)
  const header = Buffer.alloc(30)
  header.writeUInt32LE(0x04034b50, 0)
  header.writeUInt16LE(20, 4)
  header.writeUInt16LE(0x800, 6)
  header.writeUInt16LE(8, 8)
  header.writeUInt16LE(33, 12)
  header.writeUInt32LE(crc, 14)
  header.writeUInt32LE(compressed.length, 18)
  header.writeUInt32LE(entry.data.length, 22)
  header.writeUInt16LE(name.length, 26)
  const index = Buffer.alloc(46)
  index.writeUInt32LE(0x02014b50, 0)
  index.writeUInt16LE(20, 4)
  header.copy(index, 6, 4, 30)
  index.writeUInt32LE(offset, 42)
  local.push(header, name, compressed)
  central.push(index, name)
  offset += header.length + name.length + compressed.length
}
const directory = Buffer.concat(central)
const end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0)
end.writeUInt16LE(entries.length, 8)
end.writeUInt16LE(entries.length, 10)
end.writeUInt32LE(directory.length, 12)
end.writeUInt32LE(offset, 16)
const output = Buffer.concat([...local, directory, end])
const destination = path.join(root, '星途智旅_参赛作品源码与材料.zip')
await fs.writeFile(destination, output)
console.log(`Packaged ${entries.length} files: ${destination}`)
console.log(`SHA256: ${createHash('sha256').update(output).digest('hex')}`)
