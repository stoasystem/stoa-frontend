/*
 * The star map laid out in 2D (#72 point 4, #119), the way stoa-backend#60
 * will do it offline: one sky, each subject a galaxy along a band, each
 * galaxy's nebulae placed by their relation graph so related topics sit close
 * together, and each nebula's stars gathered into a cloud, never on a grid.
 * The output is normalised: every nebula and star lies in [0, 1] on both
 * axes.
 *
 * The front end only needs this for its fixtures until #60 lands; the real
 * map arrives with its coordinates. Everything is seeded, so the same input
 * gives the same map on the same JavaScript engine. Across engines it may
 * not: the force layout runs hundreds of iterations of Math.sqrt / log2 /
 * sin / cos, and JavaScript does not promise transcendental functions agree
 * to the last bit between engines, so small differences can grow. That is
 * why the backend computes the layout once, offline, and stores the
 * coordinates (#60) instead of every device laying the map out itself.
 */

export type LayoutNebula = { id: string; order: number; size: number }
export type LayoutLink = { a: string; b: string; count: number }
export type Placement = { x: number; y: number; r: number }

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** mulberry32: small, fast, integer-only, so the same sequence on every engine. */
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

/*
 * One sky (#119, ADR 0001): every subject a galaxy, laid out one after
 * another along a horizontal band, each galaxy made of its nebulae.
 *
 *   - x runs across the whole band in [0, 1]; the band is centred on
 *     y = 0.5 and only as tall as the galaxies need, so map units stay
 *     square. The band starts and ends with half a gap, so when #120 wraps it
 *     (x mod 1) the seam is one more gap between two galaxies, no different
 *     from the others.
 *   - Galaxies follow the given order (see `galaxyOrder`), with a dark gap
 *     between neighbours (`GALAXY_GAP` of the tallest galaxy's height) far
 *     wider than the dark between two nebulae of one galaxy.
 *   - Inside a galaxy the nebulae are placed by `layoutNebulae` (related
 *     topics close), each as large as its star count asks (one density across
 *     the sky), then drawn together round the galaxy's middle, harder up and
 *     down, so a galaxy lies along the band.
 *   - Inside a nebula the stars form a cloud, not a disc: a few seeded
 *     clumps, densest at the core and thinning outwards, squashed and turned
 *     by the nebula's own seed, so each nebula has a shape of its own. Low
 *     `order` sits nearer the core (with some mixing), so a nebula being lit
 *     up brightens from its core outwards.
 */

export type SkyGalaxyInput = { id: string; nebulae: LayoutNebula[] }
export type GalaxyBox = { x0: number; x1: number; y0: number; y1: number }
export type SkyLayout = {
  galaxies: Map<string, GalaxyBox>
  nebulae: Map<string, Placement>
  stars: Map<string, { x: number; y: number }>
}

/** Gap between two galaxies, in heights of the tallest galaxy; half of it at either end of the band. */
export const GALAXY_GAP = 0.6

/**
 * A seam-friendly order for the band: the first galaxy, then always the one
 * with the most cross-subject prerequisites to the last one placed (ties
 * keep the given order). Galaxies sharing prerequisites end up neighbours;
 * once the band wraps, the last is also the first one's neighbour.
 */
export function galaxyOrder(ids: readonly string[], crossLinks: readonly { a: string; b: string; count: number }[]): string[] {
  if (ids.length === 0) return []
  const weight = (a: string, b: string) =>
    crossLinks.reduce((sum, link) => sum + ((link.a === a && link.b === b) || (link.a === b && link.b === a) ? link.count : 0), 0)
  const order = [ids[0]]
  const rest = ids.slice(1)
  while (rest.length > 0) {
    const last = order[order.length - 1]
    let best = 0
    for (let i = 1; i < rest.length; i += 1) if (weight(last, rest[i]) > weight(last, rest[best])) best = i
    order.push(rest.splice(best, 1)[0])
  }
  return order
}

