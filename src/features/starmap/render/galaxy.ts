/** Decorative, seeded sky. Painted once per viewport/theme, never counted as learning stars. */
import { seededRandom } from '@/features/starmap/layout/layout'
import type { SceneData, StarMapTheme } from '@/features/starmap/render/types'

export const KNOWLEDGE_GLOW_ALPHA = 0.14
export const SKY_MIST_ALPHA = 0.04

export const GALAXY = { mist: '#B9C4D9', violet: '#8A7FAA' } as const

export function paintGalaxy(ctx: CanvasRenderingContext2D, width: number, height: number, theme: StarMapTheme) {
  ctx.fillStyle = theme.sky
  ctx.fillRect(0, 0, width, height)
  const mist = ctx.createRadialGradient(width * 0.6, height * 0.4, 0, width * 0.6, height * 0.4, Math.max(width, height))
  mist.addColorStop(0, GALAXY.mist)
  mist.addColorStop(1, GALAXY.violet)
  ctx.globalAlpha = SKY_MIST_ALPHA
  ctx.fillStyle = mist
  ctx.fillRect(0, 0, width, height)
  const random = seededRandom(10976)
  const stars = Math.min(9000, Math.round(width * height / 110))
  for (let i = 0; i < stars; i += 1) {
    ctx.globalAlpha = 0.12 + random() ** 3 * 0.65
    ctx.fillStyle = theme.text
    ctx.beginPath()
    ctx.arc(random() * width, random() * height, 0.2 + random() ** 5 * 1.1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** The glow is stamped at actual knowledge coordinates and travels with those stars. */
export function paintKnowledgeGlow(ctx: CanvasRenderingContext2D, brush: HTMLCanvasElement, warm: HTMLCanvasElement,
  data: SceneData, size: number, theme: StarMapTheme) {
  const b = brush.getContext('2d')
  if (!b) return
  const gradient = b.createRadialGradient(48, 48, 0, 48, 48, 48)
  gradient.addColorStop(0, GALAXY.mist)
  gradient.addColorStop(0.35, GALAXY.violet)
  gradient.addColorStop(1, `${GALAXY.mist}00`)
  b.fillStyle = gradient
  b.fillRect(0, 0, 96, 96)
  const w = warm.getContext('2d')
  if (w) {
    const gold = w.createRadialGradient(48, 48, 0, 48, 48, 48)
    gold.addColorStop(0, theme.lit)
    gold.addColorStop(1, 'transparent')
    w.fillStyle = gold
    w.fillRect(0, 0, 96, 96)
  }
  const random = seededRandom(10976 + data.count)
  for (let i = 0; i < data.count; i += 1) {
    const x = data.mapX[i] * size, y = data.mapY[i] * size
    const reach = 80 + random() * 170
    ctx.globalAlpha = 0.06
    ctx.drawImage(data.state[i] <= 1 ? warm : brush, x - reach / 2, y - reach / 2, reach, reach)
  }
  // Irregular transparent cuts break up the glow into dust clouds; no solid contour.
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < data.count; i += 3) {
    const x = data.mapX[i] * size, y = data.mapY[i] * size
    if (Math.sin(data.mapX[i] * 29 + Math.sin(data.mapY[i] * 31) * 3) < 0.15) continue
    const reach = 35 + random() * 110
    ctx.globalAlpha = 0.35
    ctx.drawImage(brush, x - reach / 2, y - reach / 5, reach, reach / 2.5)
  }
  ctx.globalCompositeOperation = 'source-over'
  // Fine stellar grain follows the actual knowledge density, including after pan/zoom.
  for (let i = 0; i < data.count * 40; i += 1) {
    const at = i % data.count
    const x = data.mapX[at] * size + (random() + random() - 1) * 42
    const y = data.mapY[at] * size + (random() + random() - 1) * 42
    ctx.globalAlpha = 0.3 + random() * 0.65
    ctx.fillStyle = i % 5 ? theme.text : theme.lit
    ctx.beginPath()
    ctx.arc(x, y, 0.25 + random() ** 4 * 1.15, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
