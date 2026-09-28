/*
 * A star map laid out in 2D (#72 point 4), the way stoa-backend#60 will do it
 * offline: nebulae placed by their relation graph, so related topics sit
 * close together, and each nebula's stars scattered evenly inside it, never
 * on a grid. The output is normalised: every nebula and star lies in [0, 1]
 * on both axes.
 *
 * The front end only needs this for its fixtures until #60 lands; the real
 * map arrives with its coordinates. Everything is seeded, so the same input
 * always gives the same map, on every device and every visit.
 */

export type LayoutNebula = { id: string; order: number; size: number }
export type LayoutLink = { a: string; b: string; count: number }
export type Placement = { x: number; y: number; r: number }

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** mulberry32: small, fast and the same everywhere. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Space between nebulae, as a fraction of the smaller radius plus a floor. */
const gapBetween = (ri: number, rj: number) => 0.012 + 0.35 * Math.min(ri, rj)

/**
 * Nebula centres and radii. A nebula's area follows its star count; linked
 * nebulae are pulled together (harder the more prerequisites cross), all of
 * them are kept apart, and a weak pull to the middle keeps the map compact.
 */
export function layoutNebulae(nebulae: readonly LayoutNebula[], links: readonly LayoutLink[], seed: number): Map<string, Placement> {
  const rand = seededRandom(seed)
  const sorted = [...nebulae].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const n = sorted.length
  const out = new Map<string, Placement>()
  if (n === 0) return out

  const totalSize = sorted.reduce((sum, nebula) => sum + Math.max(1, nebula.size), 0)
  // Nebulae cover about 30% of the working square.
  const c = Math.sqrt(0.3 / (Math.PI * totalSize))
  const r = sorted.map((nebula) => c * Math.sqrt(Math.max(1, nebula.size)))
  const x = new Float64Array(n)
  const y = new Float64Array(n)
  sorted.forEach((_, i) => {
    const rho = 0.35 * Math.sqrt((i + 0.5) / n)
    const theta = i * GOLDEN_ANGLE + rand() * 0.3
    x[i] = 0.5 + rho * Math.cos(theta)
    y[i] = 0.5 + rho * Math.sin(theta)
  })

  const index = new Map(sorted.map((nebula, i) => [nebula.id, i]))
  const springs = links
    .map((link) => ({ i: index.get(link.a), j: index.get(link.b), count: link.count }))
    .filter((s): s is { i: number; j: number; count: number } => s.i !== undefined && s.j !== undefined && s.i !== s.j)

  const dx = new Float64Array(n)
  const dy = new Float64Array(n)
  const ITERATIONS = 400
  for (let it = 0; it < ITERATIONS; it += 1) {
    dx.fill(0)
    dy.fill(0)
    const cool = 0.02 * (1 - it / ITERATIONS) + 0.002
    let mx = 0
    let my = 0
    for (let i = 0; i < n; i += 1) {
      mx += x[i] / n
      my += y[i] / n
    }
    for (let i = 0; i < n; i += 1) {
      dx[i] += (mx - x[i]) * 0.01
      dy[i] += (my - y[i]) * 0.01
    }
    for (const { i, j, count } of springs) {
      const ex = x[j] - x[i]
      const ey = y[j] - y[i]
      const d = Math.hypot(ex, ey) || 1e-9
      const rest = (r[i] + r[j]) * 1.15 + gapBetween(r[i], r[j])
      if (d <= rest) continue
      const f = ((d - rest) * 0.08 * (1 + Math.log2(count))) / d
      dx[i] += ex * f
      dy[i] += ey * f
      dx[j] -= ex * f
      dy[j] -= ey * f
    }
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const ex = x[j] - x[i]
        const ey = y[j] - y[i]
        const d = Math.hypot(ex, ey) || 1e-9
        const min = r[i] + r[j] + gapBetween(r[i], r[j])
        const push = d < min ? (min - d) * 0.5 : (0.0015 * min * min) / (d * d)
        dx[i] -= (ex / d) * push
        dy[i] -= (ey / d) * push
        dx[j] += (ex / d) * push
        dy[j] += (ey / d) * push
      }
    }
    for (let i = 0; i < n; i += 1) {
      const step = Math.hypot(dx[i], dy[i])
      const scale = step > cool ? cool / step : 1
      x[i] += dx[i] * scale
      y[i] += dy[i] * scale
    }
  }

  // Landscape, like the screens the map is read on: stretch the centres
  // across until the map is about 1.6 times as wide as it is tall. Moving
  // centres apart never makes two discs overlap.
  {
    let minCx = Infinity
    let maxCx = -Infinity
    let minCy = Infinity
    let maxCy = -Infinity
    let meanX = 0
    for (let i = 0; i < n; i += 1) {
      minCx = Math.min(minCx, x[i] - r[i])
      maxCx = Math.max(maxCx, x[i] + r[i])
      minCy = Math.min(minCy, y[i] - r[i])
      maxCy = Math.max(maxCy, y[i] + r[i])
      meanX += x[i] / n
    }
    const stretch = Math.max(1, Math.min(2.5, (1.6 * (maxCy - minCy)) / Math.max(1e-9, maxCx - minCx)))
    for (let i = 0; i < n; i += 1) x[i] = meanX + (x[i] - meanX) * stretch
  }

  // A last pass that only separates, so no two nebulae overlap.
  for (let it = 0; it < 200; it += 1) {
    let moved = false
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const ex = x[j] - x[i]
        const ey = y[j] - y[i]
        const d = Math.hypot(ex, ey) || 1e-9
        const min = r[i] + r[j] + gapBetween(r[i], r[j])
        if (d >= min) continue
        const push = (min - d) / 2 + 1e-6
        x[i] -= (ex / d) * push
        y[i] -= (ey / d) * push
        x[j] += (ex / d) * push
        y[j] += (ey / d) * push
        moved = true
      }
    }
    if (!moved) break
  }

  // Normalise into [margin, 1 - margin], keeping the aspect.
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < n; i += 1) {
    minX = Math.min(minX, x[i] - r[i])
    minY = Math.min(minY, y[i] - r[i])
    maxX = Math.max(maxX, x[i] + r[i])
    maxY = Math.max(maxY, y[i] + r[i])
  }
  const MARGIN = 0.02
  const span = Math.max(maxX - minX, maxY - minY, 1e-9)
  const scale = (1 - 2 * MARGIN) / span
  const offX = MARGIN + ((1 - 2 * MARGIN) - (maxX - minX) * scale) / 2
  const offY = MARGIN + ((1 - 2 * MARGIN) - (maxY - minY) * scale) / 2
  sorted.forEach((nebula, i) => {
    out.set(nebula.id, { x: offX + (x[i] - minX) * scale, y: offY + (y[i] - minY) * scale, r: r[i] * scale })
  })
  return out
}

