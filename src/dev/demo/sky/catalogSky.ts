/*
 * PROTOTYPE ONLY (proto/starmap-line-styles): the backend's real knowledge
 * base (stoa-backend `knowledge_base_stars.json`, 216 stars, 425
 * prerequisites) as a read-model response with nothing lit, so the design
 * preview can show a dense sky (`&sky=catalog`). English names only.
 */
import raw from '@/dev/demo/sky/catalog-sky.json'
import type { KnowledgeMapResponse } from '@/types/practice'

/** The star a question about quadratic equations is answered with. */
export const CATALOG_QUADRATIC = 'gleichungen-quadratische-gleichungen'

export function catalogSkyWanted(): boolean {
  return new URLSearchParams(window.location.search).get('sky') === 'catalog'
}

/**
 * `&catalogLit=N`: every star at most N prerequisite steps deep is lit, the
 * stars one step further in progress, and the first ready star of each
 * subject recommended -- a student some way in, so the four tiers of lines
 * show. Absent: nothing lit.
 */
function litDepth(): number {
  const value = Number(new URLSearchParams(window.location.search).get('catalogLit'))
  return Number.isFinite(value) && value > 0 ? value : -1
}

/** Each star's depth: 0 with no prerequisites, else one more than its deepest prerequisite. */
function depths(): Map<string, number> {
  const before = new Map<string, string[]>()
  for (const { from, to } of raw.prerequisites) before.set(to, [...(before.get(to) ?? []), from])
  const out = new Map<string, number>()
  const visit = (id: string, seen: Set<string>): number => {
    const known = out.get(id)
    if (known !== undefined) return known
    if (seen.has(id)) return 0
    seen.add(id)
    const d = Math.max(-1, ...(before.get(id) ?? []).map((from) => visit(from, seen))) + 1
    out.set(id, d)
    return d
  }
  for (const star of raw.stars) visit(star.unitId, new Set())
  return out
}

let made: KnowledgeMapResponse | null = null

export function catalogSky(): KnowledgeMapResponse {
  if (made) return made
  const lit = litDepth()
  const depth = depths()
  const subjectOf = new Map(raw.nebulae.map((nebula) => [nebula.topicId, nebula.subjectId]))
  const recommended = new Set<string>()
  const stateOf = (unitId: string): KnowledgeMapResponse['stars'][number]['state'] => {
    const d = depth.get(unitId) ?? 0
    return lit < 0 ? 'ready' : d <= lit ? 'lit' : d === lit + 1 && unitId.length % 3 === 0 ? 'in_progress' : 'ready'
  }
  const stars: KnowledgeMapResponse['stars'] = raw.stars.map((star) => {
    const state = stateOf(star.unitId)
    const subject = subjectOf.get(star.nebulaId) ?? ''
    const ready = lit >= 0 && state === 'ready' && (depth.get(star.unitId) ?? 0) === lit + 1 && !recommended.has(subject)
    if (ready) recommended.add(subject)
    return {
      ...star,
      state,
      progress: state === 'in_progress' ? 0.4 : 0,
      unmetExercises: 0,
      reviewDue: 0,
      recommendation: ready ? { source: 'system' as const, reason: 'start' as const, relatedUnitId: null } : null,
    x: 0.5,
    y: 0.5,
    skills: [],
      chapter: { lessonCount: 0, lessonsDone: 0, nextLesson: null },
    }
  })
  const litCount = (subjectId: string) => stars.filter((star) => star.state === 'lit' && subjectOf.get(star.nebulaId) === subjectId).length
  made = {
    subjectId: 'mathematics',
    galaxies: raw.galaxies.map((galaxy) => ({ ...galaxy, lit: litCount(galaxy.subjectId) })),
    nebulae: raw.nebulae,
    stars,
    prerequisites: raw.prerequisites,
    summary: { lit: stars.filter((star) => star.state === 'lit').length, total: stars.length, streakDays: 0, score: 0 },
  }
  return made
}
