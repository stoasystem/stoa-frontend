/*
 * The Canvas 2D renderer (#11 point 1, kept by #72).
 *
 * A frame is: the sky; the lines between nebulae; one tile per nebula on
 * screen (the whole of a nebula outside the focus, a faint haze behind one in
 * it); then, for the nebulae in focus only, one sprite `drawImage` per star,
 * the few marks that differ star by star, and names. Stars outside the focus
 * are never drawn one by one, and nothing is blurred per frame.
 */
import { GLYPH_LARGE, GLYPH_SMALL, SMALL_CUT_BELOW, starPath, type GlyphCut } from '@/features/starmap/render/glyph'
import { createTileCache, litFractionKey, TILE_REACH, TILE_SIZE, type TileCache } from '@/features/starmap/render/nebulaTiles'
import { linkWeight } from '@/features/starmap/model/links'
import { DRAW_THRESHOLD } from '@/features/starmap/view/foveation'
import type { Viewport } from '@/features/starmap/view/camera'
import {
  STATE_IN_PROGRESS,
  STATE_LIT,
  STATE_LOCKED,
  STATE_READY,
  type RenderStats,
  type SceneData,
  type StarMapRenderer,
  type StarMapTheme,
} from '@/features/starmap/render/types'

type Sprite = { canvas: HTMLCanvasElement; /** Half the sprite's side, in cut units. */ extent: number }

export type Canvas2DOptions = {
  /** Where offscreen canvases come from (sprites, tiles, the crossfade snapshot). */
  createCanvas?: (width: number, height: number) => HTMLCanvasElement
}

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

function defaultCreateCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
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

