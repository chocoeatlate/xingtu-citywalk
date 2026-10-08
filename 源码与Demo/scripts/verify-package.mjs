import fs from 'node:fs/promises'
import path from 'node:path'
import { inflateRawSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const root = path.resolve(import.meta.dirname, '../..')
export async function verifyPackage(filename = path.join(root, '星途智旅_参赛作品源码与材料.zip')) {
  const bytes = await fs.readFile(filename)
  const end = bytes.length - 22
  if (bytes.readUInt32LE(end) !== 0x06054b50) throw new Error('Invalid ZIP footer')
  const count = bytes.readUInt16LE(end + 10)
  let cursor = bytes.readUInt32LE(end + 16)
  const names = []
  for (let index = 0; index < count; index++) {
    if (bytes.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid directory entry')
    const nameSize = bytes.readUInt16LE(cursor + 28)
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameSize).toString('utf8')
    if (name.startsWith('/') || name.split('/').includes('..') || /(^|\/)(\.env|node_modules|\.deck-build|\.verification)(\/|$)/.test(name)) throw new Error(`Forbidden entry: ${name}`)
    const offset = bytes.readUInt32LE(cursor + 42)
    const start = offset + 30 + bytes.readUInt16LE(offset + 26) + bytes.readUInt16LE(offset + 28)
    const data = inflateRawSync(bytes.subarray(start, start + bytes.readUInt32LE(cursor + 20)))
    const local = await fs.readFile(path.join(root, name))
    if (!data.equals(local)) throw new Error(`Packaged file differs from source: ${name}`)
    names.push(name)
    cursor += 46 + nameSize + bytes.readUInt16LE(cursor + 30) + bytes.readUInt16LE(cursor + 32)
  }
  for (const required of ['源码与Demo/打开演示.html', '源码与Demo/package-lock.json', '源码与Demo/src/App.tsx', '源码与Demo/dist/index.html', '参赛材料/星途智旅_答辩演示.pptx', '参赛材料/项目完整说明.md']) {
    if (!names.includes(required)) throw new Error(`Missing delivery file: ${required}`)
  }
  console.log(`Verified ${count} files: no secrets or private build caches; all entries match source.`)
  return names
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await verifyPackage()
