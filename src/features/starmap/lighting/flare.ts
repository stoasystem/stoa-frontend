/*
 * The lighting animation (#51), one frame at a time, in Canvas 2D: drawn on
 * the lighting layer's own canvas, above the map, around one star.
 *
 *   0 - 600 ms     gathering: twelve sparks spiral in to the star;
 *   600 ms         ignition: a white-gold bloom swells from the star;
 *   600 - 2000 ms  a ring of light spreads and thins out, a four-point
 *                  glint turns a little and fades, eight motes drift out.
 *
 * Pure: the same time gives the same frame, so a test can draw any instant.
 * Colours are the sky's `--lit` and `--lit-core` tokens.
 */

export const FLARE_MS = 2000
const GATHER_MS = 600

export type FlareColors = { lit: string; core: string }

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t * t

/** The size the flare is laid out on: the glyph, never under 18 px, so a star of the panorama still shows it. */
export function flareBase(glyphSize: number): number {
  return Math.max(18, Math.min(64, glyphSize))
}

/**
 * Draws the flare `elapsed` ms in, centred on (`x`, `y`). The caller clears
 * the canvas. Returns false once the flare is over.
 */
export function drawFlare(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  x: number,
  y: number,
  base: number,
  colors: FlareColors,
): boolean {
  if (elapsed >= FLARE_MS || elapsed < 0) return elapsed < 0
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  // Gathering: sparks spiral in and fade into the star.
  if (elapsed < GATHER_MS) {
    const t = elapsed / GATHER_MS
    const from = base * 3.2
    for (let i = 0; i < 12; i += 1) {
      const lag = (i % 4) * 0.06
      const local = clamp01((t - lag) / (1 - lag))
      if (local <= 0) continue
      const r = from * (1 - easeIn(local))
      const angle = (i / 12) * Math.PI * 2 + local * 1.4
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      dot(ctx, px, py, 1.4 + local * 1.2, colors.lit, 0.35 + 0.6 * local)
    }
    // The star itself warms up as they arrive.
    glow(ctx, x, y, base * (0.6 + 0.5 * t), colors, 0.25 + 0.45 * t)
  } else {
    const t = (elapsed - GATHER_MS) / (FLARE_MS - GATHER_MS)

    // Ignition bloom: quick to swell, slower to settle.
    const bloom = t < 0.12 ? easeOut(t / 0.12) : 1 - easeOut((t - 0.12) / 0.88)
    glow(ctx, x, y, base * (1.1 + 1.6 * bloom), colors, 0.35 + 0.65 * bloom)

    // The ring spreads and thins out.
    const ring = easeOut(t)
    const ringAlpha = (1 - t) ** 1.6
    ctx.beginPath()
    ctx.arc(x, y, base * (0.7 + 3.1 * ring), 0, Math.PI * 2)
    ctx.strokeStyle = colors.lit
    ctx.globalAlpha = 0.85 * ringAlpha
    ctx.lineWidth = Math.max(0.75, 3.2 * (1 - t))
    ctx.stroke()

    // The four-point glint.
    const glint = t < 0.15 ? easeOut(t / 0.15) : 1 - easeOut(clamp01((t - 0.15) / 0.6))
    if (glint > 0) {
      const spin = Math.PI / 4 + t * 0.35
      for (let k = 0; k < 4; k += 1) ray(ctx, x, y, spin + (k * Math.PI) / 2, base * (1.4 + 1.8 * glint), base * 0.12, colors, glint)
      for (let k = 0; k < 4; k += 1) ray(ctx, x, y, spin + Math.PI / 4 + (k * Math.PI) / 2, base * 0.9 * glint, base * 0.08, colors, glint * 0.6)
    }

    // Motes drift out and go out.
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2 + 0.3
      const r = base * (0.9 + 3.4 * easeOut(t) * (0.8 + 0.25 * (i % 3)))
      dot(ctx, x + Math.cos(angle) * r, y + Math.sin(angle) * r, 1.6 * (1 - t) + 0.4, colors.core, (1 - t) * 0.9)
    }
  }
  ctx.restore()
  return true
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.globalAlpha = clamp01(alpha)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colors: FlareColors, alpha: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
  gradient.addColorStop(0, colors.core)
  gradient.addColorStop(0.25, colors.lit)
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.globalAlpha = clamp01(alpha)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function ray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  colors: FlareColors,
  alpha: number,
) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const gradient = ctx.createLinearGradient(x, y, x + dx * length, y + dy * length)
  gradient.addColorStop(0, colors.core)
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.globalAlpha = clamp01(alpha)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(x - dy * width, y + dx * width)
  ctx.lineTo(x + dx * length, y + dy * length)
  ctx.lineTo(x + dy * width, y - dx * width)
  ctx.closePath()
  ctx.fill()
}
