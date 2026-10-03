/*
 * The sky's light (#110's star-light, kept; laid out as galaxies and
 * nebulae by #119). All of it is decoration -- never a learning star, never
 * a click target -- and all of it is painted once into cached canvases:
 *
 *   - the sky behind everything: a faint mist and sparse star dust, per
 *     viewport (`paintGalaxy`);
 *   - each galaxy's haze in its base tint, faint, so a galaxy reads as one
 *     thing and the gap to the next stays dark (`paintGalaxyHaze`);
 *   - each nebula's cloud in its own tint, painted from its actual stars:
 *     brightest and densest at the core, thinning outwards, its edge
 *     dissolving into the dark, broken by a few dust lanes, with fine grain
 *     (`paintNebulaCloud`). Lit stars warm the core; the renderer draws the
 *     whole cloud brighter the larger its lit share.
 *
 * Tints run from blue-violet through silver to warm gold, never a rainbow
 * (#117 B2).
 */
import { seededRandom } from '@/features/starmap/layout/layout'
import type { SceneData, StarMapTheme } from '@/features/starmap/render/types'

export const SKY_MIST_ALPHA = 0.04

/** A nebula's cloud is drawn at `base`, plus `lit` times its lit share (#117: a nebula brightens as it is lit). */
export const NEBULA_GLOW = { base: 0.1, lit: 0.06 } as const

/** A galaxy's haze, under its nebulae. */
export const GALAXY_HAZE_ALPHA = 0.04

/**
 * The brightest the sky's light can stack to anywhere: a galaxy's haze under
 * a fully lit nebula's core. `starmapContrast` checks names, lines and a
 * locked star against white at this alpha, an upper bound of the real light.
 */
export const KNOWLEDGE_GLOW_ALPHA = GALAXY_HAZE_ALPHA + NEBULA_GLOW.base + NEBULA_GLOW.lit

/** How far a nebula's cloud tile reaches past its disc, in disc radii. */
export const CLOUD_REACH = 1.35

export const GALAXY = { mist: '#B9C4D9', violet: '#8A7FAA' } as const

/** Blue-violet, silver, warm gold: the only colours a cloud is tinted with. */
const TINT_STOPS: readonly [number, number, number][] = [
  [146, 136, 214],
  [196, 204, 228],
  [232, 200, 142],
]

/** A tint, 0 blue-violet .. 0.5 silver .. 1 warm gold, as `rgb()`. */
export function tintColour(t: number): string {
  const x = Math.max(0, Math.min(1, t)) * (TINT_STOPS.length - 1)
  const i = Math.min(TINT_STOPS.length - 2, Math.floor(x))
  const f = x - i
  const [a, b] = [TINT_STOPS[i], TINT_STOPS[i + 1]]
  const mix = (k: number) => Math.round(a[k] + (b[k] - a[k]) * f)
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`
}

/** `#RRGGBB` or `rgb(r, g, b)` at an alpha. */
function rgba(colour: string, alpha: number): string {
  const value = colour.trim()
  const parts = value.startsWith('#')
    ? [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16))
    : (value.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255])
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
}

