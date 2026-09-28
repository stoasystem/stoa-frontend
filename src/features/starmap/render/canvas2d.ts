/*
 * The Canvas 2D renderer (#11 point 1, kept by #72).
 *
 * A frame is: the sky; every nebula's haze; the blurred stars of nebulae
 * outside the focus (one tile each); the lines between nebulae, faded where
 * they cross a third nebula; then, for the focus only, one sprite per star
 * (a small dot on the whole map, a full glyph zoomed in), the few marks that
 * differ star by star, and names placed clear of each other. Stars outside
 * the focus are never drawn one by one, and nothing is blurred per frame.
 */
import { GLYPH_LARGE, GLYPH_SMALL, LOCKED_RING_ALPHA, SMALL_CUT_BELOW, starPath, type GlyphCut } from '@/features/starmap/render/glyph'
import { aroundDisc, boxHitsCircle, placeLabel, splitByCircles, type Box, type Circle, type Segment } from '@/features/starmap/render/labels'
import { createTileCache, tileKey, TILE_REACH, TILE_SIZE, type TileCache } from '@/features/starmap/render/nebulaTiles'
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

/** How a star shows as a dot (in a tile, and on the whole map): colour and alpha by state. */
const DOT: Record<number, { lit: boolean; alpha: number; radius: number; glow: boolean }> = {
  [STATE_LIT]: { lit: true, alpha: 1, radius: 1, glow: true },
  [STATE_IN_PROGRESS]: { lit: true, alpha: 0.8, radius: 0.85, glow: true },
  [STATE_READY]: { lit: false, alpha: 0.75, radius: 0.7, glow: false },
  // 42% white keeps a locked star at 3:1 (see LOCKED_RING_ALPHA).
  [STATE_LOCKED]: { lit: false, alpha: LOCKED_RING_ALPHA, radius: 0.6, glow: false },
}

/*
 * What the canvas draws in text and lines, and at what strength. The contrast
 * of each is checked in starmapContrast.test.ts against the sky tokens.
 */
export const INK = {
  /** Nebula names: body white, over a sky-coloured outline so neighbouring haze never lowers them. */
  nebulaName: { alpha: 1, outline: 3 },
  /** A line between nebulae: at least 42% white (3.8:1 on the sky); faded to a quarter inside a third nebula. */
  linkMinAlpha: 0.42,
  linkInsideFactor: 0.25,
  /** Prerequisite lines inside a nebula. */
  innerLinkAlpha: 0.42,
} as const

/** A nebula's haze: the atmosphere token at its core, warming with the lit share up to 15% gold. */
export const HAZE = { core: 0.75, mid: 0.45, warmthBase: 0.03, warmthLit: 0.12 } as const

