/*
 * The sky gathered into star clusters (prototype, `starmap-clusters`):
 * `layoutClusteredSky` on the real mathematics knowledge base and on a small
 * hand-made sky.
 */
import { describe, expect, it } from 'vitest'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { nebulaDiscs } from '@/features/starmap/view/geometry'
import { layoutClusteredSky } from '@/features/starmap/route/clusteredSky'
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

  it('runs each main line strictly left to right', () => {
    for (const cluster of clustersOf(map, 'en')) {
      const xs = cluster.route.mainline.map((id) => at.get(id)!.x)
      xs.forEach((x, i) => i > 0 && expect(x, cluster.clusterId).toBeGreaterThan(xs[i - 1]))
    }
  })

  it('puts every in-cluster prerequisite left of what needs it', () => {
    for (const { from, to } of map.prerequisites) {
      const a = at.get(from)!
      const b = at.get(to)!
      if (a.nebulaId === b.nebulaId) expect(a.x, `${from} -> ${to}`).toBeLessThan(b.x)
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
