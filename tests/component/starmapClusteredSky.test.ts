/*
 * The sky gathered into star clusters (prototype, `starmap-clusters`):
 * `layoutClusteredSky` on the real mathematics knowledge base and on small
 * hand-made skies: clusters apart, and inside each cluster its chapters as
 * bands from top to bottom, each band left to right along the route.
 */
import { describe, expect, it } from 'vitest'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { nebulaDiscs } from '@/features/starmap/view/geometry'
import { CLUSTERED_SKY, layoutClusteredSky } from '@/features/starmap/route/clusteredSky'
import { CHAPTER_TABLE } from '@/features/starmap/route/chapters'
import { clustersOf } from '@/features/starmap/route/clusters'
import type { Star, StarMap } from '@/features/starmap/model/starMap'

const map = demoClusterMap('en')
const sky = layoutClusteredSky(map, 'en')
const at = new Map(sky.stars.map((s) => [s.unitId, s]))

describe('layoutClusteredSky on the mathematics knowledge base', () => {
  it('makes the four clusters of the table the nebulae, named from it', () => {
    expect(sky.nebulae.map((n) => [n.topicId, n.name])).toEqual([
      ['numbers', 'Numbers and operations'],
      ['geometry', 'Geometry'],
      ['algebra', 'Equations and algebra'],
      ['data', 'Data and probability'],
    ])
    expect(sky.stars).toHaveLength(98)
    expect(new Set(sky.stars.map((s) => s.nebulaId))).toEqual(new Set(['numbers', 'geometry', 'algebra', 'data']))
    // Only the nebula and the place change: the star is otherwise the same.
    const before = map.stars.find((s) => s.unitId === sky.stars[0].unitId)!
    expect({ ...sky.stars[0], nebulaId: before.nebulaId, x: before.x, y: before.y }).toEqual(before)
  })

  it('keeps every star inside [0, 1]', () => {
    for (const s of sky.stars) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThanOrEqual(1)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThanOrEqual(1)
    }
  })

  it('keeps every star inside its cluster, and the clusters apart', () => {
    for (const s of sky.stars) {
      const region = sky.regions.get(s.nebulaId)!
      expect(Math.hypot(s.x - region.x, s.y - region.y)).toBeLessThanOrEqual(region.r)
    }
    const regions = [...sky.regions.values()]
    for (let i = 0; i < regions.length; i += 1) {
      for (let j = i + 1; j < regions.length; j += 1) {
        const [a, b] = [regions[i], regions[j]]
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r)
      }
    }
    // The discs the engine draws and hit-tests by do not overlap either.
    const discs = [...nebulaDiscs(sky).values()]
    for (let i = 0; i < discs.length; i += 1) {
      for (let j = i + 1; j < discs.length; j += 1) {
        expect(Math.hypot(discs[i].x - discs[j].x, discs[i].y - discs[j].y)).toBeGreaterThan(discs[i].r + discs[j].r)
      }
    }
  })

  it('gives every star of a cluster exactly one chapter band, the table chapters for mathematics', () => {
    for (const cluster of clustersOf(map, 'en')) {
      const bands = sky.chapters.get(cluster.clusterId)!
      expect(bands.map((b) => b.chapterId)).toEqual(CHAPTER_TABLE[cluster.clusterId].map((c) => c.chapterId))
      expect(bands.flatMap((b) => b.stars).sort()).toEqual(cluster.stars.map((s) => s.unitId).sort())
    }
  })

  it('stacks the chapters top to bottom, chapter k wholly above chapter k + 1', () => {
    for (const [clusterId, bands] of sky.chapters) {
      bands.forEach((band, k) => {
        expect(band.number).toBe(k + 1)
        if (k === 0) return
        const above = Math.max(...bands[k - 1].stars.map((id) => at.get(id)!.y))
        const below = Math.min(...band.stars.map((id) => at.get(id)!.y))
        // A clear gap, not just no overlap: wider than any band's own lane spread.
        expect(below - above, `${clusterId} ${k}`).toBeGreaterThan(CLUSTERED_SKY.chapterGap * 0.99 * sky.unit.get(clusterId)!)
        expect(bands[k - 1].y, clusterId).toBeLessThan(band.y)
      })
    }
  })

  it('starts every band at the cluster left edge', () => {
    for (const [clusterId, bands] of sky.chapters) {
      const firsts = bands.map((band) => Math.min(...band.stars.map((id) => at.get(id)!.x)))
      for (const x of firsts) expect(Math.abs(x - firsts[0]), clusterId).toBeLessThan(2 * CLUSTERED_SKY.jitterX * sky.unit.get(clusterId)! + 1e-9)
      for (const band of bands) expect(band.x, clusterId).toBeLessThanOrEqual(Math.min(...firsts) + 1e-9)
    }
  })

  it('runs each chapter left to right in route order: x never decreases with the route column', () => {
    for (const cluster of clustersOf(map, 'en')) {
      const col = new Map(cluster.route.nodes.flatMap((n) => (n.kind === 'star' ? [[n.unitId, n.col] as const] : [])))
      for (const band of sky.chapters.get(cluster.clusterId)!) {
        const stars = [...band.stars].sort((a, b) => col.get(a)! - col.get(b)!)
        for (let i = 1; i < stars.length; i += 1) {
          if (col.get(stars[i])! > col.get(stars[i - 1])!) expect(at.get(stars[i])!.x, `${stars[i - 1]} -> ${stars[i]}`).toBeGreaterThan(at.get(stars[i - 1])!.x)
        }
        // Every star of a column lies left of every star of a later column.
        for (const a of band.stars) {
          for (const b of band.stars) {
            if (col.get(a)! < col.get(b)!) expect(at.get(a)!.x, `${a} | ${b}`).toBeLessThan(at.get(b)!.x)
          }
        }
      }
    }
  })

  it('runs each main line strictly left to right inside a chapter, and every in-chapter prerequisite too', () => {
    for (const cluster of clustersOf(map, 'en')) {
      const bandOf = new Map(sky.chapters.get(cluster.clusterId)!.flatMap((band) => band.stars.map((id) => [id, band.number] as const)))
      const main = cluster.route.mainline
      for (let i = 1; i < main.length; i += 1) {
        if (bandOf.get(main[i]) === bandOf.get(main[i - 1])) expect(at.get(main[i])!.x, cluster.clusterId).toBeGreaterThan(at.get(main[i - 1])!.x)
      }
      for (const { from, to } of map.prerequisites) {
        if (bandOf.has(from) && bandOf.get(from) === bandOf.get(to)) expect(at.get(from)!.x, `${from} -> ${to}`).toBeLessThan(at.get(to)!.x)
      }
    }
  })

  it('keeps the main line in its band: side lanes just above and below', () => {
    for (const cluster of clustersOf(map, 'en')) {
      const onMain = new Set(cluster.route.mainline)
      for (const band of sky.chapters.get(cluster.clusterId)!) {
        for (const id of band.stars) {
          const dy = (at.get(id)!.y - band.y) / sky.unit.get(cluster.clusterId)!
          if (onMain.has(id)) expect(Math.abs(dy), id).toBeLessThanOrEqual(CLUSTERED_SKY.jitterMainY + 1e-9)
          else expect(Math.abs(dy), id).toBeLessThanOrEqual(2 * CLUSTERED_SKY.laneStep + CLUSTERED_SKY.jitterY + 1e-9)
        }
      }
    }
  })

  it('leaves far more dark between clusters than between stars', () => {
    const regions = [...sky.regions.values()]
    let gap = Infinity
    for (let i = 0; i < regions.length; i += 1) {
      for (let j = i + 1; j < regions.length; j += 1) {
        const [a, b] = [regions[i], regions[j]]
        gap = Math.min(gap, Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r)
      }
    }
    const nearest = sky.stars.map((s) =>
      Math.min(...sky.stars.filter((o) => o !== s && o.nebulaId === s.nebulaId).map((o) => Math.hypot(o.x - s.x, o.y - s.y))),
    )
    nearest.sort((a, b) => a - b)
    expect(gap).toBeGreaterThan(2 * nearest[Math.floor(nearest.length / 2)])
  })

  it('gives the same sky for the same map', () => {
    expect(layoutClusteredSky(demoClusterMap('en'), 'en')).toEqual(sky)
    // The language changes names only.
    const de = layoutClusteredSky(demoClusterMap('de'), 'de')
    expect(de.stars.map((s) => [s.unitId, s.x, s.y])).toEqual(sky.stars.map((s) => [s.unitId, s.x, s.y]))
    expect(de.nebulae[0].name).toBe('Zahlen und Rechnen')
    // The learning state moves nothing.
    const relit = layoutClusteredSky({ ...map, stars: map.stars.map((s, i) => ({ ...s, state: i % 2 ? ('lit' as const) : ('ready' as const) })) }, 'en')
    expect(relit.stars.map((s) => [s.unitId, s.x, s.y])).toEqual(sky.stars.map((s) => [s.unitId, s.x, s.y]))
  })
})

