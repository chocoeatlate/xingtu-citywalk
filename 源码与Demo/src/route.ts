import { byId, places, type Interest, type Place } from './data'

export type Preference = Record<Interest, number>
export type WalkCost = { meters: number; minutes: number }
export type WalkMatrix = Record<string, WalkCost>
export const initialPreference = (interest: Interest): Preference => ({
  architecture: interest === 'architecture' ? 3 : 0,
  stories: interest === 'stories' ? 3 : 0,
  life: interest === 'life' ? 3 : 0,
})

export function updatePreference(preference: Preference, interest: Interest): Preference {
  return { ...preference, [interest]: Math.min(12, preference[interest] + 4) }
}

export function straightDistanceMeters(a: Place, b: Place): number {
  const [lat1, lon1] = a.coordinate
  const [lat2, lon2] = b.coordinate
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

// The keyless demo uses a deliberately conservative estimate. It is not a walking route.
export function estimatedWalk(a: Place, b: Place) {
  if (a.id === b.id) return { meters: 0, minutes: 0 }
  const meters = Math.max(100, Math.ceil(straightDistanceMeters(a, b) * 1.65 / 10) * 10)
  return { meters, minutes: Math.max(2, Math.ceil(meters / 65)) }
}

export const pairId = (fromId: string, toId: string) => `${fromId}>${toId}`

export function walkCost(a: Place, b: Place, matrix?: WalkMatrix): WalkCost {
  if (a.id === b.id) return { meters: 0, minutes: 0 }
  const cost = matrix?.[pairId(a.id, b.id)]
  return cost && Number.isFinite(cost.meters) && cost.meters >= 0 && Number.isFinite(cost.minutes) && cost.minutes >= 0 ? cost : estimatedWalk(a, b)
}

export interface Suggestion {
  place: Place
  walkMinutes: number
  walkMeters: number
  totalMinutes: number
  score: number
  reasonInterest: Interest
}

export interface PlanInput {
  currentId: string
  visited: string[]
  unavailable: string[]
  remainingMinutes: number
  preference: Preference
  finishId: string
  maxWalkMeters?: number
  matrix?: WalkMatrix
}

function bestInterest(place: Place, preference: Preference): Interest {
  return [...place.interests].sort((a, b) => preference[b] - preference[a])[0]
}

function scorePlace(place: Place, preference: Preference, walkMinutes: number): number {
  const interest = Math.max(...place.interests.map((tag) => preference[tag]))
  const secondary = place.interests.reduce((sum, tag) => sum + preference[tag], 0)
  return interest * 12 + secondary * 2 - walkMinutes * 1.4 + (place.id === 'anfu' ? 0 : 1)
}

export function suggestNext(input: PlanInput): Suggestion[] {
  const current = byId[input.currentId]
  const finish = byId[input.finishId]
  if (!current || !finish || input.remainingMinutes <= 0) return []
  const excluded = new Set([...input.visited, ...input.unavailable])
  return places.flatMap((place) => {
    if (excluded.has(place.id) || place.id === current.id) return []
    if (!place.interests.some((interest) => input.preference[interest] > 0)) return []
    const walk = walkCost(current, place, input.matrix)
    const endWalk = walkCost(place, finish, input.matrix)
    const totalMinutes = walk.minutes + place.dwell + endWalk.minutes + 5
    const totalMeters = walk.meters + endWalk.meters
    if (totalMinutes > input.remainingMinutes || totalMeters > (input.maxWalkMeters ?? Infinity)) return []
    return [{
      place,
      walkMinutes: walk.minutes,
      walkMeters: walk.meters,
      totalMinutes,
      score: scorePlace(place, input.preference, walk.minutes),
      reasonInterest: bestInterest(place, input.preference),
    }]
  }).sort((a, b) => b.score - a.score || a.walkMinutes - b.walkMinutes)
}

export function planPreview(input: PlanInput, count = 4): Suggestion[] {
  const output: Suggestion[] = []
  let current = { ...input, visited: [...input.visited] }
  for (let i = 0; i < count; i += 1) {
    const next = suggestNext(current)[0]
    if (!next) break
    output.push(next)
    current = {
      ...current,
      currentId: next.place.id,
      visited: [...current.visited, next.place.id],
      remainingMinutes: current.remainingMinutes - next.walkMinutes - next.place.dwell,
      maxWalkMeters: current.maxWalkMeters === undefined ? undefined : Math.max(0, current.maxWalkMeters - next.walkMeters),
    }
  }
  return output
}