/** A standard normal pair from two uniforms (Box-Muller). */
function gaussian(rand: () => number): [number, number] {
  const u = Math.max(1e-9, rand())
  const v = rand()
  const m = Math.sqrt(-2 * Math.log(u))
  return [m * Math.cos(2 * Math.PI * v), m * Math.sin(2 * Math.PI * v)]
}

/**
 * `count` stars as one nebula's cloud inside the disc `nebula`: a main
 * clump and one to three smaller ones, Gaussian, squashed and turned by the
 * seed; star 0 nearest the core. No two stars closer than 0.4 of the
 * typical spacing, so none collide on screen.
 */
export function cloudStars(count: number, nebula: Placement, seed: number): [number, number][] {
  const rand = seededRandom(seed)
  if (count <= 0) return []
  if (count === 1) return [[nebula.x, nebula.y]]
  const r = nebula.r
  const squash = 0.5 + rand() * 0.45
  const turn = rand() * Math.PI
  const clumps: { x: number; y: number; s: number; w: number }[] = [{ x: 0, y: 0, s: 0.42, w: 1 }]
  const extra = 1 + Math.floor(rand() * 3)
  for (let c = 0; c < extra; c += 1) {
    const angle = rand() * Math.PI * 2
    const at = 0.3 + rand() * 0.3
    clumps.push({ x: Math.cos(angle) * at, y: Math.sin(angle) * at, s: 0.2 + rand() * 0.14, w: 0.25 + rand() * 0.35 })
  }
  const total = clumps.reduce((sum, clump) => sum + clump.w, 0)
  const px: number[] = []
  const py: number[] = []
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  while (px.length < count) {
    let pick = rand() * total
    let clump = clumps[0]
    for (const candidate of clumps) {
      pick -= candidate.w
      if (pick <= 0) {
        clump = candidate
        break
      }
    }
    const [gx, gy] = gaussian(rand)
    const lx = clump.x + gx * clump.s
    const ly = (clump.y + gy * clump.s) * squash
    if (Math.hypot(lx, ly) > 0.95) continue
    px.push((lx * cos - ly * sin) * r)
    py.push((lx * sin + ly * cos) * r)
  }
  const spacing = r * Math.sqrt(Math.PI / count)
  const minGap = 0.35 * spacing
  const limit = 0.94 * r
  for (let round = 0; round < 4; round += 1) {
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const dx = px[j] - px[i]
        const dy = py[j] - py[i]
        if (Math.abs(dx) >= minGap || Math.abs(dy) >= minGap) continue
        const d = Math.hypot(dx, dy) || 1e-9
        if (d >= minGap) continue
        const push = (minGap - d) / 2
        px[i] -= (dx / d) * push
        py[i] -= (dy / d) * push
        px[j] += (dx / d) * push
        py[j] += (dy / d) * push
      }
    }
    for (let k = 0; k < count; k += 1) {
      const d = Math.hypot(px[k], py[k])
      if (d > limit) {
        px[k] *= limit / d
        py[k] *= limit / d
      }
    }
  }
  // Nearest the core first, with a little mixing, so a lit core has no hard rim.
  const rank = px.map((x, k) => ({ k, key: Math.hypot(x, py[k]) / r + (rand() - 0.5) * 0.35 }))
  rank.sort((a, b) => a.key - b.key)
  return rank.map(({ k }) => [nebula.x + px[k], nebula.y + py[k]])
}

/**
 * The whole sky. `galaxies` in band order (`galaxyOrder`); `links` between
 * nebulae (only those inside one galaxy shape its layout); `stars` with
 * their nebula and order.
 */