describe('layoutClusteredSky on a sky the table does not know', () => {
  const star = (unitId: string, nebulaId: string, order: number): Star => ({ ...map.stars[0], unitId, nebulaId, order, name: unitId })
  const small: Pick<StarMap, 'nebulae' | 'stars' | 'prerequisites' | 'subjects' | 'subject'> = {
    subject: { subjectId: 'physics', name: 'Physics' },
    subjects: [{ subjectId: 'physics', name: 'Physics', lit: 0, total: 5, enrolled: true }],
    nebulae: [
      { topicId: 'optics', name: 'Optics', order: 1, subjectId: 'physics' },
      { topicId: 'mechanics', name: 'Mechanics', order: 2, subjectId: 'physics' },
    ],
    stars: [star('o1', 'optics', 1), star('o2', 'optics', 2), star('o3', 'optics', 3), star('m1', 'mechanics', 1), star('m2', 'mechanics', 2)],
    prerequisites: [
      { from: 'o1', to: 'o2' },
      { from: 'o2', to: 'o3' },
      { from: 'm1', to: 'm2' },
      { from: 'm1', to: 'o2' },
    ],
  }

  it('keeps each topic a cluster of its own, under its own id and name', () => {
    const out = layoutClusteredSky(small, 'en')
    expect(out.nebulae.map((n) => [n.topicId, n.name, n.subjectId])).toEqual([
      ['optics', 'Optics', 'physics'],
      ['mechanics', 'Mechanics', 'physics'],
    ])
    const byId = new Map(out.stars.map((s) => [s.unitId, s]))
    expect(byId.get('o1')!.x).toBeLessThan(byId.get('o2')!.x)
    expect(byId.get('o2')!.x).toBeLessThan(byId.get('o3')!.x)
    expect(byId.get('m1')!.x).toBeLessThan(byId.get('m2')!.x)
  })
})

