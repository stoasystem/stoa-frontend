/*
 * The sky gathered into a few large star clusters (prototype, the design
 * preview's `starmap-clusters`): the same map, the same stars, the same
 * engine -- only the step before the engine changes.
 *
 *   - Each cluster (`clusters.ts`: a group of topics) becomes one nebula: the
 *     stars' `nebulaId` is their cluster's, and `nebulae` is the list of
 *     clusters with their names from the table. The engine's idea of a nebula
 *     is untouched; it simply gets fewer, larger ones.
 *   - Inside a cluster the stars follow its learning route (`routeLayout.ts`,
 *     without entrances: the map's own lines between nebulae show what comes
 *     from another cluster): a column is a step to the right, the main line
 *     runs along the middle, the side lanes alternate above and below. A
 *     seeded jitter and a slow wave keep it a field of stars rather than a
 *     grid, never enough to turn a prerequisite or the main line round.
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
 * Not used by the production read model yet (`readModelSource.placed()`);
 * wiring it in is one call there.
 */
import { GALAXY_GAP, galaxyOrder, seededRandom } from '@/features/starmap/layout/layout'
import { orderedNebulae, type Nebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { CLUSTER_TABLE, clusterIdOf, type ClusterDefinition } from '@/features/starmap/route/clusters'
import { layoutRoute } from '@/features/starmap/route/routeLayout'
import type { SupportedLanguage } from '@/i18n/languages'

/** The tuning, in route units (one column step is 1). */
export const CLUSTERED_SKY = {
  /** One column of the route to the next. */
  columnStep: 1,
  /** One lane to the next, up or down. */
  laneStep: 2.6,
  /** Horizontal jitter, either way: below half a column, so no prerequisite turns round. */
  jitterX: 0.26,
  /** Vertical jitter of a side-lane star, either way. */
  jitterY: 0.55,
  /** Vertical jitter of a main-line star: small, so the line reads left to right. */
  jitterMainY: 0.12,
  /** A slow wave the whole route follows, so it is not ruler-straight. */
  waveHeight: 0.6,
  /** Columns per wave. */
  waveLength: 9,
  /** A short route is stretched sideways until it is at least this much wider than tall, so it still reads left to right. */
  minAspect: 1.4,
  /** Room left round a cluster's stars inside its disc. */
  discPadding: 0.9,
  /** Dark between two clusters, as a share of the largest cluster radius. */
  clusterGap: 0.6,
} as const

/** Side lanes alternate around the main line: 1 above, 2 below, 3 further above. */
const LANE_ROW = [0, -1, 1, -2] as const

export type ClusterRegion = { x: number; y: number; r: number }

export type ClusteredSky = {
  /** One nebula per cluster, in cluster order across the sky. */
  nebulae: Nebula[]
  /** The same stars, each with its cluster as `nebulaId` and its new place. */
  stars: Star[]
  /** Each cluster's disc, which holds all its stars; no two overlap. */
  regions: Map<string, ClusterRegion>
}

function hash(text: string, seed: number): number {
  let h = (2166136261 ^ seed) >>> 0
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0
  return h
}

type Local = { id: string; points: Map<string, { x: number; y: number }>; r: number }

/** One cluster's stars along its route, centred on (0, 0), with the radius that holds them. */
function layoutCluster(
  id: string,
  members: readonly Star[],
  prerequisites: StarMap['prerequisites'],
  clusterOf: ReadonlyMap<string, string>,
  mainline: readonly string[] | undefined,
  seed: number,
): Local {
  const c = CLUSTERED_SKY
  const route = layoutRoute({ stars: members, prerequisites, clusterOf, mainline, entrances: false })
  const raw = new Map<string, { x: number; y: number }>()
  for (const node of route.nodes) {
    if (node.kind !== 'star') continue
    const rand = seededRandom(hash(node.unitId, seed))
    const jx = (rand() * 2 - 1) * c.jitterX
    const jy = (rand() * 2 - 1) * (node.main ? c.jitterMainY : c.jitterY)
    const wave = Math.sin((node.col / c.waveLength) * 2 * Math.PI + (hash(id, seed) % 628) / 100) * c.waveHeight
    raw.set(node.unitId, { x: node.col * c.columnStep + jx, y: LANE_ROW[node.lane] * c.laneStep + wave + jy })
  }
  const xs = [...raw.values()].map((p) => p.x)
  const ys = [...raw.values()].map((p) => p.y)
  const wide = Math.max(...xs) - Math.min(...xs)
  const tall = Math.max(...ys) - Math.min(...ys)
  if (wide > 0 && wide < c.minAspect * tall) {
    const stretch = (c.minAspect * tall) / wide
    for (const p of raw.values()) p.x *= stretch
  }
  let cx = 0
  let cy = 0
  for (const p of raw.values()) {
    cx += p.x / raw.size
    cy += p.y / raw.size
  }
  const points = new Map<string, { x: number; y: number }>()
  let r = 0
  for (const [unitId, p] of raw) {
    const q = { x: p.x - cx, y: p.y - cy }
    points.set(unitId, q)
    r = Math.max(r, Math.hypot(q.x, q.y))
  }
  return { id, points, r: r + c.discPadding }
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
      return layoutCluster(id, membersOf.get(id)!, map.prerequisites, clusterOf, group.definition?.mainline, seed)
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
  let cursor = gap / 2
  for (const galaxy of galaxies) {
    galaxy.locals.forEach((local, i) => {
      const cx = cursor + galaxy.centres[i].x
      const cy = galaxy.centres[i].y - galaxy.h / 2
      regions.set(local.id, { x: cx * k, y: 0.5 + cy * k, r: local.r * k })
      for (const [unitId, p] of local.points) placedAt.set(unitId, { x: (cx + p.x) * k, y: 0.5 + (cy + p.y) * k })
    })
    cursor += galaxy.w + gap
  }

  const nebulae: Nebula[] = withStars.map((g, i) => ({ topicId: g.clusterId, name: g.name, order: i + 1, subjectId: g.subjectId }))
  const stars = map.stars.map((star) => ({ ...star, nebulaId: clusterOf.get(star.unitId)!, ...placedAt.get(star.unitId)! }))
  return { nebulae, stars, regions }
}
