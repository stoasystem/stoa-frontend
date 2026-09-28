/*
 * The Canvas 2D renderer (#11 point 1): every glyph is drawn once into a
 * sprite, and a frame is one `drawImage` per visible point. The research
 * branch measured this at the refresh-rate cap with 2000 points on a desktop
 * GPU, where SVG with per-point glow managed 0.8 fps.
 *
 * Only the few things that differ point by point are drawn live: the progress
 * arc of a point in progress, the recommendation's dashed ring, the review
 * pip, and names.
 */
import { geoGraticule, geoPath, geoRotation, type GeoPath, type GeoPermissibleObjects } from 'd3-geo'
import type { Viewport } from '@/features/planet/geo/projection'
import { GLYPH_LARGE, GLYPH_SMALL, SMALL_CUT_BELOW, starPath, type GlyphCut } from '@/features/planet/render/glyph'
import {
  STATE_IN_PROGRESS,
  STATE_LIT,
  STATE_LOCKED,
  STATE_READY,
  type PlanetRenderer,
  type PlanetTheme,
  type SceneData,
} from '@/features/planet/render/types'

type Sprite = { canvas: HTMLCanvasElement; /** Half the sprite's side, in cut units. */ extent: number }

/** `#RRGGBB`, `#RGB`, `rgb()` or `rgba()` with its alpha multiplied by `alpha`. */
export function withAlpha(color: string, alpha: number): string {
  const value = color.trim()
  let r = 255
  let g = 255
  let b = 255
  let a = 1
  if (value.startsWith('#')) {
    const hex = value.length === 4 ? value.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') : value
    r = parseInt(hex.slice(1, 3), 16)
    g = parseInt(hex.slice(3, 5), 16)
    b = parseInt(hex.slice(5, 7), 16)
  } else {
    const parts = value.match(/[\d.]+/g)?.map(Number) ?? []
    if (parts.length >= 3) [r, g, b] = parts
    if (parts.length >= 4) a = parts[3]
  }
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a * alpha))})`
}

function createCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

/** A blurred disc as a radial gradient: the board's feGaussianBlur halo, without a filter. */
function halo(ctx: CanvasRenderingContext2D, r: number, sigma: number, color: string, alpha: number) {
  const outer = r + 2 * sigma
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outer)
  gradient.addColorStop(0, withAlpha(color, alpha))
  gradient.addColorStop(Math.max(0, (r - sigma) / outer), withAlpha(color, alpha * 0.92))
  gradient.addColorStop(r / outer, withAlpha(color, alpha * 0.5))
  gradient.addColorStop(1, withAlpha(color, 0))
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(0, 0, outer, 0, Math.PI * 2)
  ctx.fill()
}

function ring(ctx: CanvasRenderingContext2D, r: number, width: number, color: string, alpha: number) {
  ctx.strokeStyle = withAlpha(color, alpha)
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
}

function disc(ctx: CanvasRenderingContext2D, r: number, color: string, alpha = 1) {
  ctx.fillStyle = withAlpha(color, alpha)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawStateGlyph(ctx: CanvasRenderingContext2D, cut: GlyphCut, state: number, theme: PlanetTheme) {
  if (state === STATE_LIT) {
    const g = cut.lit
    halo(ctx, g.halo, g.blur, theme.lit, g.haloAlpha)
    ctx.fillStyle = withAlpha(theme.lit, g.starAlpha)
    ctx.fill(new Path2D(starPath(g.tip, g.waist)))
    ring(ctx, g.ring, g.ringWidth, theme.lit, g.ringAlpha)
    disc(ctx, g.core, theme.litCore)
  } else if (state === STATE_IN_PROGRESS) {
    const g = cut.inProgress
    halo(ctx, g.halo, g.blur, theme.lit, g.haloAlpha)
    ctx.fillStyle = withAlpha(theme.lit, g.starAlpha)
    ctx.fill(new Path2D(starPath(g.tip, g.waist)))
    ring(ctx, g.ring, g.ringWidth, theme.text, g.trackAlpha)
    disc(ctx, g.core, theme.litCore)
  } else if (state === STATE_READY) {
    const g = cut.ready
    ring(ctx, g.ring, g.ringWidth, theme.text, g.ringAlpha)
    disc(ctx, g.core, theme.text, g.coreAlpha)
  } else if (state === STATE_LOCKED) {
    const g = cut.locked
    ring(ctx, g.ring, g.ringWidth, theme.text, g.ringAlpha)
  }
}

function extentOf(cut: GlyphCut, state: number): number {
  if (state === STATE_LIT) return cut.lit.halo + 2 * cut.lit.blur + 1
  if (state === STATE_IN_PROGRESS) return cut.inProgress.halo + 2 * cut.inProgress.blur + 1
  if (state === STATE_READY) return cut.ready.ring + cut.ready.ringWidth + 1
  return cut.locked.ring + cut.locked.ringWidth + 1
}

/** Largest on-screen box each cut is drawn at, CSS px, before breathing. */
const LARGEST_BOX = { small: SMALL_CUT_BELOW, large: 96 } as const

function buildSprites(cut: GlyphCut, largestBox: number, dpr: number, theme: PlanetTheme): Sprite[] {
  const pixelsPerUnit = (largestBox * Math.max(2, dpr) * 1.14) / cut.box
  return [STATE_LIT, STATE_IN_PROGRESS, STATE_READY, STATE_LOCKED].map((state) => {
    const extent = extentOf(cut, state)
    const size = Math.max(4, Math.ceil(extent * 2 * pixelsPerUnit))
    const canvas = createCanvas(size)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.translate(size / 2, size / 2)
      ctx.scale(size / (extent * 2), size / (extent * 2))
      drawStateGlyph(ctx, cut, state, theme)
    }
    return { canvas, extent }
  })
}

function dotPattern(ctx: CanvasRenderingContext2D, dpr: number): CanvasPattern | null {
  // Canvas board: a 26 px grid of 0.9 px dots, white 9%.
  const step = Math.round(26 * dpr)
  const tile = createCanvas(step)
  const t = tile.getContext('2d')
  if (!t) return null
  t.fillStyle = 'rgba(255, 255, 255, 0.09)'
  t.beginPath()
  t.arc(2 * dpr, 2 * dpr, 0.9 * dpr, 0, Math.PI * 2)
  t.fill()
  const pattern = ctx.createPattern(tile, 'repeat')
  pattern?.setTransform?.(new DOMMatrix().scale(1 / dpr, 1 / dpr))
  return pattern
}

const GRATICULE: GeoPermissibleObjects = geoGraticule().step([20, 20])()

export function createCanvas2DRenderer(canvas: HTMLCanvasElement): PlanetRenderer | null {
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return null
  const ctx: CanvasRenderingContext2D = context

  let viewport: Viewport = { width: 0, height: 0 }
  let dpr = 1
  let theme: PlanetTheme | null = null
  let data: SceneData | null = null
  let sprites: { small: Sprite[]; large: Sprite[] } | null = null
  let pattern: CanvasPattern | null = null
  let snapshotCanvas: HTMLCanvasElement | null = null
  let path: GeoPath | null = null
  let pathProjection: unknown = null

  const rebuild = () => {
    if (!theme) return
    sprites = {
      small: buildSprites(GLYPH_SMALL, LARGEST_BOX.small, dpr, theme),
      large: buildSprites(GLYPH_LARGE, LARGEST_BOX.large, dpr, theme),
    }
    pattern = dotPattern(ctx, dpr)
  }

  const setFont = (px: number, weight: number) => {
    ctx.font = `${weight} ${px}px ${theme?.fontFamily ?? 'sans-serif'}`
  }

  const setLetterSpacing = (value: string) => {
    // Chrome 99+, Safari 18+; elsewhere the labels just sit a little tighter.
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = value
  }

  return {
    kind: 'canvas2d',

    resize(next, nextDpr) {
      viewport = next
      const dprChanged = nextDpr !== dpr
      dpr = nextDpr
      canvas.width = Math.max(1, Math.round(next.width * dpr))
      canvas.height = Math.max(1, Math.round(next.height * dpr))
      if (dprChanged || !sprites) rebuild()
    },

    setTheme(next) {
      theme = next
      rebuild()
    },

    setData(next) {
      data = next
    },

    snapshot() {
      if (canvas.width === 0 || canvas.height === 0) return
      snapshotCanvas ??= document.createElement('canvas')
      snapshotCanvas.width = canvas.width
      snapshotCanvas.height = canvas.height
      snapshotCanvas.getContext('2d')?.drawImage(canvas, 0, 0)
    },

    draw(frame) {
      if (!theme || !data || !sprites) return
      const { width, height } = viewport
      const { cx, cy, r } = frame.disc
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = 1

      // The sky, and its faint dot grid.
      ctx.fillStyle = theme.sky
      ctx.fillRect(0, 0, width, height)
      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, width, height)
      }

      // Atmosphere, then the sphere lit from the upper left.
      const air = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.16)
      air.addColorStop(0, theme.atmosphere)
      air.addColorStop(1, withAlpha(theme.atmosphere, 0))
      ctx.fillStyle = air
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.16, 0, Math.PI * 2)
      ctx.fill()

      const hx = cx - 0.24 * r
      const hy = cy - 0.36 * r
      const body = ctx.createRadialGradient(hx, hy, 0, hx, hy, 1.5 * r)
      body.addColorStop(0, theme.sphere0)
      body.addColorStop(0.55, theme.sphere1)
      body.addColorStop(1, theme.sphere2)
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)'
      ctx.lineWidth = 1
      ctx.stroke()

      if (pathProjection !== frame.projection) {
        path = geoPath(frame.projection, ctx)
        pathProjection = frame.projection
      }
      const draw = path!

      // Graticule and the continents' outlines.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
      ctx.beginPath()
      draw(GRATICULE)
      ctx.stroke()
      data.regions.forEach((region, index) => {
        const focused = index === frame.focusRegion
        ctx.beginPath()
        draw(region.outline)
        ctx.fillStyle = focused ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.025)'
        ctx.fill()
        ctx.strokeStyle = focused ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'
        ctx.stroke()
      })

      const rotate = geoRotation(frame.projection.rotate() as [number, number, number])
      const RADIANS = Math.PI / 180

      // Continent names, on the whole planet only.
      if (frame.regionLabelAlpha > 0.01) {
        setFont(12, 600)
        setLetterSpacing('1.5px')
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        for (const region of data.regions) {
          const [lng, lat] = rotate([region.lng, region.lat])
          const depth = Math.cos(lat * RADIANS) * Math.cos(lng * RADIANS)
          if (depth < 0.25) continue
          const xy = frame.projection([region.lng, region.lat])
          if (!xy) continue
          ctx.fillStyle = withAlpha(theme.text, (0.3 + 0.25 * depth) * frame.regionLabelAlpha)
          ctx.fillText(region.name.toLocaleUpperCase(), xy[0], xy[1])
        }
        setLetterSpacing('0px')
      }

      // The points.
      const cut = frame.glyphSize < SMALL_CUT_BELOW ? GLYPH_SMALL : GLYPH_LARGE
      const set = cut === GLYPH_SMALL ? sprites.small : sprites.large
      const { x, y, depth, breathScale, breathAlpha } = frame
      const { state, count } = data
      for (let i = 0; i < count; i += 1) {
        const d = depth[i]
        if (d <= 0) continue
        const s = frame.glyphSize * (0.6 + 0.4 * d) * breathScale[i]
        const px = x[i]
        const py = y[i]
        const sprite = set[state[i]]
        const size = (s * sprite.extent * 2) / cut.box
        if (px + size < 0 || py + size < 0 || px - size > width || py - size > height) continue
        const dim = i === frame.focusPoint ? 1 : frame.dim
        ctx.globalAlpha = Math.min(1, d * 4) * breathAlpha[i] * dim
        ctx.drawImage(sprite.canvas, px - size / 2, py - size / 2, size, size)
      }

      // Live marks: progress arcs, the recommendation, review pips.
      const unit = frame.glyphSize / cut.box
      ctx.lineCap = 'round'
      for (let i = 0; i < count; i += 1) {
        const d = depth[i]
        if (d <= 0) continue
        const recommended = i === data.recommended
        const inProgress = state[i] === STATE_IN_PROGRESS
        const review = data.reviewDue[i] === 1
        if (!recommended && !inProgress && !review) continue
        const scale = (0.6 + 0.4 * d) * unit
        const px = x[i]
        const py = y[i]
        const dim = i === frame.focusPoint ? 1 : frame.dim
        const fade = Math.min(1, d * 4) * dim
        if (inProgress && data.progress[i] > 0) {
          const g = cut.inProgress
          ctx.globalAlpha = fade
          ctx.strokeStyle = theme.lit
          ctx.lineWidth = g.ringWidth * scale * breathScale[i]
          ctx.beginPath()
          ctx.arc(px, py, g.ring * scale * breathScale[i], -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, data.progress[i]))
          ctx.stroke()
        }
        if (recommended) {
          const g = cut.recommended
          ctx.globalAlpha = fade
          ctx.save()
          ctx.translate(px, py)
          ctx.scale(scale, scale)
          halo(ctx, g.halo, g.blur, theme.lit, g.haloAlpha)
          ctx.setLineDash([...g.dash])
          ring(ctx, g.ring, g.ringWidth, theme.lit, 1)
          ctx.restore()
        }
        if (review) {
          const g = cut.review
          const offset = (g.offset * scale) / Math.SQRT2
          ctx.globalAlpha = fade
          ctx.fillStyle = theme.sky
          ctx.beginPath()
          ctx.arc(px + offset, py - offset, (g.radius + g.outline) * scale, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = theme.text
          ctx.beginPath()
          ctx.arc(px + offset, py - offset, g.radius * scale, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Names, in the region layer (Motion: labels fade in after 60% of the zoom).
      // A name is left out where it would overlap one already placed; the
      // points further along in the reading order give way.
      if (frame.pointLabelAlpha > 0.01 && frame.focusRegion >= 0) {
        setFont(13, 500)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const placed: number[] = []
        const order = frame.focusPoint >= 0 ? [frame.focusPoint] : []
        for (let i = 0; i < count; i += 1) if (i !== frame.focusPoint) order.push(i)
        for (const i of order) {
          const d = depth[i]
          if (d < 0.3 || data.region[i] !== frame.focusRegion) continue
          const s = frame.glyphSize * (0.6 + 0.4 * d)
          const top = y[i] + s * 0.42 + 6
          if (top > height || top < -16 || x[i] < -80 || x[i] > width + 80) continue
          const half = ctx.measureText(data.names[i]).width / 2 + 3
          const box = [x[i] - half, top - 2, x[i] + half, top + 17]
          let free = true
          for (let j = 0; j < placed.length; j += 4) {
            if (box[0] < placed[j + 2] && box[2] > placed[j] && box[1] < placed[j + 3] && box[3] > placed[j + 1]) {
              free = false
              break
            }
          }
          if (!free) continue
          placed.push(box[0], box[1], box[2], box[3])
          const color =
            state[i] === STATE_LIT || state[i] === STATE_IN_PROGRESS
              ? theme.text
              : state[i] === STATE_READY
                ? theme.textBody
                : theme.textCaption
          const dim = i === frame.focusPoint ? 1 : frame.dim
          ctx.globalAlpha = frame.pointLabelAlpha * Math.min(1, (d - 0.3) * 4) * dim
          ctx.fillStyle = color
          ctx.fillText(data.names[i], x[i], top)
        }
      }

      // The frame before a layer change, fading out over this one.
      if (frame.crossfade > 0 && snapshotCanvas) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalAlpha = frame.crossfade
        ctx.drawImage(snapshotCanvas, 0, 0)
      }
      ctx.globalAlpha = 1
    },

    destroy() {
      sprites = null
      snapshotCanvas = null
      data = null
    },
  }
}