/** The sky: flat, a faint mist, and star dust (sparse in one sky, so the gaps between nebulae stay dark). */
export function paintGalaxy(ctx: CanvasRenderingContext2D, width: number, height: number, theme: StarMapTheme, sparse = false) {
  ctx.fillStyle = theme.sky
  ctx.fillRect(0, 0, width, height)
  const mist = ctx.createRadialGradient(width * 0.6, height * 0.4, 0, width * 0.6, height * 0.4, Math.max(width, height))
  mist.addColorStop(0, GALAXY.mist)
  mist.addColorStop(1, GALAXY.violet)
  ctx.globalAlpha = SKY_MIST_ALPHA
  ctx.fillStyle = mist
  ctx.fillRect(0, 0, width, height)
  const random = seededRandom(10976)
  const stars = Math.min(9000, Math.round((width * height) / (sparse ? 300 : 110)))
  for (let i = 0; i < stars; i += 1) {
    ctx.globalAlpha = (sparse ? 0.08 : 0.12) + random() ** 3 * (sparse ? 0.5 : 0.65)
    ctx.fillStyle = theme.text
    ctx.beginPath()
    ctx.arc(random() * width, random() * height, 0.2 + random() ** 5 * 1.1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** A soft round brush, `colour` at its middle fading to nothing at its rim. */
function brush(canvas: HTMLCanvasElement, colour: string, middle = 0.45): HTMLCanvasElement {
  const b = canvas.getContext('2d')
  if (!b) return canvas
  const s = canvas.width / 2
  const gradient = b.createRadialGradient(s, s, 0, s, s, s)
  gradient.addColorStop(0, rgba(colour, 1))
  gradient.addColorStop(0.35, rgba(colour, middle))
  gradient.addColorStop(1, rgba(colour, 0))
  b.fillStyle = gradient
  b.fillRect(0, 0, s * 2, s * 2)
  return canvas
}

function gaussian(random: () => number): number {
  return (random() + random() + random() - 1.5) / 0.5
}

type MakeCanvas = (width: number, height: number) => HTMLCanvasElement

/**
 * One nebula's cloud, painted into a square tile of `size` device px that
 * covers its disc out to `CLOUD_REACH` radii. Built from the nebula's own
 * stars, so its shape is theirs.
 */
export function paintNebulaCloud(ctx: CanvasRenderingContext2D, size: number, data: SceneData, index: number, theme: StarMapTheme,
  makeCanvas: MakeCanvas) {
  const nebula = data.nebulae[index]
  const reach = nebula.r * CLOUD_REACH
  const k = size / (2 * reach)
  const tx = (x: number) => (x - nebula.x) * k + size / 2
  const ty = (y: number) => (y - nebula.y) * k + size / 2
  const members: number[] = []
  for (let i = 0; i < data.count; i += 1) if (data.nebula[i] === index) members.push(i)
  const n = Math.max(1, members.length)
  const random = seededRandom(7703 + index * 131 + n)
  const tint = tintColour(nebula.tint ?? 0.3)
  const cool = brush(makeCanvas(64, 64), tint)
  const warm = brush(makeCanvas(64, 64), theme.lit, 0.35)
  const r = nebula.r * k

  // The body: one soft stamp per star; where they crowd, the core.
  const each = Math.min(0.7, 14 / n)
  for (const i of members) {
    const radius = (0.26 + random() * 0.12) * r
    ctx.globalAlpha = each
    ctx.drawImage(cool, tx(data.mapX[i]) - radius, ty(data.mapY[i]) - radius, radius * 2, radius * 2)
  }
  // Lit (and half-lit) stars warm it from within.
  for (const i of members) {
    if (data.state[i] > 1) continue
    const radius = (0.17 + random() * 0.08) * r
    ctx.globalAlpha = Math.min(0.6, each * (data.state[i] === 0 ? 1.4 : 0.8))
    ctx.drawImage(warm, tx(data.mapX[i]) - radius, ty(data.mapY[i]) - radius, radius * 2, radius * 2)
  }
  // A few dark lanes, so the cloud is never a smooth blob.
  ctx.globalCompositeOperation = 'destination-out'
  const lanes = 2 + Math.floor(random() * 3)
  for (let l = 0; l < lanes; l += 1) {
    const at = members[Math.floor(random() * members.length)] ?? members[0]
    if (at === undefined) break
    ctx.save()
    ctx.translate(tx(data.mapX[at]) + gaussian(random) * r * 0.15, ty(data.mapY[at]) + gaussian(random) * r * 0.15)
    ctx.rotate(random() * Math.PI)
    const length = (0.35 + random() * 0.35) * r
    ctx.globalAlpha = 0.28 + random() * 0.2
    ctx.drawImage(cool, -length, -length * 0.12, length * 2, length * 0.24)
    ctx.restore()
  }
  ctx.globalCompositeOperation = 'source-over'
  // Fine grain, following the stars' density (#110's stellar grain).
  const grain = Math.min(2600, 700 + 8 * n)
  const dot = size / 512
  const spread = r * 0.17
  for (let g = 0; g < grain; g += 1) {
    const at = members[Math.floor(random() * members.length)] ?? members[0]
    if (at === undefined) break
    const x = tx(data.mapX[at]) + gaussian(random) * spread
    const y = ty(data.mapY[at]) + gaussian(random) * spread
    ctx.globalAlpha = 0.3 + random() * 0.65
    ctx.fillStyle = g % 5 === 0 ? theme.lit : g % 3 === 0 ? tint : theme.text
    ctx.beginPath()
    ctx.arc(x, y, (0.45 + random() ** 4 * 1.5) * dot, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** Where a galaxy's haze canvas sits, map units: its box with room for the haze to fade. */
export function galaxyHazeBox(galaxy: NonNullable<SceneData['galaxies']>[number]) {
  const margin = (galaxy.y1 - galaxy.y0) * 0.35
  return { x0: galaxy.x0 - margin, y0: galaxy.y0 - margin, x1: galaxy.x1 + margin, y1: galaxy.y1 + margin }
}

/** One galaxy's haze, `width` device px wide, in its base tint, with sparse dust between its nebulae. */
export function paintGalaxyHaze(ctx: CanvasRenderingContext2D, width: number, data: SceneData, index: number,
  theme: StarMapTheme, makeCanvas: MakeCanvas) {
  const galaxy = data.galaxies?.[index]
  if (!galaxy) return
  const box = galaxyHazeBox(galaxy)
  const k = width / (box.x1 - box.x0)
  const random = seededRandom(5309 + index * 17)
  const tint = tintColour(galaxy.tint)
  const soft = brush(makeCanvas(64, 64), tint, 0.3)
  for (const n of galaxy.nebulae) {
    const nebula = data.nebulae[n]
    const radius = nebula.r * 1.9 * k
    ctx.globalAlpha = 0.45
    ctx.drawImage(soft, (nebula.x - box.x0) * k - radius, (nebula.y - box.y0) * k - radius, radius * 2, radius * 2)
  }
  // Sparse dust between the nebulae: a galaxy is more than its clouds, but the gaps stay dark.
  const dust = Math.round(width * 0.45)
  for (let d = 0; d < dust; d += 1) {
    const nebula = data.nebulae[galaxy.nebulae[Math.floor(random() * galaxy.nebulae.length)]]
    if (!nebula) break
    const x = (nebula.x - box.x0) * k + gaussian(random) * nebula.r * k * 1.1
    const y = (nebula.y - box.y0) * k + gaussian(random) * nebula.r * k * 0.9
    ctx.globalAlpha = 0.4 + random() * 0.6
    ctx.fillStyle = d % 4 === 0 ? tint : theme.text
    ctx.beginPath()
    ctx.arc(x, y, (0.5 + random() ** 4 * 1.4) * (width / 1024), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