export function layoutSky(
  galaxies: readonly SkyGalaxyInput[],
  stars: readonly { unitId: string; nebulaId: string; order: number }[],
  links: readonly LayoutLink[],
  seed: number,
): SkyLayout {
  // Each galaxy on its own: nebulae by their relations, then drawn together
  // round their middle (harder up and down, so a galaxy lies along the
  // band) until neighbouring discs touch, never overlap -- their clouds thin
  // out well inside their discs, so the dark between them stays.
  const local = galaxies.map((galaxy, g) => {
    const own = new Set(galaxy.nebulae.map((nebula) => nebula.id))
    const placed = [...layoutNebulae(galaxy.nebulae, links.filter((link) => own.has(link.a) && own.has(link.b)), seed * 7 + g)]
    const size = new Map(galaxy.nebulae.map((nebula) => [nebula.id, Math.max(1, nebula.size)]))
    // One star density across the sky: a nebula's radius follows its star count alone.
    const unit = placed.reduce((sum, [id, p]) => sum + p.r / Math.sqrt(size.get(id)!), 0) / Math.max(1, placed.length)
    const nodes = placed.map(([id, p]) => ({ id, x: p.x / unit, y: p.y / unit, r: Math.sqrt(size.get(id)!) * 1.25 }))
    const separate = () => {
      let moved = false
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const d = Math.hypot(dx, dy) || 1e-9
          const min = nodes[i].r + nodes[j].r
          if (d >= min) continue
          const push = (min - d) / 2 + 1e-9
          nodes[i].x -= (dx / d) * push
          nodes[i].y -= (dy / d) * push
          nodes[j].x += (dx / d) * push
          nodes[j].y += (dy / d) * push
          moved = true
        }
      }
      return moved
    }
    for (let it = 0; it < 160; it += 1) {
      const cx = nodes.reduce((sum, p) => sum + p.x, 0) / nodes.length
      const cy = nodes.reduce((sum, p) => sum + p.y, 0) / nodes.length
      for (const p of nodes) {
        p.x += (cx - p.x) * 0.03
        p.y += (cy - p.y) * 0.07
      }
      separate()
    }
    for (let it = 0; it < 200 && separate(); it += 1);
    const x0 = Math.min(...nodes.map((p) => p.x - p.r))
    const x1 = Math.max(...nodes.map((p) => p.x + p.r))
    const y0 = Math.min(...nodes.map((p) => p.y - p.r))
    const y1 = Math.max(...nodes.map((p) => p.y + p.r))
    return { nodes, x0, x1, y0, y1 }
  })
  // Along the band, with a wide dark gap between neighbours and half a gap at each end.
  const tallest = Math.max(1e-9, ...local.map((l) => l.y1 - l.y0))
  const gap = GALAXY_GAP * tallest
  const length = local.reduce((sum, l) => sum + (l.x1 - l.x0) + gap, 0) || 1
  const k = 1 / length
  const out: SkyLayout = { galaxies: new Map(), nebulae: new Map(), stars: new Map() }
  let cursor = gap / 2
  galaxies.forEach((galaxy, g) => {
    const l = local[g]
    const dx = cursor - l.x0
    const dy = -(l.y0 + l.y1) / 2
    for (const p of l.nodes) out.nebulae.set(p.id, { x: (p.x + dx) * k, y: 0.5 + (p.y + dy) * k, r: p.r * k })
    out.galaxies.set(galaxy.id, { x0: cursor * k, x1: (cursor + l.x1 - l.x0) * k, y0: 0.5 + (l.y0 + dy) * k, y1: 0.5 + (l.y1 + dy) * k })
    cursor += l.x1 - l.x0 + gap
  })

  const byNebula = new Map<string, { unitId: string; order: number }[]>()
  for (const star of stars) {
    const list = byNebula.get(star.nebulaId) ?? []
    list.push(star)
    byNebula.set(star.nebulaId, list)
  }
  let salt = 1
  for (const galaxy of galaxies) {
    for (const nebula of [...galaxy.nebulae].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1))) {
      salt += 1
      const place = out.nebulae.get(nebula.id)
      if (!place) continue
      const members = (byNebula.get(nebula.id) ?? []).sort((a, b) => a.order - b.order || (a.unitId < b.unitId ? -1 : 1))
      cloudStars(members.length, place, seed * 31 + salt).forEach(([sx, sy], k) => out.stars.set(members[k].unitId, { x: sx, y: sy }))
    }
  }
  return out
}