export function createCanvas2DRenderer(canvas: HTMLCanvasElement, options: Canvas2DOptions = {}): StarMapRenderer | null {
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return null
  const ctx: CanvasRenderingContext2D = context
  const makeCanvas = options.createCanvas ?? defaultCreateCanvas

  let viewport: Viewport = { width: 0, height: 0 }
  let dpr = 1
  let theme: StarMapTheme | null = null
  let data: SceneData | null = null
  let sprites: { small: Sprite[]; large: Sprite[]; dots: HTMLCanvasElement[] } | null = null
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

  /** A dot sprite per state: a core of radius 1/4 of the sprite, a soft glow for lit ones. */
  const buildDots = (): HTMLCanvasElement[] => {
    const size = 32
    return [STATE_LIT, STATE_IN_PROGRESS, STATE_READY, STATE_LOCKED].map((state) => {
      const dot = DOT[state]
      const sprite = makeCanvas(size, size)
      const s = sprite.getContext('2d')
      if (s && theme) {
        s.translate(size / 2, size / 2)
        if (dot.glow) halo(s, size * 0.22, size * 0.12, theme.lit, 0.35)
        disc(s, (size / 4) * dot.radius, dot.lit ? theme.lit : theme.text, dot.alpha)
        if (state === STATE_LIT) disc(s, size * 0.08, theme.litCore)
      }
      return sprite
    })
  }

  /**
   * One nebula's tiles: its haze, which warms as the nebula lights up, and
   * its stars as dots painted at a quarter of the tile's side and scaled up
   * -- the downsample is the blur.
   */
  const paintTile = (index: number) => {
    const size = TILE_SIZE
    const hazeCanvas = makeCanvas(size, size)
    const starsCanvas = makeCanvas(size, size)
    const small = makeCanvas(size / 4, size / 4)
    const h = hazeCanvas.getContext('2d')
    const t = starsCanvas.getContext('2d')
    const s = small.getContext('2d')
    if (!h || !t || !s || !data || !theme) return { haze: hazeCanvas, stars: starsCanvas, size }
    const nebula = data.nebulae[index]
    const reach = nebula.r * TILE_REACH
    const litShare = nebula.total > 0 ? nebula.lit / nebula.total : 0

    const haze = h.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    haze.addColorStop(0, withAlpha(theme.atmosphere, HAZE.core))
    haze.addColorStop(0.45, withAlpha(theme.atmosphere, HAZE.mid))
    haze.addColorStop(1, withAlpha(theme.atmosphere, 0))
    h.fillStyle = haze
    h.fillRect(0, 0, size, size)
    const warmth = h.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.4)
    warmth.addColorStop(0, withAlpha(theme.lit, HAZE.warmthBase + HAZE.warmthLit * litShare))
    warmth.addColorStop(1, withAlpha(theme.lit, 0))
    h.fillStyle = warmth
    h.fillRect(0, 0, size, size)

    const q = size / 4
    const toTile = (value: number, centre: number) => ((value - centre) / reach) * (q / 2) + q / 2
    // A crowded nebula must not burn out to white: fainter dots the more there are.
    const crowd = Math.min(1, 24 / Math.max(1, nebula.total))
    for (let i = 0; i < data.count; i += 1) {
      if (data.nebula[i] !== index) continue
      const dot = DOT[data.state[i]]
      s.fillStyle = withAlpha(dot.lit ? theme.lit : theme.text, dot.alpha * (0.35 + 0.65 * crowd))
      s.beginPath()
      s.arc(toTile(data.mapX[i], nebula.x), toTile(data.mapY[i], nebula.y), dot.radius * 0.7, 0, Math.PI * 2)
      s.fill()
    }
    t.imageSmoothingEnabled = true
    t.drawImage(small, 0, 0, size, size)
    return { haze: hazeCanvas, stars: starsCanvas, size }
  }

  const tiles: TileCache = createTileCache(paintTile)
  let tilesFor = ''

  const rebuild = () => {
    if (!theme) return
    sprites = {
      small: buildSprites(GLYPH_SMALL, LARGEST_BOX.small),
      large: buildSprites(GLYPH_LARGE, LARGEST_BOX.large),
      dots: buildDots(),
    }
    tiles.clear()
  }

  const setFont = (px: number, weight: number) => {
    ctx.font = `${weight} ${px}px ${theme?.fontFamily ?? 'sans-serif'}`
  }

  const setLetterSpacing = (value: string) => {
    // Chrome 99+, Safari 18+; elsewhere the labels just sit a little tighter.
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = value
  }

  /** Text with a sky-coloured outline, so whatever glows behind it, the text stays on sky. */
  const outlinedText = (text: string, x: number, y: number, fill: string, outline: string, width: number) => {
    ctx.lineJoin = 'round'
    ctx.lineWidth = width
    ctx.strokeStyle = outline
    ctx.strokeText(text, x, y)
    ctx.fillStyle = fill
    ctx.fillText(text, x, y)
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
      // Another map (subject, orientation, layout): none of its tiles may
      // come from the last one. The same map with a star lit: the tile keys
      // repaint exactly the nebulae whose lit fraction moved.
      if (next.mapKey !== tilesFor) tiles.clear()
      tilesFor = next.mapKey
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
      const scene: SceneData = data
      const set = sprites
      stats.frames += 1
      stats.starDraws = 0
      stats.tileDraws = 0
      const { width, height } = viewport
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = colours.sky
      ctx.fillRect(0, 0, width, height)

      const { nebulaX, nebulaY, nebulaR, sharpness, x, y, starAlpha } = frame
      const { state, count } = scene
      const nebulaCount = scene.nebulae.length
      const onScreen = (px: number, py: number, r: number) => px + r > 0 && py + r > 0 && px - r < width && py - r < height
      const nebulaDim = (n: number) => (frame.chosenNebula >= 0 && n !== frame.chosenNebula ? Math.max(frame.dim, 0.6) : 1)

      // Haze under every nebula, and the blurred stars of those outside the focus.
      ctx.imageSmoothingEnabled = true
      for (let n = 0; n < nebulaCount; n += 1) {
        const reach = nebulaR[n] * TILE_REACH
        if (!onScreen(nebulaX[n], nebulaY[n], reach)) continue
        const nebula = scene.nebulae[n]
        const tile = tiles.get(n, tileKey(scene.mapKey, nebula.topicId, nebula.lit, nebula.total))
        const box = [nebulaX[n] - reach, nebulaY[n] - reach, reach * 2, reach * 2] as const
        ctx.globalAlpha = nebulaDim(n)
        ctx.drawImage(tile.haze, ...box)
        const blurred = 1 - sharpness[n]
        if (blurred > 0.01) {
          ctx.globalAlpha = blurred * nebulaDim(n)
          ctx.drawImage(tile.stars, ...box)
        }
        stats.tileDraws += 1
      }
      stats.tilePaints = tiles.paints

      // Lines between nebulae, from rim to rim, faded where they cross a third nebula.
      const segments: Segment[] = []
      const cores: Circle[] = []
      for (let n = 0; n < nebulaCount; n += 1) cores.push({ x: nebulaX[n], y: nebulaY[n], r: nebulaR[n] * 0.9 })
      ctx.lineCap = 'round'
      ctx.strokeStyle = colours.text
      for (const link of scene.links) {
        const ax = nebulaX[link.a]
        const ay = nebulaY[link.a]
        const bx = nebulaX[link.b]
        const by = nebulaY[link.b]
        const d = Math.hypot(bx - ax, by - ay)
        const trimA = nebulaR[link.a] + 4
        const trimB = nebulaR[link.b] + 4
        if (d <= trimA + trimB) continue
        const ux = (bx - ax) / d
        const uy = (by - ay) / d
        const line: Segment = { x0: ax + ux * trimA, y0: ay + uy * trimA, x1: bx - ux * trimB, y1: by - uy * trimB }
        const others = cores.filter((_, n) => n !== link.a && n !== link.b)
        const { clear, hidden } = splitByCircles(line, others)
        const weight = linkWeight(link.count)
        const alpha = Math.max(INK.linkMinAlpha, weight.alpha) * frame.dim
        ctx.lineWidth = weight.width
        const stroke = (spans: [number, number][], a: number) => {
          ctx.globalAlpha = a
          ctx.beginPath()
          for (const [t0, t1] of spans) {
            ctx.moveTo(line.x0 + (line.x1 - line.x0) * t0, line.y0 + (line.y1 - line.y0) * t0)
            ctx.lineTo(line.x0 + (line.x1 - line.x0) * t1, line.y0 + (line.y1 - line.y0) * t1)
          }
          ctx.stroke()
        }
        stroke(clear, alpha)
        if (hidden.length) stroke(hidden, alpha * INK.linkInsideFactor)
        for (const [t0, t1] of clear) {
          segments.push({
            x0: line.x0 + (line.x1 - line.x0) * t0,
            y0: line.y0 + (line.y1 - line.y0) * t0,
            x1: line.x0 + (line.x1 - line.x0) * t1,
            y1: line.y0 + (line.y1 - line.y0) * t1,
          })
        }
      }

      const breath = frame.breath
      const glyphs = 1 - frame.dotBlend
      const cut = frame.glyphSize < SMALL_CUT_BELOW ? GLYPH_SMALL : GLYPH_LARGE
      const glyphSet = cut === GLYPH_SMALL ? set.small : set.large
      const unit = frame.glyphSize / cut.box
      const margin = Math.max(frame.glyphSize, 16) * 2
      const visible = (i: number) => {
        const px = x[i]
        const py = y[i]
        return !(px < -margin || py < -margin || px > width + margin || py > height + margin)
      }
      // The recommended star is always a full glyph, at least 18 px: the way in.
      const beaconSize = Math.max(frame.glyphSize, 18)

      // Prerequisite lines inside the chosen nebula, trimmed clear of both stars.
      if (frame.innerLinkAlpha > 0.01 && frame.chosenNebula >= 0) {
        ctx.strokeStyle = colours.text
        ctx.lineWidth = 1
        const trim = Math.max(frame.glyphSize * 0.5, frame.dotRadius * 2) + 2
        ctx.globalAlpha = frame.innerLinkAlpha * INK.innerLinkAlpha * frame.dim
        ctx.beginPath()
        for (const link of scene.innerLinks) {
          if (link.nebula !== frame.chosenNebula) continue
          const dx = x[link.to] - x[link.from]
          const dy = y[link.to] - y[link.from]
          const d = Math.hypot(dx, dy)
          if (d <= trim * 2) continue
          ctx.moveTo(x[link.from] + (dx / d) * trim, y[link.from] + (dy / d) * trim)
          ctx.lineTo(x[link.to] - (dx / d) * trim, y[link.to] - (dy / d) * trim)
        }
        ctx.stroke()
      }

      // Stars in focus: dots on the whole map, glyphs zoomed in, crossfading between.
      for (let i = 0; i < count; i += 1) {
        const a = starAlpha[i]
        if (a < DRAW_THRESHOLD || !visible(i)) continue
        const focus = i === frame.focusStar ? 1 : frame.dim
        const beacon = i === scene.recommended
        const breathing = breath && breath.index === i
        if (beacon || glyphs > 0.01) {
          const sprite = glyphSet[state[i]]
          const box = beacon ? beaconSize : frame.glyphSize
          const size = (box * (breathing ? breath.scale : 1) * sprite.extent * 2) / cut.box
          ctx.globalAlpha = a * (beacon ? 1 : glyphs) * (breathing ? breath.alpha : 1) * focus
          ctx.drawImage(sprite.canvas, x[i] - size / 2, y[i] - size / 2, size, size)
        }
        if (!beacon && frame.dotBlend > 0.01) {
          const size = frame.dotRadius * 4
          ctx.globalAlpha = a * frame.dotBlend * focus
          ctx.drawImage(set.dots[state[i]], x[i] - size / 2, y[i] - size / 2, size, size)
        }
        stats.starDraws += 1
      }

      // Live marks (progress arcs, the recommendation, review pips, skills):
      // glyphs only; the recommended star has its ring at every zoom.
      for (let i = 0; i < count; i += 1) {
        const a = starAlpha[i]
        if (a < DRAW_THRESHOLD || !visible(i)) continue
        const beacon = i === scene.recommended
        const show = beacon ? 1 : glyphs
        if (show < 0.01) continue
        const inProgress = state[i] === STATE_IN_PROGRESS
        const review = scene.reviewDue[i] === 1
        const skills = frame.showSkills ? scene.skills[i] : undefined
        if (!beacon && !inProgress && !review && !skills?.length) continue
        const px = x[i]
        const py = y[i]
        const markUnit = beacon ? beaconSize / cut.box : unit
        const grow = breath && breath.index === i ? breath.scale : 1
        const fade = a * show * (i === frame.focusStar ? 1 : frame.dim)
        if (inProgress && scene.progress[i] > 0) {
          const g = cut.inProgress
          ctx.globalAlpha = fade
          ctx.strokeStyle = colours.lit
          ctx.lineWidth = g.ringWidth * markUnit * grow
          ctx.beginPath()
          ctx.arc(px, py, g.ring * markUnit * grow, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, scene.progress[i]))
          ctx.stroke()
        }
        if (beacon) {
          const g = cut.recommended
          ctx.globalAlpha = fade
          ctx.save()
          ctx.translate(px, py)
          ctx.scale(markUnit * grow, markUnit * grow)
          halo(ctx, g.halo, g.blur, colours.lit, g.haloAlpha)
          ctx.setLineDash([...g.dash])
          ring(ctx, g.ring, g.ringWidth, colours.lit, 1)
          ctx.restore()
        }
        if (review) {
          const g = cut.review
          const offset = (g.offset * markUnit) / Math.SQRT2
          ctx.globalAlpha = fade
          ctx.fillStyle = colours.sky
          ctx.beginPath()
          ctx.arc(px + offset, py - offset, (g.radius + g.outline) * markUnit, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = colours.text
          ctx.beginPath()
          ctx.arc(px + offset, py - offset, g.radius * markUnit, 0, Math.PI * 2)
          ctx.fill()
        }
        if (skills?.length) {
          // Skill points: small dots on an arc over the star, clear of its name (#72 point 1).
          const radius = frame.glyphSize * 0.62
          const dot = Math.max(1.6, frame.glyphSize * 0.045)
          skills.forEach((lit, k) => {
            const angle = Math.PI * (7 / 6 + ((2 / 3) * (k + 0.5)) / skills.length)
            ctx.globalAlpha = fade
            ctx.beginPath()
            ctx.arc(px + Math.cos(angle) * radius, py + Math.sin(angle) * radius, dot, 0, Math.PI * 2)
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

      // Names. Each stays by its own nebula or star; a name with no free
      // place is left out, and one whose nebula is off screen is not drawn.
      const placed: Box[] = []
      // Names stay out of the bands the page keeps for its own controls.
      const labelTop = viewport.top ?? 0
      const labelBottom = height - (viewport.bottom ?? 0)
      const inBand = (box: Box) => box.y0 >= labelTop && box.y1 <= labelBottom
      const viewportBox = { width, height }

      // Star names in the chosen nebula first: they are what the layer is for.
      if (frame.starLabelAlpha > 0.01 && frame.chosenNebula >= 0) {
        setFont(13, 500)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const glyphR = Math.max(frame.glyphSize * 0.42, frame.dotRadius * 2)
        const stars: Circle[] = []
        for (let i = 0; i < count; i += 1) {
          if (starAlpha[i] >= DRAW_THRESHOLD && visible(i)) stars.push({ x: x[i], y: y[i], r: i === scene.recommended ? beaconSize * 0.45 : glyphR })
        }
        const order = frame.focusStar >= 0 ? [frame.focusStar] : []
        for (let i = 0; i < count; i += 1) if (i !== frame.focusStar) order.push(i)
        for (const i of order) {
          if (scene.nebula[i] !== frame.chosenNebula || starAlpha[i] < DRAW_THRESHOLD || !visible(i)) continue
          const w = ctx.measureText(scene.names[i]).width + 6
          const own = i === scene.recommended ? beaconSize * 0.45 : glyphR
          const box = placeLabel(
            aroundDisc(x[i], y[i], own, w, 17, 3),
            { boxes: placed, circles: stars.filter((c) => c.x !== x[i] || c.y !== y[i]), segments: [] },
            viewportBox,
          )
          if (!box || !inBand(box)) continue
          // A star's name may not sit on another star at all.
          if (stars.some((c) => (c.x !== x[i] || c.y !== y[i]) && boxHitsCircle(box, c))) continue
          placed.push(box)
          const color =
            state[i] === STATE_LIT || state[i] === STATE_IN_PROGRESS ? colours.text : state[i] === STATE_READY ? colours.textBody : colours.textCaption
          ctx.globalAlpha = frame.starLabelAlpha * (i === frame.focusStar ? 1 : frame.dim)
          outlinedText(scene.names[i], (box.x0 + box.x1) / 2, box.y0 + 1, color, colours.sky, 3)
        }
      }

      // Nebula names, by their own nebula.
      if (frame.nebulaLabelAlpha > 0.01) {
        setFont(12, 600)
        setLetterSpacing('1.5px')
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        for (let n = 0; n < nebulaCount; n += 1) {
          if (n === frame.chosenNebula) continue
          // A nebula off screen has no name on screen: never clamp one in from outside.
          if (nebulaX[n] < 0 || nebulaY[n] < 0 || nebulaX[n] > width || nebulaY[n] > height) continue
          const text = scene.nebulae[n].name.toLocaleUpperCase()
          const w = ctx.measureText(text).width + 8
          const box = placeLabel(
            aroundDisc(nebulaX[n], nebulaY[n], nebulaR[n] * 0.95, w, 16, 4),
            { boxes: placed, circles: cores.filter((_, m) => m !== n), segments },
            viewportBox,
            // A name that reads as belonging to a neighbour is worse than one a little out of the way.
            (candidate) => {
              const cx = (candidate.x0 + candidate.x1) / 2
              const cy = (candidate.y0 + candidate.y1) / 2
              const own = Math.hypot(cx - nebulaX[n], cy - nebulaY[n]) - nebulaR[n]
              for (let m = 0; m < nebulaCount; m += 1) {
                if (m !== n && Math.hypot(cx - nebulaX[m], cy - nebulaY[m]) - nebulaR[m] < own) return 6
              }
              return 0
            },
          )
          if (!box || !inBand(box)) continue
          placed.push(box)
          ctx.globalAlpha = frame.nebulaLabelAlpha * INK.nebulaName.alpha * nebulaDim(n)
          outlinedText(text, (box.x0 + box.x1) / 2, box.y0 + 2, colours.textBody, colours.sky, INK.nebulaName.outline)
        }
        setLetterSpacing('0px')
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

