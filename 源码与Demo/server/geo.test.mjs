import assert from 'node:assert/strict'
import test from 'node:test'
import { wgs84ToGcj02 } from './geo.mjs'

test('converts the published Wukang Mansion WGS84 point to the expected Shanghai map area', () => {
  const [latitude, longitude] = wgs84ToGcj02([31.20627, 121.4337])
  assert.ok(Math.abs(latitude - 31.2044) < 0.0002)
  assert.ok(Math.abs(longitude - 121.4383) < 0.0002)
})

test('leaves points outside the GCJ-02 mainland conversion region unchanged', () => {
  assert.deepEqual(wgs84ToGcj02([48.8584, 2.2945]), [48.8584, 2.2945])
})