describe('layoutClusteredSky with automatic chapters', () => {
  const star = (unitId: string, order: number): Star => ({ ...map.stars[0], unitId, nebulaId: 'logic', order, name: unitId })
  const ids = Array.from({ length: 10 }, (_, i) => `l${i}`)
  const chain: Pick<StarMap, 'nebulae' | 'stars' | 'prerequisites' | 'subjects' | 'subject'> = {
    subject: { subjectId: 'philosophy', name: 'Philosophy' },
    subjects: [{ subjectId: 'philosophy', name: 'Philosophy', lit: 0, total: 10, enrolled: true }],
    nebulae: [{ topicId: 'logic', name: 'Logic', order: 1, subjectId: 'philosophy' }],
    stars: ids.map((id, i) => star(id, i + 1)),
    prerequisites: ids.slice(1).map((id, i) => ({ from: ids[i], to: id })),
  }

  it('cuts a route the table does not know into bands too, top to bottom, each from the left edge', () => {
    const out = layoutClusteredSky(chain, 'en')
    const byId = new Map(out.stars.map((s) => [s.unitId, s]))
    const bands = out.chapters.get('logic')!
    expect(bands.map((b) => [b.name, b.stars])).toEqual([
      [null, ['l0', 'l1', 'l2', 'l3']],
      [null, ['l4', 'l5', 'l6', 'l7']],
      [null, ['l8', 'l9']],
    ])
    for (let k = 1; k < bands.length; k += 1) {
      expect(Math.min(...bands[k].stars.map((id) => byId.get(id)!.y))).toBeGreaterThan(Math.max(...bands[k - 1].stars.map((id) => byId.get(id)!.y)))
      expect(Math.abs(byId.get(bands[k].stars[0])!.x - byId.get('l0')!.x)).toBeLessThan(2 * CLUSTERED_SKY.jitterX * out.unit.get('logic')! + 1e-9)
    }
    expect(layoutClusteredSky(chain, 'en')).toEqual(out)
  })
})

describe('layoutClusteredSky with a small subject beside a large one', () => {
  const big = Array.from({ length: 400 }, (_, i) => `b${i}`)
  const both: Pick<StarMap, 'nebulae' | 'stars' | 'prerequisites' | 'subjects' | 'subject'> = {
    ...map,
    subjects: [...map.subjects, { subjectId: 'big', name: 'Big', lit: 0, total: big.length, enrolled: true }],
    nebulae: [...map.nebulae, { topicId: 'everything', name: 'Everything', order: 99, subjectId: 'big' }],
    stars: [...map.stars, ...big.map((unitId, i): Star => ({ ...map.stars[0], unitId, nebulaId: 'everything', order: i + 1, name: unitId }))],
    prerequisites: [...map.prerequisites, ...big.slice(1).map((to, i) => ({ from: big[i], to }))],
  }

  it('draws the small galaxy no smaller than about half the tall one, its clusters still apart', () => {
    const out = layoutClusteredSky(both, 'en')
    const height = (subjectId: string) => {
      const regions = out.nebulae.filter((n) => n.subjectId === subjectId).map((n) => out.regions.get(n.topicId)!)
      return Math.max(...regions.map((r) => r.y + r.r)) - Math.min(...regions.map((r) => r.y - r.r))
    }
    expect(height(map.subject.subjectId)).toBeGreaterThan(0.5 * height('big'))
    const regions = [...out.regions.values()]
    for (let i = 0; i < regions.length; i += 1) {
      for (let j = i + 1; j < regions.length; j += 1) {
        expect(Math.hypot(regions[i].x - regions[j].x, regions[i].y - regions[j].y)).toBeGreaterThan(regions[i].r + regions[j].r)
      }
    }
    // Spread wider, not reshaped: inside a cluster the step is larger, the bands the same.
    expect(out.unit.get('geometry')!).toBeGreaterThan(out.unit.get('everything')!)
  })
})