function drawStateGlyph(ctx: CanvasRenderingContext2D, cut: GlyphCut, state: number, theme: StarMapTheme) {
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
const LARGEST_BOX = { small: SMALL_CUT_BELOW, large: 64 } as const

/** How a star shows in a tile: colour key and alpha, by state. */
const TILE_DOT: Record<number, { lit: boolean; alpha: number; radius: number }> = {
  [STATE_LIT]: { lit: true, alpha: 0.95, radius: 1.3 },
  [STATE_IN_PROGRESS]: { lit: true, alpha: 0.7, radius: 1.1 },
  [STATE_READY]: { lit: false, alpha: 0.55, radius: 0.8 },
  [STATE_LOCKED]: { lit: false, alpha: 0.25, radius: 0.7 },
}

export function createCanvas2DRenderer(canvas: HTMLCanvasElement, options: Canvas2DOptions = {}): StarMapRenderer | null {
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return null
  const ctx: CanvasRenderingContext2D = context
  const makeCanvas = options.createCanvas ?? defaultCreateCanvas

  let viewport: Viewport = { width: 0, height: 0 }
  let dpr = 1
  let theme: StarMapTheme | null = null
  let data: SceneData | null = null
  let sprites: { small: Sprite[]; large: Sprite[] } | null = null
  let snapshotCanvas: HTMLCanvasElement | null = null
  const stats: RenderStats = { frames: 0, starDraws: 0, tileDraws: 0, tilePaints: 0 }

  const buildSprites = (cut: GlyphCut, largestBox: number): Sprite[] => {
    const pixelsPerUnit = (largestBox * Math.max(2, dpr) * 1.14) / cut.box
    return [STATE_LIT, STATE_IN_PROGRESS, STATE_READY, STATE_LOCKED].map((state) => {
      const extent = extentOf(cut, state)
      const size = Math.max(4, Math.ceil(extent * 2 * pixelsPerUnit))
      const sprite = makeCanvas(size, size)
      const s = sprite.getContext('2d')
      if (s && theme) {
        s.translate(size / 2, size / 2)
        s.scale(size / (extent * 2), size / (extent * 2))
        drawStateGlyph(s, cut, state, theme)
      }
      return { canvas: sprite, extent }
    })
  }

  /**
   * One nebula's tile: a haze that brightens with its lit fraction, and its
   * stars as soft dots, painted at a quarter of the tile's side and scaled up
   * twice -- the downsample is the blur.
   */
  const paintTile = (index: number) => {
    const size = TILE_SIZE
    const tile = makeCanvas(size, size)
    const small = makeCanvas(size / 4, size / 4)
    const t = tile.getContext('2d')
    const s = small.getContext('2d')
    if (!t || !s || !data || !theme) return { canvas: tile, size }
    const nebula = data.nebulae[index]
    const reach = nebula.r * TILE_REACH
    const litShare = nebula.total > 0 ? nebula.lit / nebula.total : 0

    // Haze: a soft sky-blue glow, warming at the centre as the nebula lights up.
    let hazeGradient = t.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    hazeGradient.addColorStop(0, withAlpha(theme.atmosphere, 0.75))
    hazeGradient.addColorStop(0.45, withAlpha(theme.atmosphere, 0.45))
    hazeGradient.addColorStop(1, withAlpha(theme.atmosphere, 0))
    t.fillStyle = hazeGradient
    t.fillRect(0, 0, size, size)
    const warmth = t.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.4)
    warmth.addColorStop(0, withAlpha(theme.lit, 0.03 + 0.12 * litShare))
    warmth.addColorStop(1, withAlpha(theme.lit, 0))
    hazeGradient = warmth
    t.fillStyle = hazeGradient
    t.fillRect(0, 0, size, size)

    // Stars, as dots on the quarter-size canvas.
    const q = size / 4
    const toTile = (value: number, centre: number) => ((value - centre) / reach) * (q / 2) + q / 2
    // A crowded nebula must not burn out to white: fainter dots the more there are.
    const crowd = Math.min(1, 24 / Math.max(1, nebula.total))
    for (let i = 0; i < data.count; i += 1) {
      if (data.nebula[i] !== index) continue
      const dot = TILE_DOT[data.state[i]]
      s.fillStyle = withAlpha(dot.lit ? theme.lit : theme.text, dot.alpha * (0.35 + 0.65 * crowd))
      s.beginPath()
      s.arc(toTile(data.mapX[i], nebula.x), toTile(data.mapY[i], nebula.y), dot.radius * 0.5, 0, Math.PI * 2)
      s.fill()
    }
    t.imageSmoothingEnabled = true
    t.globalCompositeOperation = 'lighter'
    t.drawImage(small, 0, 0, size, size)
    t.globalCompositeOperation = 'source-over'
    return { canvas: tile, size }
  }

  const tiles: TileCache = createTileCache(paintTile)

  const rebuild = () => {
    if (!theme) return
    sprites = { small: buildSprites(GLYPH_SMALL, LARGEST_BOX.small), large: buildSprites(GLYPH_LARGE, LARGEST_BOX.large) }
    tiles.clear()
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
    stats,

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
      // Tiles are keyed by lit fraction, so a new data set repaints only
      // the nebulae whose lit fraction moved.
      data = next
    },

    snapshot() {
      if (canvas.width === 0 || canvas.height === 0) return
      snapshotCanvas ??= makeCanvas(canvas.width, canvas.height)
      snapshotCanvas.width = canvas.width
      snapshotCanvas.height = canvas.height
      snapshotCanvas.getContext('2d')?.drawImage(canvas, 0, 0)
    },

    draw(frame) {
      if (!theme || !data || !sprites) return
      const colours: StarMapTheme = theme
      stats.frames += 1
      stats.starDraws = 0
      stats.tileDraws = 0
      const { width, height } = viewport
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = colours.sky
      ctx.fillRect(0, 0, width, height)

      const { nebulaX, nebulaY, nebulaR, sharpness } = frame
      const onScreen = (x: number, y: number, r: number) => x + r > 0 && y + r > 0 && x - r < width && y - r < height
      const nebulaDim = (n: number) => (frame.chosenNebula >= 0 && n !== frame.chosenNebula ? Math.max(frame.dim, 0.6) : 1)

      // Lines between nebulae, rim to rim.
      ctx.lineCap = 'round'
      for (const link of data.links) {
        const ax = nebulaX[link.a]
        const ay = nebulaY[link.a]
        const bx = nebulaX[link.b]
        const by = nebulaY[link.b]
        const d = Math.hypot(bx - ax, by - ay)
        const trimA = nebulaR[link.a] * 0.85
        const trimB = nebulaR[link.b] * 0.85
        if (d <= trimA + trimB) continue
        const ux = (bx - ax) / d
        const uy = (by - ay) / d
        const weight = linkWeight(link.count)
        ctx.globalAlpha = weight.alpha * frame.dim
        ctx.strokeStyle = colours.textBody
        ctx.lineWidth = weight.width
        ctx.beginPath()
        ctx.moveTo(ax + ux * trimA, ay + uy * trimA)
        ctx.lineTo(bx - ux * trimB, by - uy * trimB)
        ctx.stroke()
      }

      // Nebula tiles: all of a nebula outside the focus, a haze behind one in it.
      ctx.imageSmoothingEnabled = true
      for (let n = 0; n < data.nebulae.length; n += 1) {
        const reach = nebulaR[n] * TILE_REACH
        if (!onScreen(nebulaX[n], nebulaY[n], reach)) continue
        const nebula = data.nebulae[n]
        const tile = tiles.get(n, litFractionKey(nebula.lit, nebula.total))
        const s = sharpness[n]
        ctx.globalAlpha = ((1 - s) * 0.9 + s * 0.3) * nebulaDim(n)
        ctx.drawImage(tile.canvas, nebulaX[n] - reach, nebulaY[n] - reach, reach * 2, reach * 2)
        stats.tileDraws += 1
      }
      stats.tilePaints = tiles.paints

      const { x, y, starAlpha } = frame
      const { state, count } = data
      const breath = frame.breath

      // Prerequisite lines inside the chosen nebula.
      if (frame.innerLinkAlpha > 0.01 && frame.chosenNebula >= 0) {
        ctx.strokeStyle = colours.textBody
        ctx.lineWidth = 1
        for (const link of data.innerLinks) {
          if (link.nebula !== frame.chosenNebula) continue
          const lit = state[link.from] === STATE_LIT
          ctx.globalAlpha = frame.innerLinkAlpha * (lit ? 0.4 : 0.2) * frame.dim
          ctx.beginPath()
          ctx.moveTo(x[link.from], y[link.from])
          ctx.lineTo(x[link.to], y[link.to])
          ctx.stroke()
        }
      }

      // Stars in focus, one sprite each.
      const cut = frame.glyphSize < SMALL_CUT_BELOW ? GLYPH_SMALL : GLYPH_LARGE
      const set = cut === GLYPH_SMALL ? sprites.small : sprites.large
      const margin = frame.glyphSize * 2
      for (let i = 0; i < count; i += 1) {
        const a = starAlpha[i]
        if (a < DRAW_THRESHOLD) continue
        const px = x[i]
        const py = y[i]
        if (px < -margin || py < -margin || px > width + margin || py > height + margin) continue
        const breathing = breath && breath.index === i
        const sprite = set[state[i]]
        const size = (frame.glyphSize * (breathing ? breath.scale : 1) * sprite.extent * 2) / cut.box
        ctx.globalAlpha = a * (breathing ? breath.alpha : 1) * (i === frame.focusStar ? 1 : frame.dim)
        ctx.drawImage(sprite.canvas, px - size / 2, py - size / 2, size, size)
        stats.starDraws += 1
      }

      // Live marks: progress arcs, the recommendation, review pips, skills.
      const unit = frame.glyphSize / cut.box
      for (let i = 0; i < count; i += 1) {
        const a = starAlpha[i]
        if (a < DRAW_THRESHOLD) continue
        const recommended = i === data.recommended
        const inProgress = state[i] === STATE_IN_PROGRESS
        const review = data.reviewDue[i] === 1
        const skills = frame.showSkills ? data.skills[i] : undefined
        if (!recommended && !inProgress && !review && !skills?.length) continue
        const px = x[i]
        const py = y[i]
        if (px < -margin || py < -margin || px > width + margin || py > height + margin) continue
        const grow = breath && breath.index === i ? breath.scale : 1
        const fade = a * (i === frame.focusStar ? 1 : frame.dim)
        if (inProgress && data.progress[i] > 0) {
          const g = cut.inProgress
          ctx.globalAlpha = fade
          ctx.strokeStyle = colours.lit
          ctx.lineWidth = g.ringWidth * unit * grow
          ctx.beginPath()
          ctx.arc(px, py, g.ring * unit * grow, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, data.progress[i]))
          ctx.stroke()
        }
        if (recommended) {
          const g = cut.recommended
          ctx.globalAlpha = fade
          ctx.save()
          ctx.translate(px, py)
          ctx.scale(unit * grow, unit * grow)
          halo(ctx, g.halo, g.blur, colours.lit, g.haloAlpha)
          ctx.setLineDash([...g.dash])
          ring(ctx, g.ring, g.ringWidth, colours.lit, 1)
          ctx.restore()
        }
        if (review) {
          const g = cut.review
          const offset = (g.offset * unit) / Math.SQRT2
          ctx.globalAlpha = fade
          ctx.fillStyle = colours.sky
          ctx.beginPath()
          ctx.arc(px + offset, py - offset, (g.radius + g.outline) * unit, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = colours.text
          ctx.beginPath()
          ctx.arc(px + offset, py - offset, g.radius * unit, 0, Math.PI * 2)
          ctx.fill()
        }
        if (skills?.length) {
          // Skill points: small dots on an arc below the star (#72 point 1).
          const radius = frame.glyphSize * 0.62
          const dot = Math.max(1.6, frame.glyphSize * 0.045)
          skills.forEach((lit, k) => {
            // From 210 to 330 degrees, y pointing down: an arc over the star, clear of its name.
            const angle = Math.PI * (7 / 6 + ((2 / 3) * (k + 0.5)) / skills.length)
            const sx = px + Math.cos(angle) * radius
            const sy = py + Math.sin(angle) * radius
            ctx.globalAlpha = fade
            ctx.beginPath()
            ctx.arc(sx, sy, dot, 0, Math.PI * 2)
            if (lit) {
              ctx.fillStyle = colours.lit
              ctx.fill()
            } else {
              ctx.strokeStyle = withAlpha(colours.text, 0.55)
              ctx.lineWidth = 1
              ctx.stroke()
            }
          })
        }
      }

      // Nebula names, over their nebula.
      if (frame.nebulaLabelAlpha > 0.01) {
        setFont(12, 600)
        setLetterSpacing('1.5px')
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        data.nebulae.forEach((nebula, n) => {
          if (n === frame.chosenNebula) return
          const top = nebulaY[n] - nebulaR[n] - 6
          if (!onScreen(nebulaX[n], top, 80)) return
          ctx.globalAlpha = frame.nebulaLabelAlpha * (0.55 + 0.3 * sharpness[n]) * nebulaDim(n)
          ctx.fillStyle = colours.textBody
          ctx.fillText(nebula.name.toLocaleUpperCase(), nebulaX[n], Math.max(16, top))
        })
        setLetterSpacing('0px')
      }

      // Star names in the chosen nebula (Motion: labels fade in after 60% of
      // the zoom). A name that would overlap one already placed is left out;
      // the stars further along in the reading order give way.
      if (frame.starLabelAlpha > 0.01 && frame.chosenNebula >= 0) {
        setFont(13, 500)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const placed: number[] = []
        const order = frame.focusStar >= 0 ? [frame.focusStar] : []
        for (let i = 0; i < count; i += 1) if (i !== frame.focusStar) order.push(i)
        for (const i of order) {
          if (data.nebula[i] !== frame.chosenNebula || starAlpha[i] < DRAW_THRESHOLD) continue
          const top = y[i] + frame.glyphSize * 0.42 + 6
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
              ? colours.text
              : state[i] === STATE_READY
                ? colours.textBody
                : colours.textCaption
          ctx.globalAlpha = frame.starLabelAlpha * (i === frame.focusStar ? 1 : frame.dim)
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
      tiles.clear()
    },
  }
}
