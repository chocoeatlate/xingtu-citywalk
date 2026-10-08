import { describe, it, expect } from 'vitest'
import { formatRecord } from './record'

describe('portable discovery record', () => {
  const session = { lang: 'en' as const, demoMode: true, visited: ['mansion'], spentMinutes: 5, travelMeters: 0, answers: [{ placeId: 'mansion', interest: 'architecture' as const, label: '转角的建筑轮廓', note: 'A rounded balcony at the corner.' }] }
  it('preserves personal observations, translates choices and includes sources and demo status', () => {
    const output = formatRecord(session)
    expect(output).toContain('Demo scenario')
    expect(output).toContain('The corner silhouette')
    expect(output).toContain('A rounded balcony at the corner.')
    expect(output).toContain('https://english.shanghai.gov.cn/')
    expect(output).toContain('Estimated time: 5 min')
  })
  it('handles an empty visit history without inventing discoveries', () => {
    expect(formatRecord({ ...session, demoMode: false, visited: [], answers: [] })).toContain('No places recorded yet.')
  })
})
