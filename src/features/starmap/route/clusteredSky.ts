/*
 * The sky gathered into a few large star clusters (#747): the same map, the
 * same stars, the same engine -- only the step before the engine changes.
 *
 *   - Each cluster (`clusters.ts`: a group of topics) becomes one nebula: the
 *     stars' `nebulaId` is their cluster's, and `nebulae` is the list of
 *     clusters with their names from the table. The engine's idea of a nebula
 *     is untouched; it simply gets fewer, larger ones.
 *   - Inside a cluster the stars are grouped by chapter (`chapters.ts`, from
 *     the table or cut automatically): each chapter is one horizontal band,
 *     chapter 1 at the top and the last at the bottom, with a clear gap
 *     between bands. Inside a band the stars follow the cluster's learning
 *     route (`routeLayout.ts`, without entrances: the map's own lines between
 *     nebulae show what comes from another cluster) left to right, every band
 *     starting at the cluster's left edge: column by column from the
 *     chapter's first, and inside a column the main line before its side
 *     lanes (`chaptersOf`'s order), each star a step of its own -- a chapter is only two to five columns of up to
 *     four lanes, so one step per column would stack the bands into a narrow
 *     pillar. The main line runs along the band's middle, side lanes just
 *     above and below. A small seeded jitter keeps it a field of stars rather
 *     than a grid, never enough to cross a neighbour or another lane.
 *   - The clusters of one subject sit on a grid of their own, neighbours in
 *     the order of the prerequisites they share (`galaxyOrder`), snaking so
 *     each one is beside the one before; the dark between two clusters is
 *     `CLUSTER_GAP` of the largest radius, far wider than the room between
 *     two stars. Subjects follow one another along the band as `layoutSky`
 *     lays them, with `GALAXY_GAP` between.
 *
 * Pure and seeded: the same map gives the same sky. The output is normalised
 * like `layoutSky`'s: x across the band in [0, 1], y centred on 0.5.
 *
 * The production read model places its sky with this
 * (`readModelSource.placed()`).
 */
