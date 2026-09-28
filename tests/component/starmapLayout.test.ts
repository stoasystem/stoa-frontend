/**
 * The star map's 2D geometry (#72): the fixture layout is deterministic and
 * shaped the way stoa-backend#60 will lay the map out, links come from
 * prerequisites, and the camera pans, glides and flies between layers.
 */
import { describe, expect, it } from 'vitest'
import { starMapFixture } from '@/features/starmap/fixtures/starMapFixtures'
import { layoutNebulae, layoutStarMap, scatterStars } from '@/features/starmap/layout/layout'
import { innerLinks, linkWeight, nebulaLinks } from '@/features/starmap/model/links'
import type { StarMap } from '@/features/starmap/model/starMap'
import { panBy, toMap, toScreen, transformOf, type View } from '@/features/starmap/view/camera'
import { createInertia, DEFAULT_INERTIA } from '@/features/starmap/view/inertia'
import { interpolateView } from '@/features/starmap/view/layers'

const nebulae = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, order: i + 1, size: 10 + ((i * 37) % 60) }))
const links = [
  { a: 'n0', b: 'n1', count: 3 },
  { a: 'n1', b: 'n2', count: 1 },
  { a: 'n0', b: 'n5', count: 2 },
  { a: 'n5', b: 'n9', count: 4 },
  { a: 'n3', b: 'n4', count: 1 },
  { a: 'n7', b: 'n8', count: 2 },
]

