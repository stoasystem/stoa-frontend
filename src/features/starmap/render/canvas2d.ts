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
import { aroundDisc, belongsTo, boxHitsCircle, nebulaConnection, placeLabel, splitByCircles, type Box, type Circle, type Segment } from '@/features/starmap/render/labels'
import { createTileCache, nebulaStateKeys, tileKey, tileSizeFor, TILE_REACH, type TileCache } from '@/features/starmap/render/nebulaTiles'
import { CLOUD_REACH, GALAXY_HAZE_ALPHA, galaxyHazeBox, NEBULA_GLOW, paintGalaxy, paintGalaxyHaze, paintNebulaCloud } from '@/features/starmap/render/galaxy'
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

/** A nebula's haze: the atmosphere token at its core, warming with the lit share up to 9% gold. */
export const HAZE = { core: 0.5, mid: 0.3, warmthBase: 0.03, warmthLit: 0.06 } as const

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
  let skyCanvas: HTMLCanvasElement | null = null
  /** One sky: each galaxy's haze, painted once per sky and theme. */
  let galaxyHazes: HTMLCanvasElement[] = []
  let hazesFor = ''
  let stateKeys: string[] = []
  const stats: RenderStats = { frames: 0, starDraws: 0, tileDraws: 0, tilePaints: 0, highlightNebula: -1 }

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
   * its stars as dots painted at half of the tile's side and scaled up
   * -- the downsample is the blur.
   */
  const paintTile = (index: number, size: number) => {
    const hazeCanvas = makeCanvas(size, size)
    const starsCanvas = makeCanvas(size, size)
    const small = makeCanvas(size / 2, size / 2)
    const h = hazeCanvas.getContext('2d')
    const t = starsCanvas.getContext('2d')
    const s = small.getContext('2d')
    if (!h || !t || !s || !data || !theme) return { haze: hazeCanvas, stars: starsCanvas, size }
    const nebula = data.nebulae[index]
    const reach = nebula.r * (data.galaxy ? CLOUD_REACH : TILE_REACH)
    const litShare = nebula.total > 0 ? nebula.lit / nebula.total : 0

    // One sky: the haze is the nebula's cloud, in its own tint, shaped by its stars.
    if (data.galaxy) {
      paintNebulaCloud(h, size, data, index, theme, makeCanvas)
    } else {
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
    }

    const q = size / 2
    const toTile = (value: number, centre: number) => ((value - centre) / reach) * (q / 2) + q / 2
    // A crowded nebula must not burn out to white: fainter dots the more there are.
    const crowd = Math.min(1, 24 / Math.max(1, nebula.total))
    for (let i = 0; i < data.count; i += 1) {
      if (data.nebula[i] !== index) continue
      const dot = DOT[data.state[i]]
      s.fillStyle = withAlpha(dot.lit ? theme.lit : theme.text, dot.alpha * (0.35 + 0.65 * crowd))
      s.beginPath()
      s.arc(toTile(data.mapX[i], nebula.x), toTile(data.mapY[i], nebula.y), dot.radius * 0.85, 0, Math.PI * 2)
      s.fill()
    }
    t.imageSmoothingEnabled = true
    t.imageSmoothingQuality = 'high'
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

  const paintSky = () => {
    if (!theme || viewport.width <= 0 || viewport.height <= 0) return
    skyCanvas = makeCanvas(canvas.width, canvas.height)
    const sky = skyCanvas.getContext('2d')
    if (!sky) return
    sky.scale(dpr, dpr)
    paintGalaxy(sky, viewport.width, viewport.height, theme, Boolean(data?.galaxy))
  }

  /** Each galaxy's haze, 1024 px across its box; only the sky's layout and the theme change it. */
  const paintHazes = () => {
    const key = data?.galaxy ? data.mapKey : ''
    if (key === hazesFor && galaxyHazes.length > 0) return
    hazesFor = key
    galaxyHazes = []
    if (!data?.galaxy || !theme) return
    for (let g = 0; g < (data.galaxies?.length ?? 0); g += 1) {
      const box = galaxyHazeBox(data.galaxies![g])
      const width = 1024
      const height = Math.max(16, Math.round((width * (box.y1 - box.y0)) / (box.x1 - box.x0)))
      const haze = makeCanvas(width, height)
      const h = haze.getContext('2d')
      if (h) paintGalaxyHaze(h, width, data, g, theme, makeCanvas)
      galaxyHazes.push(haze)
    }
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
      paintSky()
    },

    setTheme(next) {
      theme = next
      rebuild()
      paintSky()
      hazesFor = ''
      paintHazes()
    },

    setData(next) {
      // Another map (subject, orientation, layout): none of its tiles may
      // come from the last one. The same map with a star lit: the tile keys
      // repaint exactly the nebulae whose stars changed state.
      if (next.mapKey !== tilesFor) tiles.clear()
      tilesFor = next.mapKey
      const sparse = Boolean(data?.galaxy)
      data = next
      stateKeys = nebulaStateKeys(next.state, next.nebula, next.nebulae.length)
      if (Boolean(next.galaxy) !== sparse) paintSky()
      paintHazes()
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
      if (skyCanvas) ctx.drawImage(skyCanvas, 0, 0, width, height)

      const { nebulaX, nebulaY, nebulaR, sharpness, x, y, starAlpha } = frame
      const { state, count } = scene
      const nebulaCount = scene.nebulae.length
      // One sky: each galaxy's faint haze, under its nebulae.
      if (scene.galaxy && scene.galaxies) {
        ctx.imageSmoothingEnabled = true
        scene.galaxies.forEach((galaxy, g) => {
          const haze = galaxyHazes[g]
          if (!haze) return
          const box = galaxyHazeBox(galaxy)
          const x0 = frame.ox + box.x0 * frame.scale
          const x1 = frame.ox + box.x1 * frame.scale
          if (x1 < 0 || x0 > width) return
          ctx.globalAlpha = GALAXY_HAZE_ALPHA * galaxy.dim
          ctx.drawImage(haze, x0, frame.oy + box.y0 * frame.scale, x1 - x0, (box.y1 - box.y0) * frame.scale)
        })
      }

      const onScreen = (px: number, py: number, r: number) => px + r > 0 && py + r > 0 && px - r < width && py - r < height
      const nebulaDim = (n: number) => (frame.chosenNebula >= 0 && n !== frame.chosenNebula ? Math.max(frame.dim, 0.6) : 1)

      // Haze under every nebula, and the blurred stars of those outside the focus.
      ctx.imageSmoothingEnabled = true
      for (let n = 0; n < nebulaCount; n += 1) {
        const reach = nebulaR[n] * (scene.galaxy ? CLOUD_REACH : TILE_REACH)
        if (!onScreen(nebulaX[n], nebulaY[n], reach)) continue
        const nebula = scene.nebulae[n]
        const tile = tiles.get(n, `${tileKey(scene.mapKey, nebula.topicId, nebula.lit, nebula.total)}:${stateKeys[n]}`, tileSizeFor(reach * 2, dpr, scene.galaxy ? 512 : 256))
        const box = [nebulaX[n] - reach, nebulaY[n] - reach, reach * 2, reach * 2] as const
        const own = nebula.dim ?? 1
        if (scene.galaxy) {
          // The cloud brightens with its lit share (#117), core first: lit stars warm it from within.
          const litShare = nebula.total > 0 ? nebula.lit / nebula.total : 0
          ctx.globalAlpha = (NEBULA_GLOW.base + NEBULA_GLOW.lit * litShare) * own * nebulaDim(n)
        } else {
          ctx.globalAlpha = nebulaDim(n)
        }
        ctx.drawImage(tile.haze, ...box)
        const blurred = 1 - sharpness[n]
        if (blurred > 0.01) {
          ctx.globalAlpha = blurred * nebulaDim(n) * own
          ctx.drawImage(tile.stars, ...box)
        }
        stats.tileDraws += 1
      }
      stats.tilePaints = tiles.paints

      // The nebula whose link has keyboard focus: a ring in the focus colour.
      if (frame.highlightNebula >= 0 && frame.highlightNebula < nebulaCount) {
        const n = frame.highlightNebula
        ctx.globalAlpha = 1
        ctx.strokeStyle = colours.lit
        ctx.lineWidth = 2
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(nebulaX[n], nebulaY[n], nebulaR[n] * 1.05 + 4, 0, Math.PI * 2)
        ctx.stroke()
        stats.highlightNebula = n
      } else {
        stats.highlightNebula = -1
      }

      // Lines between nebulae, from rim to rim, faded where they cross a third nebula.
      const segments: Segment[] = []
      const cores: Circle[] = []
      for (let n = 0; n < nebulaCount; n += 1) cores.push({ x: nebulaX[n], y: nebulaY[n], r: nebulaR[n] * 0.9 })
      ctx.lineCap = 'round'
      ctx.strokeStyle = colours.text
      const offscreen: { name: string; arrow: string; x: number; y: number }[] = []
      for (const link of scene.links) {
        // One sky: no lines on the whole map (#117 D1; their tiers are #121).
        if (scene.galaxy && frame.chosenNebula < 0) break
        if (frame.chosenNebula >= 0 && link.a !== frame.chosenNebula && link.b !== frame.chosenNebula) continue
        const a = { x: nebulaX[link.a], y: nebulaY[link.a], r: nebulaR[link.a] }
        const b = { x: nebulaX[link.b], y: nebulaY[link.b], r: nebulaR[link.b] }
        const path = nebulaConnection(a, b, Math.max(10, frame.glyphSize * 0.65))
        const others = cores.filter((_, n) => n !== link.a && n !== link.b)
        const weight = linkWeight(link.count)
        const alpha = Math.max(INK.linkMinAlpha, weight.alpha) * frame.dim
        const clearParts: Segment[] = [], hiddenParts: Segment[] = []
        for (const line of path.segments) {
          const { clear, hidden } = splitByCircles(line, others)
          for (const [spans, parts] of [[clear, clearParts], [hidden, hiddenParts]] as const) {
            for (const [t0, t1] of spans) parts.push({
              x0: line.x0 + (line.x1 - line.x0) * t0, y0: line.y0 + (line.y1 - line.y0) * t0,
              x1: line.x0 + (line.x1 - line.x0) * t1, y1: line.y0 + (line.y1 - line.y0) * t1,
            })
          }
          segments.push(line) // Even the faint part is forbidden to labels.
        }
        const stroke = (parts: Segment[], strength: number, width: number) => {
          ctx.globalAlpha = strength
          ctx.lineWidth = width
          ctx.beginPath()
          for (const line of parts) {
            ctx.moveTo(line.x0, line.y0)
            ctx.lineTo(line.x1, line.y1)
          }
          ctx.stroke() // One composite: adjacent curve segments cannot pile up opaque caps.
        }
        if (path.bridge) stroke(clearParts, 0.12 * frame.dim, 5)
        stroke(clearParts, alpha, weight.width)
        if (hiddenParts.length) stroke(hiddenParts, alpha * INK.linkInsideFactor, weight.width)
        if (frame.chosenNebula >= 0) {
          const dest = link.a === frame.chosenNebula ? link.b : link.a
          const cx = nebulaX[frame.chosenNebula], cy = nebulaY[frame.chosenNebula]
          const dx = nebulaX[dest] - cx, dy = nebulaY[dest] - cy
          const top = viewport.top ?? 0, bottom = height - (viewport.bottom ?? 0)
          if (nebulaX[dest] >= 0 && nebulaX[dest] <= width && nebulaY[dest] >= top && nebulaY[dest] <= bottom) continue
          const hit = Math.min(dx > 0 ? (width - 16 - cx) / dx : dx < 0 ? (16 - cx) / dx : Infinity,
            dy > 0 ? (bottom - 24 - cy) / dy : dy < 0 ? (top + 16 - cy) / dy : Infinity)
          if (hit > 0 && Number.isFinite(hit)) offscreen.push({ name: scene.nebulae[dest].name, arrow: dy < 0 ? (dx < 0 ? '↖' : '↗') : (dx < 0 ? '↙' : '↘'), x: cx + dx * hit, y: cy + dy * hit })
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
      // A recommended star is always a full glyph, at least 18 px: the way in.
      const beacons = new Set(scene.recommendations ?? (scene.recommended >= 0 ? [scene.recommended] : []))
      const isBeacon = (i: number) => beacons.has(i)
      const beaconSize = frame.dotBlend > 0.5 ? 12 : Math.min(frame.glyphSize, 32)

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
          const line = { x0: x[link.from] + (dx / d) * trim, y0: y[link.from] + (dy / d) * trim,
            x1: x[link.to] - (dx / d) * trim, y1: y[link.to] - (dy / d) * trim }
          ctx.moveTo(line.x0, line.y0)
          ctx.lineTo(line.x1, line.y1)
          segments.push(line)
        }
        ctx.stroke()
      }

      // Stars in focus: dots on the whole map, glyphs zoomed in, crossfading between.
      for (let i = 0; i < count; i += 1) {
        const a = starAlpha[i]
        if (a < DRAW_THRESHOLD || !visible(i)) continue
        const focus = (i === frame.focusStar ? 1 : frame.dim) * (scene.nebulae[scene.nebula[i]]?.dim ?? 1)
        const beacon = isBeacon(i)
        const breathing = breath && breath.index === i
        if (glyphs > 0.01) {
          const sprite = glyphSet[state[i]]
          const box = beacon ? beaconSize : frame.glyphSize
          const size = (box * (breathing ? breath.scale : 1) * sprite.extent * 2) / cut.box
          ctx.globalAlpha = a * (beacon ? 1 : glyphs) * (breathing ? breath.alpha : 1) * focus
          ctx.drawImage(sprite.canvas, x[i] - size / 2, y[i] - size / 2, size, size)
        }
        if (frame.dotBlend > 0.01) {
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
        const beacon = isBeacon(i)
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
        if (glyphs > 0.01 && inProgress && scene.progress[i] > 0) {
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
        if (glyphs > 0.01 && review) {
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
      // Names stay out of the bands the page keeps for its own controls: the
      // placer only considers spots inside this area.
      const labelArea: Box = { x0: 0, y0: viewport.top ?? 0, x1: width, y1: height - (viewport.bottom ?? 0) }

      // Star names in the chosen nebula first: they are what the layer is for.
      if (frame.starLabelAlpha > 0.01 && frame.chosenNebula >= 0) {
        setFont(13, 500)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const glyphR = Math.max(frame.glyphSize * 0.42, frame.dotRadius * 2)
        const stars: Circle[] = []
        for (let i = 0; i < count; i += 1) {
          if (starAlpha[i] >= DRAW_THRESHOLD && visible(i)) stars.push({ x: x[i], y: y[i], r: isBeacon(i) ? beaconSize * 0.45 : glyphR })
        }
        const order = frame.focusStar >= 0 ? [frame.focusStar] : []
        for (let i = 0; i < count; i += 1) if (i !== frame.focusStar) order.push(i)
        for (const i of order) {
          if (scene.nebula[i] !== frame.chosenNebula || starAlpha[i] < DRAW_THRESHOLD || !visible(i)) continue
          const w = ctx.measureText(scene.names[i]).width + 6
          const own = isBeacon(i) ? beaconSize * 0.45 : glyphR
          const box = placeLabel(
            aroundDisc(x[i], y[i], own, w, 17, 3),
            { boxes: placed, circles: stars.filter((c) => c.x !== x[i] || c.y !== y[i]), segments },
            labelArea,
          )
          if (!box) continue
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
        const priority = frame.highlightNebula >= 0 ? frame.highlightNebula : frame.hoveredNebula ?? -1
        const limit = scene.galaxy && frame.chosenNebula < 0 ? (priority >= 0 ? 1 : 0) : width < 768 && frame.chosenNebula < 0 ? 4 : nebulaCount
        const order = Array.from({ length: nebulaCount }, (_, n) => n).sort((a, b) =>
          (a === priority ? -1 : b === priority ? 1 :
            Math.hypot(nebulaX[a] - width / 2, nebulaY[a] - height / 2) - Math.hypot(nebulaX[b] - width / 2, nebulaY[b] - height / 2)))
        let labelled = 0
        for (const n of order) {
          if (n === frame.chosenNebula || labelled >= limit) continue
          if (nebulaX[n] < 0 || nebulaY[n] < 0 || nebulaX[n] > width || nebulaY[n] > height) continue
          const text = scene.nebulae[n].name.toLocaleUpperCase()
          const w = ctx.measureText(text).width + 8
          const own = { x: nebulaX[n], y: nebulaY[n], r: nebulaR[n] }
          const others = cores.filter((_, m) => m !== n)
          const box = placeLabel(
            aroundDisc(own.x, own.y, own.r * 0.95, w, 16, 6),
            { boxes: placed, circles: others, segments }, labelArea,
            (candidate) => belongsTo(candidate, own, others) && !others.some((c) => boxHitsCircle(candidate, c)) ? 0 : Infinity,
          )
          if (!box) continue
          labelled += 1
          placed.push(box)
          ctx.globalAlpha = frame.nebulaLabelAlpha * INK.nebulaName.alpha * nebulaDim(n)
          outlinedText(text, (box.x0 + box.x1) / 2, box.y0 + 2, colours.textBody, colours.sky, INK.nebulaName.outline)
        }
        setLetterSpacing('0px')
      }

      if (offscreen.length && frame.chosenNebula >= 0 && frame.nebulaLabelAlpha > 0.01) {
        setFont(12, 500)
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        for (const destination of offscreen) {
          let text = `${destination.arrow} ${destination.name}`
          while (ctx.measureText(text).width > Math.min(180, width - 40) && text.length > 5) text = `${text.slice(0, -2)}…`
          const half = ctx.measureText(text).width / 2 + 8
          const px = Math.max(half + 12, Math.min(width - half - 12, destination.x))
          const py = Math.max(labelArea.y0 + 14, Math.min(labelArea.y1 - 14, destination.y))
          const box = { x0: px - half, y0: py - 12, x1: px + half, y1: py + 12 }
          if (placed.some((b) => b.x0 < box.x1 && b.x1 > box.x0 && b.y0 < box.y1 && b.y1 > box.y0)) continue
          placed.push(box)
          ctx.globalAlpha = 1
          ctx.fillStyle = colours.sky
          ctx.fillRect(box.x0, box.y0, half * 2, 24)
          outlinedText(text, px, py, colours.textBody, colours.sky, 3)
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
      skyCanvas = null
      galaxyHazes = []
      data = null
      tiles.clear()
    },
  }
}

