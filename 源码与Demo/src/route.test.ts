import { describe, expect, it } from 'vitest'
import { byId } from './data'
import { estimatedWalk, initialPreference, planPreview, suggestNext, updatePreference } from './route'

describe('route feasibility', () => {
  it('never proposes a node without enough time to visit and reach the finish', () => {
    const suggestions = suggestNext({ currentId: 'mansion', visited: ['mansion'], unavailable: [], remainingMinutes: 10, preference: initialPreference('architecture'), finishId: 'mansion' })
    for (const suggestion of suggestions) expect(suggestion.totalMinutes).toBeLessThanOrEqual(10)
  })

  it('excludes visited and reported unavailable places', () => {
    const suggestions = suggestNext({ currentId: 'mansion', visited: ['mansion', 'info'], unavailable: ['villa390'], remainingMinutes: 90, preference: initialPreference('architecture'), finishId: 'anfu' })
    expect(suggestions.map((item) => item.place.id)).not.toContain('info')
    expect(suggestions.map((item) => item.place.id)).not.toContain('villa390')
  })

  it('responds to a changed interest', () => {
    const base = initialPreference('architecture')
    const after = updatePreference(updatePreference(base, 'life'), 'life')
    const input = { currentId: 'mansion', visited: ['mansion'], unavailable: [], remainingMinutes: 90, finishId: 'anfu' }
    const architecture = suggestNext({ ...input, preference: base })
    const life = suggestNext({ ...input, preference: after })
    expect(architecture[0].place.id).not.toEqual(life[0].place.id)
  })

  it('shows a short route only within the remaining budget', () => {
    const route = planPreview({ currentId: 'mansion', visited: ['mansion'], unavailable: [], remainingMinutes: 45, preference: initialPreference('stories'), finishId: 'anfu' })
    expect(route.length).toBeGreaterThan(0)
    expect(new Set(route.map((item) => item.place.id)).size).toBe(route.length)
  })

  it('uses zero time for staying at a place', () => {
    expect(estimatedWalk(byId.mansion, byId.mansion)).toEqual({ meters: 0, minutes: 0 })
  })

  it('uses a verified routing matrix when available', () => {
    const options = suggestNext({
      currentId: 'mansion', visited: ['mansion'], unavailable: [], remainingMinutes: 15,
      preference: initialPreference('architecture'), finishId: 'mansion',
      matrix: { 'mansion>info': { meters: 180, minutes: 2 }, 'info>mansion': { meters: 200, minutes: 3 } },
    })
    const info = options.find((item) => item.place.id === 'info')
    expect(info).toMatchObject({ walkMeters: 180, walkMinutes: 2, totalMinutes: 14 })
  })
})


describe('whole-walk limits', () => {
  it('deducts each leg from the preview walking budget and reserves the finish', () => {
    const input = { currentId: 'mansion', visited: ['mansion'], unavailable: [], remainingMinutes: 90, preference: initialPreference('architecture'), finishId: 'anfu', maxWalkMeters: 1500 }
    const route = planPreview(input, 8)
    expect(route.length).toBeGreaterThan(0)
    const last = route.at(-1)!
    const totalMeters = route.reduce((sum, next) => sum + next.walkMeters, 0) + estimatedWalk(last.place, byId.anfu).meters
    expect(totalMeters).toBeLessThanOrEqual(1500)
    const totalMinutes = route.reduce((sum, next) => sum + next.walkMinutes + next.place.dwell, 0) + estimatedWalk(last.place, byId.anfu).minutes + 5
    expect(totalMinutes).toBeLessThanOrEqual(90)
  })
  it('does not redirect a street-life visitor to unrelated architecture-only places', () => {
    const options = suggestNext({ currentId: 'mansion', visited: [], unavailable: [], remainingMinutes: 90, preference: initialPreference('life'), finishId: 'anfu' })
    expect(options.length).toBeGreaterThan(0)
    expect(options.every((option) => option.place.interests.includes('life'))).toBe(true)
  })
  it('returns no options when walking budget is exhausted', () => {
    expect(suggestNext({ currentId: 'mansion', visited: [], unavailable: [], remainingMinutes: 90, preference: initialPreference('architecture'), finishId: 'anfu', maxWalkMeters: 0 })).toEqual([])
  })
  it('rejects corrupt routing costs rather than bypassing time constraints', () => {
    const options = suggestNext({ currentId: 'mansion', visited: [], unavailable: [], remainingMinutes: 1, preference: initialPreference('architecture'), finishId: 'mansion', matrix: { 'mansion>info': { meters: -100, minutes: -100 } } })
    expect(options).toEqual([])
  })
})