describe('the fixture layout', () => {
  it('gives the same map every time', () => {
    const a = layoutNebulae(nebulae, links, 7)
    const b = layoutNebulae(nebulae, links, 7)
    expect([...a]).toEqual([...b])
    expect(scatterStars(40, { x: 0.5, y: 0.5, r: 0.1 }, 3)).toEqual(scatterStars(40, { x: 0.5, y: 0.5, r: 0.1 }, 3))
    // The shipped fixtures too: two builds of the 2000-star map agree to the last digit.
    const first = starMapFixture(2000).stars.slice(0, 50).map((s) => [s.x, s.y])
    const second = layoutStarMap(
      starMapFixture(2000).nebulae.map((n) => ({
        id: n.topicId,
        order: n.order,
        size: starMapFixture(2000).stars.filter((s) => s.nebulaId === n.topicId).length,
      })),
      starMapFixture(2000).stars,
      nebulaLinks(starMapFixture(2000)),
      2000,
    )
    expect(starMapFixture(2000).stars.slice(0, 50).map((s) => [second.stars.get(s.unitId)!.x, second.stars.get(s.unitId)!.y])).toEqual(first)
  })

  it('keeps every nebula in [0, 1] and apart from the others', () => {
    const placed = [...layoutNebulae(nebulae, links, 7).values()]
    for (const p of placed) {
      expect(p.x - p.r).toBeGreaterThanOrEqual(0)
      expect(p.y - p.r).toBeGreaterThanOrEqual(0)
      expect(p.x + p.r).toBeLessThanOrEqual(1)
      expect(p.y + p.r).toBeLessThanOrEqual(1)
    }
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        expect(Math.hypot(placed[i].x - placed[j].x, placed[i].y - placed[j].y)).toBeGreaterThanOrEqual(placed[i].r + placed[j].r)
      }
    }
  })

  it('puts related nebulae nearer each other than unrelated ones', () => {
    const placed = layoutNebulae(nebulae, links, 7)
    const gap = (a: string, b: string) => {
      const p = placed.get(a)!
      const q = placed.get(b)!
      return Math.hypot(p.x - q.x, p.y - q.y) - p.r - q.r
    }
    const linked = new Set(links.map((l) => `${l.a}|${l.b}`))
    const related: number[] = []
    const unrelated: number[] = []
    for (let i = 0; i < nebulae.length; i += 1) {
      for (let j = i + 1; j < nebulae.length; j += 1) {
        const a = nebulae[i].id
        const b = nebulae[j].id
        ;(linked.has(`${a}|${b}`) || linked.has(`${b}|${a}`) ? related : unrelated).push(gap(a, b))
      }
    }
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
    expect(mean(related)).toBeLessThan(mean(unrelated) * 0.5)
  })

  it('scatters stars evenly inside their nebula, not on a grid', () => {
    const disc = { x: 0.4, y: 0.6, r: 0.12 }
    const stars = scatterStars(150, disc, 11)
    for (const [x, y] of stars) expect(Math.hypot(x - disc.x, y - disc.y)).toBeLessThanOrEqual(disc.r)
    // Even: no two stars crowd each other.
    const spacing = disc.r * Math.sqrt(Math.PI / 150)
    let closest = Infinity
    for (let i = 0; i < stars.length; i += 1) {
      for (let j = i + 1; j < stars.length; j += 1) closest = Math.min(closest, Math.hypot(stars[i][0] - stars[j][0], stars[i][1] - stars[j][1]))
    }
    expect(closest).toBeGreaterThan(spacing * 0.25)
    // Not a grid: a 150-star grid has about 12 rows and 12 columns; binned
    // at a tenth of the spacing, these stars fill far more.
    const bin = spacing * 0.1
    const rows = new Set(stars.map(([, y]) => Math.round(y / bin)))
    const columns = new Set(stars.map(([x]) => Math.round(x / bin)))
    expect(rows.size).toBeGreaterThan(80)
    expect(columns.size).toBeGreaterThan(80)
  })

  it('places every fixture star in [0, 1]', () => {
    for (const size of [10, 500, 2000] as const) {
      for (const star of starMapFixture(size).stars) {
        expect(star.x).toBeGreaterThanOrEqual(0)
        expect(star.x).toBeLessThanOrEqual(1)
        expect(star.y).toBeGreaterThanOrEqual(0)
        expect(star.y).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('links from prerequisites (#72 points 2 and 3)', () => {
  const map = starMapFixture(10)

  it('joins two nebulae once, as thick as the prerequisites crossing between them', () => {
    expect(nebulaLinks(map)).toEqual([
      { a: 'algebra', b: 'geometry', count: 1 },
      { a: 'algebra', b: 'numbers', count: 2 },
      { a: 'data', b: 'numbers', count: 1 },
    ])
  })

  it('counts both directions on the same line and ignores unknown units', () => {
    const extra: Pick<StarMap, 'stars' | 'prerequisites'> = {
      stars: map.stars,
      prerequisites: [...map.prerequisites, { from: 'u-5', to: 'u-1' }, { from: 'u-404', to: 'u-1' }],
    }
    expect(nebulaLinks(extra).find((l) => l.a === 'algebra' && l.b === 'numbers')?.count).toBe(3)
  })

  it('keeps a nebula’s own prerequisites for when it is zoomed into', () => {
    expect(innerLinks(map, 'geometry')).toEqual([{ from: 'u-7', to: 'u-8' }])
    expect(innerLinks(map, 'algebra')).toEqual([])
    expect(nebulaLinks(map).some((l) => l.a === l.b)).toBe(false)
  })

  it('has no lines at all while the backend has no prerequisites', () => {
    expect(nebulaLinks({ stars: map.stars, prerequisites: [] })).toEqual([])
  })

  it('draws more crossings thicker and brighter, within bounds', () => {
    const one = linkWeight(1)
    const four = linkWeight(4)
    expect(four.width).toBeGreaterThan(one.width)
    expect(four.alpha).toBeGreaterThan(one.alpha)
    expect(linkWeight(1000).width).toBeLessThanOrEqual(4)
    expect(linkWeight(1000).alpha).toBeLessThanOrEqual(0.5)
  })
})

describe('the camera', () => {
  const viewport = { width: 1000, height: 800 }
  const bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  const view: View = { cx: 0.5, cy: 0.5, k: 2, fx: 0.5, fy: 0.5 }

  it('maps the view centre to the focus point and back', () => {
    const t = transformOf(view, viewport, bounds)
    expect(toScreen(t, 0.5, 0.5)).toEqual([500, 400])
    const [x, y] = toMap(t, 123, 456)
    const [sx, sy] = toScreen(t, x, y)
    expect(sx).toBeCloseTo(123, 9)
    expect(sy).toBeCloseTo(456, 9)
  })

  it('pans with the pointer: the map point under it stays under it', () => {
    const before = transformOf(view, viewport, bounds)
    const grabbed = toMap(before, 300, 300)
    const after = transformOf(panBy(view, 40, -25, viewport, bounds), viewport, bounds)
    const [x, y] = toScreen(after, grabbed[0], grabbed[1])
    expect(x).toBeCloseTo(340, 9)
    expect(y).toBeCloseTo(275, 9)
  })

  it('never pans the map off screen', () => {
    const far = panBy(view, -1e6, 1e6, viewport, bounds)
    expect(far.cx).toBe(1)
    expect(far.cy).toBe(0)
  })
})

describe('the glide after a pan', () => {
  function thrown() {
    const inertia = createInertia()
    for (let t = 16; t <= 160; t += 16) inertia.sample(16, 0, 16, t) // 1 px/ms to the right
    return inertia
  }

  it('carries on for speed x decay time, whatever the frame rate', () => {
    const glide = (dt: number) => {
      const inertia = thrown()
      inertia.release(165)
      let travelled = 0
      for (let t = 0; t < 3000; t += dt) travelled += inertia.advance(dt)?.[0] ?? 0
      return travelled
    }
    // 1 px/ms for 220 ms, less the tail cut off below the rest speed.
    expect(glide(8)).toBeGreaterThan(DEFAULT_INERTIA.decayMs * 0.95)
    expect(glide(8)).toBeLessThanOrEqual(DEFAULT_INERTIA.decayMs)
    expect(Math.abs(glide(8) - glide(40))).toBeLessThan(DEFAULT_INERTIA.decayMs * 0.02)
  })

  it('loses 1/e of its speed per decay time constant', () => {
    const inertia = thrown()
    inertia.release(165)
    const v0 = inertia.speed
    inertia.advance(DEFAULT_INERTIA.decayMs)
    expect(inertia.speed / v0).toBeCloseTo(Math.exp(-1), 6)
  })

  it('throws nothing when the pointer was held still before letting go', () => {
    const inertia = thrown()
    expect(inertia.release(160 + DEFAULT_INERTIA.holdMs + 1)).toBe(false)
    expect(inertia.advance(16)).toBeNull()
  })
})

describe('the zoom flight between layers', () => {
  const size = 800
  const base = 700

  it('starts and ends exactly on the two views', () => {
    const from: View = { cx: 0.5, cy: 0.5, k: 1, fx: 0.5, fy: 0.52 }
    const to: View = { cx: 0.2, cy: 0.7, k: 4, fx: 0.34, fy: 0.5 }
    const flight = interpolateView(from, to, size, base)
    expect(flight(0)).toEqual(from)
    expect(flight(1)).toEqual(to)
    const almost = flight(0.9999)
    expect(almost.cx).toBeCloseTo(0.2, 3)
    expect(almost.k).toBeCloseTo(4, 2)
  })

  it('pulls back mid-flight on a long move, as d3-zoom does', () => {
    const from: View = { cx: 0.1, cy: 0.1, k: 6, fx: 0.5, fy: 0.5 }
    const to: View = { cx: 0.9, cy: 0.9, k: 6, fx: 0.5, fy: 0.5 }
    expect(interpolateView(from, to, size, base)(0.5).k).toBeLessThan(6)
  })

  it('zooms straight in when the centre does not move', () => {
    const flight = interpolateView({ cx: 0.3, cy: 0.3, k: 1, fx: 0.5, fy: 0.5 }, { cx: 0.3, cy: 0.3, k: 5, fx: 0.5, fy: 0.5 }, size, base)
    let previous = 0
    for (let t = 0; t <= 1; t += 0.1) {
      const { k, cx } = flight(t)
      expect(k).toBeGreaterThanOrEqual(previous - 1e-9)
      expect(cx).toBeCloseTo(0.3, 12)
      previous = k
    }
  })
})
