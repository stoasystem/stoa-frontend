/*
 * The last sky this browser read, kept per account (#757): on the next visit
 * the star map draws it at once while the skeleton is read again, rather than
 * a loading screen for as long as the backend takes.
 *
 * Only the picture comes from here. Nothing that decides something -- who is
 * new (`firstLanding.ts`), what waits to be celebrated (`unacknowledgedLit`),
 * the review reminder -- may read it: those wait for the server's answer
 * (`StarMapSource.provisional`). So the entry never enters the query cache,
 * and the chapter, which shares that query (#368), never sees it either.
 *
 * Small on purpose: the skeleton only (no small stars, no practice sets), and
 * without the lightings still to celebrate. A point lit and not yet celebrated
 * is kept as it was before (in progress), which is how the map draws it until
 * its moment plays; once acknowledged, the next write keeps it lit.
 *
 * The key names the account, and every entry goes when this browser's tab
 * signs out, or when a sign-in here replaces another account's (ADR 0003):
 * a shared browser never draws one account's sky for another. An entry in
 * another shape (`FORMAT`), another language, or that does not read as a
 * skeleton is thrown away. Storage that refuses is no cache: the map waits,
 * as it did before.
 */
import type { KnowledgeMapResponse } from '@/types/practice'

const PREFIX = 'stoa.starmap.sky.'
/** Bumped whenever what is stored changes shape: an entry of another format is thrown away. */
export const SKY_CACHE_FORMAT = 1

type Entry = { format: number; language: string; sky: KnowledgeMapResponse }

function keyFor(accountId: string): string {
  return `${PREFIX}${accountId}`
}

/** The sky as it is kept: the skeleton, nothing waiting to be celebrated, its uncelebrated points as they were. */
export function skyForCache(sky: KnowledgeMapResponse): KnowledgeMapResponse {
  const waiting = new Set(sky.unacknowledgedLit ?? [])
  const kept: KnowledgeMapResponse = {
    ...sky,
    stars: sky.stars.map((star) => (waiting.has(star.unitId) && star.state === 'lit' ? { ...star, state: 'in_progress' } : star)),
  }
  // No celebration ever comes from the cache.
  delete kept.unacknowledgedLit
  return kept
}

const isString = (value: unknown): value is string => typeof value === 'string'
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const STATES = new Set(['lit', 'in_progress', 'ready', 'locked'])

/** Whether a stored value still reads as a skeleton of today's shape: anything else is thrown away, not drawn. */
export function isCachedSkeleton(value: unknown): value is KnowledgeMapResponse {
  if (!isObject(value) || value.view !== 'skeleton' || !isString(value.subjectId)) return false
  const { galaxies, nebulae, stars, prerequisites, summary } = value
  if (!Array.isArray(galaxies) || !Array.isArray(nebulae) || !Array.isArray(stars) || !Array.isArray(prerequisites) || !isObject(summary)) return false
  if (!galaxies.every((g) => isObject(g) && isString(g.subjectId) && isString(g.name) && isNumber(g.lit) && isNumber(g.total) && typeof g.enrolled === 'boolean')) return false
  if (!nebulae.every((n) => isObject(n) && isString(n.topicId) && isString(n.name) && isNumber(n.order) && isString(n.subjectId))) return false
  if (!prerequisites.every((p) => isObject(p) && isString(p.from) && isString(p.to))) return false
  if (!isNumber(summary.lit) || !isNumber(summary.total) || !isNumber(summary.streakDays) || !isNumber(summary.score)) return false
  return stars.every(
    (s) =>
      isObject(s) &&
      isString(s.unitId) &&
      isString(s.name) &&
      isString(s.nebulaId) &&
      isNumber(s.order) &&
      isString(s.state) &&
      STATES.has(s.state) &&
      isNumber(s.progress) &&
      isNumber(s.unmetExercises) &&
      isNumber(s.reviewDue) &&
      (s.recommendation === null || isObject(s.recommendation)) &&
      isNumber(s.x) &&
      isNumber(s.y) &&
      Array.isArray(s.skills) &&
      isObject(s.chapter) &&
      isNumber(s.chapter.lessonCount) &&
      isNumber(s.chapter.lessonsDone),
  )
}

/** This account's last skeleton, in `language`; null when there is none, or none that can be trusted to draw. */
export function readCachedSky(accountId: string, language: string): KnowledgeMapResponse | null {
  try {
    const raw = localStorage.getItem(keyFor(accountId))
    if (raw === null) return null
    const entry = JSON.parse(raw) as Partial<Entry> | null
    if (!entry || entry.format !== SKY_CACHE_FORMAT || entry.language !== language || !isCachedSkeleton(entry.sky)) {
      localStorage.removeItem(keyFor(accountId))
      return null
    }
    return entry.sky
  } catch {
    // Storage refused, or what it held is not JSON: no cache.
    return null
  }
}

/** Keep `sky` as this account's last, in the language it was read in. A full sky (a backend before #503) is not kept. */
export function writeCachedSky(accountId: string, language: string, sky: KnowledgeMapResponse): void {
  if (sky.view !== 'skeleton') return
  try {
    const entry: Entry = { format: SKY_CACHE_FORMAT, language, sky: skyForCache(sky) }
    localStorage.setItem(keyFor(accountId), JSON.stringify(entry))
  } catch {
    // Storage refused or full: the next visit waits for the server, as before.
  }
}

/** Forget every account's sky but `keep`'s (signing out: every one). */
export function forgetCachedSkies(keep?: string): void {
  try {
    const kept = keep === undefined ? null : keyFor(keep)
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX) && key !== kept) doomed.push(key)
    }
    for (const key of doomed) localStorage.removeItem(key)
  } catch {
    // Storage refused: it holds no sky either.
  }
}