import { GALAXY_GAP, galaxyOrder, seededRandom } from '@/features/starmap/layout/layout'
import { orderedNebulae, type Nebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { CLUSTER_TABLE, clusterIdOf, type ClusterDefinition } from '@/features/starmap/route/clusters'
import { chaptersOf } from '@/features/starmap/route/chapters'
import { laneRow, layoutRoute } from '@/features/starmap/route/routeLayout'
import type { SupportedLanguage } from '@/i18n/languages'

/** The tuning, in star steps (one star to the next along a band is 1). */
export const CLUSTERED_SKY = {
  /** One star to the next along a band, in route order. */
  starStep: 1,
  /** Extra room where a band moves on to the route's next column. */
  columnGap: 0.5,
  /** One lane to the next, up or down, inside a chapter's band. */
  laneStep: 0.45,
  /** Dark between two chapters' bands: from the lowest star one band can reach to the highest the next can. */
  chapterGap: 2.2,
  /** Horizontal jitter, either way: well below half a star step, so no star crosses its neighbour. */
  jitterX: 0.16,
  /** Vertical jitter of a side-lane star, either way: below half a lane, so no star crosses its neighbour's lane. */
  jitterY: 0.08,
  /** Vertical jitter of a main-line star: smaller, so the line reads left to right. */
  jitterMainY: 0.04,
  /** Room left round a cluster's stars inside its disc. */
  discPadding: 0.9,
  /** Dark between two clusters, as a share of the largest cluster radius. */
  clusterGap: 0.6,
} as const

export type ClusterRegion = { x: number; y: number; r: number }

/** One chapter of a cluster as a band of the sky; x and y in the sky's units. */
export type ChapterBand = {
  chapterId: string
  /** 1-based, top to bottom. */
  number: number
  /** The table's name in the language asked for; null for an automatic chapter (the caller says "Chapter n"). */
  name: string | null
  /** Its stars in route order. */
  stars: string[]
  /** The cluster's left edge, where every band starts. */
  x: number
  /** The height of the band's main line. */
  y: number
}

export type ClusteredSky = {
  /** One nebula per cluster, in cluster order across the sky. */
  nebulae: Nebula[]
  /** The same stars, each with its cluster as `nebulaId` and its new place. */
  stars: Star[]
  /** Each cluster's disc, which holds all its stars; no two overlap. */
  regions: Map<string, ClusterRegion>
  /** One star step (`CLUSTERED_SKY`'s unit) in the sky's units. */
  unit: number
  /** Each cluster's chapters, top to bottom. */
  chapters: Map<string, ChapterBand[]>
}

function hash(text: string, seed: number): number {
  let h = (2166136261 ^ seed) >>> 0
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0
  return h
}

type Point = { x: number; y: number }
type Local = { id: string; points: Map<string, Point>; r: number; bands: ChapterBand[] }

/** One cluster's stars in chapter bands, centred on (0, 0), with the radius that holds them; bands in the same units. */
function layoutCluster(
  id: string,
  members: readonly Star[],
  prerequisites: StarMap['prerequisites'],
  clusterOf: ReadonlyMap<string, string>,
  mainline: readonly string[] | undefined,
  language: SupportedLanguage,
  seed: number,
): Local {
  const c = CLUSTERED_SKY
  const route = layoutRoute({ stars: members, prerequisites, clusterOf, mainline, entrances: false })
  const nodeOf = new Map(route.nodes.flatMap((n) => (n.kind === 'star' ? [[n.unitId, n] as const] : [])))
  // How far a star of a row may stray up or down.
  const reach = (row: number) => (row === 0 ? c.jitterMainY : c.jitterY)
  const raw = new Map<string, Point>()
  const bands: ChapterBand[] = []
  // Where the next band's highest star may reach: a gap below the lowest the band before can reach.
  let top = 0
  for (const chapter of chaptersOf(route, id, language)) {
    const rows = chapter.stars.map((unitId) => laneRow(nodeOf.get(unitId)!.lane))
    const high = Math.min(0, ...rows)
    const low = Math.max(0, ...rows)
    const mainY = top + reach(high) - high * c.laneStep
    // Left to right in route order (by column, then the main line before its side lanes), each star a step of its own.
    chapter.stars.forEach((unitId, slot) => {
      const rand = seededRandom(hash(unitId, seed))
      const jx = (rand() * 2 - 1) * c.jitterX
      const jy = (rand() * 2 - 1) * reach(rows[slot])
      const col = nodeOf.get(unitId)!.col - chapter.fromCol
      raw.set(unitId, { x: slot * c.starStep + col * c.columnGap + jx, y: mainY + rows[slot] * c.laneStep + jy })
    })
    bands.push({ chapterId: chapter.chapterId, number: chapter.number, name: chapter.name, stars: chapter.stars, x: -c.jitterX, y: mainY })
    top = mainY + low * c.laneStep + reach(low) + c.chapterGap
  }
  let cx = 0
  let cy = 0
  for (const p of raw.values()) {
    cx += p.x / raw.size
    cy += p.y / raw.size
  }
  const points = new Map<string, Point>()
  let r = 0
  for (const [unitId, p] of raw) {
    const q = { x: p.x - cx, y: p.y - cy }
    points.set(unitId, q)
    r = Math.max(r, Math.hypot(q.x, q.y))
  }
  return { id, points, r: r + c.discPadding, bands: bands.map((b) => ({ ...b, x: b.x - cx, y: b.y - cy })) }
}


/** Clusters on a grid, snaking so each is beside the one before; centres relative to the grid's top left. */
function gridOf(locals: readonly Local[]) {
  const n = locals.length
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
  const rows = Math.ceil(n / cols)
  const gap = CLUSTERED_SKY.clusterGap * Math.max(...locals.map((l) => l.r))
  const cell = locals.map((_, i) => {
    const row = Math.floor(i / cols)
    const k = i % cols
    return { row, col: row % 2 === 0 ? k : cols - 1 - k }
  })
  const width = Array.from({ length: cols }, (_, col) => Math.max(0, ...locals.filter((_, i) => cell[i].col === col).map((l) => 2 * l.r)) + gap)
  const height = Array.from({ length: rows }, (_, row) => Math.max(0, ...locals.filter((_, i) => cell[i].row === row).map((l) => 2 * l.r)) + gap)
  const left = width.map((_, col) => width.slice(0, col).reduce((a, b) => a + b, 0))
  const top = height.map((_, row) => height.slice(0, row).reduce((a, b) => a + b, 0))
  const centres = locals.map((_, i) => ({ x: left[cell[i].col] + width[cell[i].col] / 2, y: top[cell[i].row] + height[cell[i].row] / 2 }))
  return { centres, w: width.reduce((a, b) => a + b, 0), h: height.reduce((a, b) => a + b, 0) }
}

export function layoutClusteredSky(
  map: Pick<StarMap, 'nebulae' | 'stars' | 'prerequisites' | 'subjects' | 'subject'>,
  language: SupportedLanguage,
  { table = CLUSTER_TABLE, seed = 116 }: { table?: readonly ClusterDefinition[]; seed?: number } = {},
): ClusteredSky {
  const topicOrder = orderedNebulae(map)
  const subjectOfTopic = new Map(topicOrder.map((n) => [n.topicId, n.subjectId ?? map.subject.subjectId]))
  const clusterOf = new Map<string, string>()
  for (const star of map.stars) clusterOf.set(star.unitId, clusterIdOf(star.nebulaId, table))

  // The clusters of each subject, in the order of their first topic, with their names.
  type Group = { clusterId: string; subjectId: string; name: string; definition?: ClusterDefinition }
  const groups: Group[] = []
  for (const nebula of topicOrder) {
    const clusterId = clusterIdOf(nebula.topicId, table)
    if (groups.some((g) => g.clusterId === clusterId)) continue
    const definition = table.find((d) => d.clusterId === clusterId)
    groups.push({ clusterId, subjectId: subjectOfTopic.get(nebula.topicId)!, name: definition?.names[language] ?? nebula.name, definition })
  }
  const membersOf = new Map<string, Star[]>()
  for (const star of map.stars) {
    const id = clusterOf.get(star.unitId)!
    membersOf.set(id, [...(membersOf.get(id) ?? []), star])
  }
  const withStars = groups.filter((g) => (membersOf.get(g.clusterId)?.length ?? 0) > 0)

  // How many prerequisites run between two clusters, for who sits beside whom.
  const crossLinks = new Map<string, { a: string; b: string; count: number }>()
  for (const { from, to } of map.prerequisites) {
    const a = clusterOf.get(from)
    const b = clusterOf.get(to)
    if (!a || !b || a === b) continue
    const [first, second] = a < b ? [a, b] : [b, a]
    const key = `${first}\n${second}`
    const link = crossLinks.get(key) ?? { a: first, b: second, count: 0 }
    link.count += 1
    crossLinks.set(key, link)
  }

  const subjects = [...map.subjects.map((s) => s.subjectId), ...withStars.map((g) => g.subjectId)].filter(
    (id, i, all) => all.indexOf(id) === i && withStars.some((g) => g.subjectId === id),
  )
  const galaxies = subjects.map((subjectId) => {
    const own = withStars.filter((g) => g.subjectId === subjectId)
    const order = galaxyOrder(own.map((g) => g.clusterId), [...crossLinks.values()])
    const locals = order.map((id) => {
      const group = own.find((g) => g.clusterId === id)!
      return layoutCluster(id, membersOf.get(id)!, map.prerequisites, clusterOf, group.definition?.mainline, language, seed)
    })
    return { locals, ...gridOf(locals) }
  })

  // Along the band, as `layoutSky` lays galaxies out: half a gap at each end.
  const tallest = Math.max(1e-9, ...galaxies.map((g) => g.h))
  const gap = GALAXY_GAP * tallest
  const length = galaxies.reduce((sum, g) => sum + g.w + gap, 0) || 1
  const k = 1 / length
  const placedAt = new Map<string, { x: number; y: number }>()
  const regions = new Map<string, ClusterRegion>()
  const chapters = new Map<string, ChapterBand[]>()
  let cursor = gap / 2
  for (const galaxy of galaxies) {
    galaxy.locals.forEach((local, i) => {
      const cx = cursor + galaxy.centres[i].x
      const cy = galaxy.centres[i].y - galaxy.h / 2
      regions.set(local.id, { x: cx * k, y: 0.5 + cy * k, r: local.r * k })
      for (const [unitId, p] of local.points) placedAt.set(unitId, { x: (cx + p.x) * k, y: 0.5 + (cy + p.y) * k })
      chapters.set(local.id, local.bands.map((band) => ({ ...band, x: (cx + band.x) * k, y: 0.5 + (cy + band.y) * k })))
    })
    cursor += galaxy.w + gap
  }

  const nebulae: Nebula[] = withStars.map((g, i) => ({ topicId: g.clusterId, name: g.name, order: i + 1, subjectId: g.subjectId }))
  const stars = map.stars.map((star) => ({ ...star, nebulaId: clusterOf.get(star.unitId)!, ...placedAt.get(star.unitId)! }))
  return { nebulae, stars, regions, chapters, unit: k }
}