/**
 * `count` stars spread evenly over a nebula's disc: a golden-angle (Vogel)
 * spiral, which gives every star about the same room, shaken by a seeded
 * jitter so no spiral arms or rows show. Star 0 sits nearest the middle.
 */
export function scatterStars(count: number, nebula: Placement, seed: number): [number, number][] {
  const rand = seededRandom(seed)
  if (count === 1) return [[nebula.x, nebula.y]]
  const spacing = nebula.r * Math.sqrt(Math.PI / Math.max(1, count))
  const phase = rand() * Math.PI * 2
  const out: [number, number][] = []
  for (let k = 0; k < count; k += 1) {
    const rho = 0.86 * nebula.r * Math.sqrt((k + 0.5) / count)
    const theta = phase + k * GOLDEN_ANGLE
    let px = rho * Math.cos(theta) + (rand() - 0.5) * 0.3 * spacing
    let py = rho * Math.sin(theta) + (rand() - 0.5) * 0.3 * spacing
    const d = Math.hypot(px, py)
    const limit = 0.94 * nebula.r
    if (d > limit) {
      px *= limit / d
      py *= limit / d
    }
    out.push([nebula.x + px, nebula.y + py])
  }
  return out
}

/**
 * The whole map: nebulae from their links, then each nebula's stars in
 * their own order (lowest `order` in the middle).
 */
export function layoutStarMap(
  nebulae: readonly LayoutNebula[],
  stars: readonly { unitId: string; nebulaId: string; order: number }[],
  links: readonly LayoutLink[],
  seed: number,
): { nebulae: Map<string, Placement>; stars: Map<string, { x: number; y: number }> } {
  const placed = layoutNebulae(nebulae, links, seed)
  const positions = new Map<string, { x: number; y: number }>()
  const byNebula = new Map<string, { unitId: string; order: number }[]>()
  for (const star of stars) {
    const list = byNebula.get(star.nebulaId) ?? []
    list.push(star)
    byNebula.set(star.nebulaId, list)
  }
  let salt = 1
  for (const nebula of [...nebulae].sort((a, b) => a.order - b.order)) {
    const place = placed.get(nebula.id)
    const members = (byNebula.get(nebula.id) ?? []).sort((a, b) => a.order - b.order || (a.unitId < b.unitId ? -1 : 1))
    salt += 1
    if (!place) continue
    scatterStars(members.length, place, seed * 31 + salt).forEach(([sx, sy], k) => {
      positions.set(members[k].unitId, { x: sx, y: sy })
    })
  }
  return { nebulae: placed, stars: positions }
}
