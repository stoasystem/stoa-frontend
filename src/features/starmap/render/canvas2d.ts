/*
 * The Canvas 2D renderer (#11 point 1, kept by #72).
 *
 * A frame is: the sky; every nebula's haze; the blurred stars of nebulae
 * outside the focus (one tile each); the connection lines (`render/links.ts`,
 * #121); then, for the focus only, one sprite per star
 * (a small dot on the whole map, a full glyph zoomed in), the few marks that
 * differ star by star, and names placed clear of each other. Stars outside
 * the focus are never drawn one by one, and nothing is blurred per frame.
 */
import { GLYPH_LARGE, GLYPH_SMALL, LOCKED_RING_ALPHA, SMALL_CUT_BELOW, starPath, type GlyphCut } from '@/features/starmap/render/glyph'
import { aroundDisc, belongsTo, boxHitsCircle, placeLabel, type Box, type Circle, type Segment } from '@/features/starmap/render/labels'
import { DRAG, panoramaDot, panoramaLook, ramp, reachFade, REVEAL, type Ramp } from '@/features/starmap/view/semanticZoom'
import { createTileCache, nebulaStateKeys, tileKey, tileSizeFor, TILE_REACH, type TileCache } from '@/features/starmap/render/nebulaTiles'
import { CLOUD_REACH, galaxyHazeAlpha, galaxyHazeBox, nebulaGlowAlpha, paintGalaxy, paintGalaxyHaze, paintNebulaCloud } from '@/features/starmap/render/galaxy'
import { createGalaxyNames } from '@/features/starmap/render/galaxyNames'
import { drawLinks } from '@/features/starmap/render/links'
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

/** A name's fade (#134): how far in it is, the side it took, whether it had a place last frame. */
type LabelFade = { alpha: number; slot: number; placed: boolean; seen: number }

/** Glyph sizes (px) over which the small cut gives way to the large (#134). */
const GLYPH_CUT_FADE: Ramp = [28, 32]
/**
 * The small cut is drawn bolder than the large (its star fills more of its
 * box), so swapping them at one size would shrink every glyph. From
 * `SMALL_CUT_EASE_FROM` px up to the swap it is drawn a little smaller, until
 * it is exactly the large cut's size there -- linearly over a range wide
 * enough (over twice its start) that a glyph still only ever grows as the zoom does.
 */
const SMALL_CUT_EASE_FROM = 12
const CUT_MATCH = GLYPH_LARGE.lit.tip / GLYPH_LARGE.box / (GLYPH_SMALL.lit.tip / GLYPH_SMALL.box)
function smallCutScale(box: number): number {
  const t = Math.max(0, Math.min(1, (box - SMALL_CUT_EASE_FROM) / (SMALL_CUT_BELOW - SMALL_CUT_EASE_FROM)))
  return 1 - (1 - CUT_MATCH) * t
}

/**
 * A nebula's name sits by its rim, but never more than this far (px) from its
 * centre: zoomed in, the name stays with its stars instead of riding out on
 * a rim that has left the screen (#134).
 */
const NEBULA_NAME_RING = 160

/** At most this many star names at once. */
const STAR_NAMES_AT_MOST = REVEAL.starNamesAtMost

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
} as const

/** How far past the viewport the cached light of one sky reaches, as a share of the longer side. */
const LIGHT_MARGIN = 0.25
/** The most pixels that cached light may hold (about 48 MB). */
const LIGHT_PIXELS = 12_000_000

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
  let sprites: { small: Sprite[]; large: Sprite[]; dots: HTMLCanvasElement[]; quietDots: HTMLCanvasElement[]; dotGlows: HTMLCanvasElement[] } | null = null
  let snapshotCanvas: HTMLCanvasElement | null = null
  let skyCanvas: HTMLCanvasElement | null = null
  /** One sky: each galaxy's haze, painted once per sky and theme. */
  let galaxyHazes: HTMLCanvasElement[] = []
  let hazesFor = ''
  let stateKeys: string[] = []
  let stateKeysJoined = ''
  /** One sky: galaxy haze and nebula clouds as one image, while the zoom holds still. */
  const lightCache: { canvas: HTMLCanvasElement | null; key: string; ox: number; oy: number; margin: number } = {
    canvas: null,
    key: '',
    ox: 0,
    oy: 0,
    margin: 0,
  }
  let lastLightKey = ''
  /** Names on screen and fading, by `s<star>` / `n<nebula>` (#134). */
  const labelFades = new Map<string, LabelFade>()
  let lastLabelTime: number | null = null
  let labelFrame = 0
  /** Measured name widths, CSS px, per star and nebula of the current data. */
  let starNameWidths: (number | undefined)[] = []
  let nebulaNameWidths: (number | undefined)[] = []
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

  /**
   * A dot sprite per state: a core of radius 1/4 of the sprite, a soft glow
   * for lit ones (`glow`), or only the glow (`'glow'`) or only the core
   * (`'core'`), which the panorama crossfades (#137: lit dots lose their glow far out).
   */
  const buildDots = (part: 'both' | 'glow' | 'core' = 'both'): HTMLCanvasElement[] => {
    const size = 32
    return [STATE_LIT, STATE_IN_PROGRESS, STATE_READY, STATE_LOCKED].map((state) => {
      const dot = DOT[state]
      const sprite = makeCanvas(size, size)
      const s = sprite.getContext('2d')
      if (s && theme) {
        s.translate(size / 2, size / 2)
        if (dot.glow && part !== 'core') halo(s, size * 0.22, size * 0.12, theme.lit, 0.35)
        if (part !== 'glow') {
          disc(s, (size / 4) * dot.radius, dot.lit ? theme.lit : theme.text, dot.alpha)
          if (state === STATE_LIT) disc(s, size * 0.08, theme.litCore)
        }
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
  const galaxyNames = createGalaxyNames(makeCanvas)
  let tilesFor = ''

  const rebuild = () => {
    if (!theme) return
    sprites = {
      small: buildSprites(GLYPH_SMALL, LARGEST_BOX.small),
      large: buildSprites(GLYPH_LARGE, LARGEST_BOX.large),
      dots: buildDots(),
      quietDots: buildDots('core'),
      dotGlows: buildDots('glow'),
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
      galaxyNames.clear()
      starNameWidths = []
      nebulaNameWidths = []
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
      starNameWidths = []
      nebulaNameWidths = []
      labelFades.clear()
      stateKeys = nebulaStateKeys(next.state, next.nebula, next.nebulae.length)
      stateKeysJoined = stateKeys.join('|')
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
      // The panorama's light (#137): 1 at the farthest zoom of one sky, 0 once past it.
      const look = frame.pastPanorama === undefined ? 0 : panoramaLook(frame.pastPanorama, frame.starPx)
      const { state, count } = scene
      const nebulaCount = scene.nebulae.length
      const onScreen = (px: number, py: number, r: number) => px + r > 0 && py + r > 0 && px - r < width && py - r < height
      // Around a chosen nebula the others step back; `chosenAmount` and `nebulaLift` ease it in and out (#134).
      const chosenAmount = frame.chosenAmount ?? (frame.chosenNebula >= 0 ? 1 : 0)
      const nebulaDim = (n: number) => {
        const lift = frame.nebulaLift ? frame.nebulaLift[n] ?? 0 : n === frame.chosenNebula ? 1 : 0
        return 1 - (1 - Math.max(frame.dim, 0.6)) * chosenAmount * (1 - lift)
      }
      const tileOf = (n: number, reach: number) => {
        const nebula = scene.nebulae[n]
        return tiles.get(n, `${tileKey(scene.mapKey, nebula.topicId, nebula.lit, nebula.total)}:${stateKeys[n]}`, tileSizeFor(reach * 2, dpr, scene.galaxy ? 512 : 256))
      }

      // One sky: the galaxies' haze, then each nebula's cloud, brighter with
      // its lit share (#117), core first: lit stars warm it from within.
      // `(dx, dy)` shifts it, `margin` widens what counts as in view. In view is
      // judged before the shift, on screen coordinates: judged after it, the
      // cache would leave out the right and bottom margins (#123).
      const paintLight = (target: CanvasRenderingContext2D, dx: number, dy: number, margin: number) => {
        target.imageSmoothingEnabled = true
        const inView = (px: number, py: number, r: number) =>
          px + r > -margin && py + r > -margin && px - r < width + margin && py - r < height + margin
        scene.galaxies?.forEach((galaxy, g) => {
          const haze = galaxyHazes[g]
          if (!haze) return
          const box = galaxyHazeBox(galaxy)
          // On the ring, at the galaxy's copy nearest the view, like its nebulae and stars (#120).
          const turn = frame.galaxyShift?.[g] ?? 0
          const x0 = frame.ox + (box.x0 + turn) * frame.scale + dx
          const x1 = frame.ox + (box.x1 + turn) * frame.scale + dx
          if (x1 - dx < -margin || x0 - dx > width + margin) return
          target.globalAlpha = galaxyHazeAlpha(look) * galaxy.dim
          target.drawImage(haze, x0, frame.oy + box.y0 * frame.scale + dy, x1 - x0, (box.y1 - box.y0) * frame.scale)
        })
        for (let n = 0; n < nebulaCount; n += 1) {
          const reach = nebulaR[n] * CLOUD_REACH
          if (!inView(nebulaX[n], nebulaY[n], reach)) continue
          const nebula = scene.nebulae[n]
          const litShare = nebula.total > 0 ? nebula.lit / nebula.total : 0
          target.globalAlpha = nebulaGlowAlpha(litShare, look) * (nebula.dim ?? 1) * nebulaDim(n)
          target.drawImage(tileOf(n, reach).haze, nebulaX[n] - reach + dx, nebulaY[n] - reach + dy, reach * 2, reach * 2)
        }
        target.globalAlpha = 1
      }

      if (scene.galaxy) {
        // While the zoom holds still (a pan, a glide, breathing), the light is
        // one cached image moved with the map; it is repainted when the zoom
        // changes, a star changes state, or the pan runs past its margin.
        // A galaxy moving to its other copy on the ring (#120) is a new picture too.
        const turns = frame.galaxyShift ? Array.prototype.join.call(frame.galaxyShift, ',') : ''
        const key = `${scene.mapKey}|${stateKeysJoined}|${frame.scale}|${frame.chosenNebula}|${frame.dim}|${frame.emphasisKey ?? ''}|${width}x${height}@${dpr}|${turns}`
        const shiftX = frame.ox - lightCache.ox
        const shiftY = frame.oy - lightCache.oy
        const margin = Math.round(Math.max(width, height) * LIGHT_MARGIN)
        const covered = lightCache.canvas && lightCache.key === key && Math.abs(shiftX) <= lightCache.margin && Math.abs(shiftY) <= lightCache.margin
        if (!covered && key === lastLightKey) {
          // A second frame at this zoom: worth caching.
          const pixels = Math.min(dpr, Math.sqrt(LIGHT_PIXELS / ((width + 2 * margin) * (height + 2 * margin))))
          const canvasWidth = Math.max(1, Math.round((width + 2 * margin) * pixels))
          const canvasHeight = Math.max(1, Math.round((height + 2 * margin) * pixels))
          lightCache.canvas ??= makeCanvas(canvasWidth, canvasHeight)
          lightCache.canvas.width = canvasWidth
          lightCache.canvas.height = canvasHeight
          const light = lightCache.canvas.getContext('2d')
          if (light) {
            light.setTransform(pixels, 0, 0, pixels, 0, 0)
            paintLight(light, margin, margin, margin)
            Object.assign(lightCache, { key, ox: frame.ox, oy: frame.oy, margin })
          }
        }
        if (lightCache.canvas && lightCache.key === key && Math.abs(frame.ox - lightCache.ox) <= lightCache.margin && Math.abs(frame.oy - lightCache.oy) <= lightCache.margin) {
          ctx.globalAlpha = 1
          ctx.imageSmoothingEnabled = true
          const m = lightCache.margin
          ctx.drawImage(lightCache.canvas, frame.ox - lightCache.ox - m, frame.oy - lightCache.oy - m, width + 2 * m, height + 2 * m)
        } else {
          paintLight(ctx, 0, 0, 0)
        }
        lastLightKey = key
        // Far out, each galaxy's name, very faint, under its stars (#137 A3).
        stats.galaxyNames = galaxyNames.draw(ctx, scene, frame, colours, dpr)
      }

      // Haze under every nebula (one sky: its cloud, above), and the blurred stars of those outside the focus.
      ctx.imageSmoothingEnabled = true
      for (let n = 0; n < nebulaCount; n += 1) {
        const reach = nebulaR[n] * (scene.galaxy ? CLOUD_REACH : TILE_REACH)
        if (!onScreen(nebulaX[n], nebulaY[n], reach)) continue
        const tile = tileOf(n, reach)
        const box = [nebulaX[n] - reach, nebulaY[n] - reach, reach * 2, reach * 2] as const
        if (!scene.galaxy) {
          ctx.globalAlpha = nebulaDim(n)
          ctx.drawImage(tile.haze, ...box)
        }
        const blurred = 1 - sharpness[n]
        if (blurred > 0.01) {
          ctx.globalAlpha = blurred * nebulaDim(n) * (scene.nebulae[n].dim ?? 1)
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

      // Connection lines (#121): by layer and tier, in their own module. Names keep clear of what it lists.
      const segments: Segment[] = []
      const cores: Circle[] = []
      for (let n = 0; n < nebulaCount; n += 1) cores.push({ x: nebulaX[n], y: nebulaY[n], r: nebulaR[n] * 0.9 })
      const placed: Box[] = []
      // The ring (#120) is on whenever the engine shifts galaxies; lines then take the shorter side.
      stats.links = drawLinks(ctx, scene, frame, colours, { segments, boxes: placed }, { wrap: frame.galaxyShift !== undefined })

      const breath = frame.breath
      const glyphs = 1 - frame.dotBlend
      // The glyph's two cuts (#134): as a glyph grows past SMALL_CUT_BELOW the
      // bolder small cut gives way to the large one over GLYPH_CUT_FADE -- the
      // large fades in, then the small fades out, and the marks' geometry is
      // blended between the two -- so a continuous zoom never swaps one look
      // for the other in a single frame.
      const largeIn = (box: number) => ramp(box, [GLYPH_CUT_FADE[0], SMALL_CUT_BELOW])
      const smallOut = (box: number) => 1 - ramp(box, [SMALL_CUT_BELOW, GLYPH_CUT_FADE[1]])
      /** One measure of the glyph at `box` px, in px: the two cuts' own, blended by size. */
      const geom = (box: number, pick: (cut: GlyphCut) => number) => {
        const t = ramp(box, GLYPH_CUT_FADE)
        return box * ((1 - t) * (pick(GLYPH_SMALL) / GLYPH_SMALL.box) * smallCutScale(box) + t * (pick(GLYPH_LARGE) / GLYPH_LARGE.box))
      }
      const margin = Math.max(frame.glyphSize, 16) * 2
      const visible = (i: number) => {
        const px = x[i]
        const py = y[i]
        return !(px < -margin || py < -margin || px > width + margin || py > height + margin)
      }
      // A recommended star is always a full glyph, at least 12 px: the way in.
      const beacons = new Set(scene.recommendations ?? (scene.recommended >= 0 ? [scene.recommended] : []))
      const isBeacon = (i: number) => beacons.has(i)
      // Grows with the zoom like every glyph, never under 12 px: no jump as dots turn to glyphs (#134).
      const beaconSize = Math.max(12, Math.min(frame.glyphSize, 32))
      // How much of itself a star keeps: the focus star all, the rest `frame.dim`;
      // while a star is dragged (#136) it and its linked stars all, the rest fade further.
      const drag = frame.drag
      const dragDim = drag ? 1 - (1 - DRAG.dimStars) * drag.amount : 1
      const kept = (i: number) => (drag && drag.related[i] === 1 ? 1 : (i === frame.focusStar ? 1 : frame.dim) * dragDim)
      /** The dragged star grows a little while it is held. */
      const grown = (i: number) => (drag && drag.star === i ? drag.grow : 1)

      const dotLooks = [STATE_LIT, STATE_IN_PROGRESS, STATE_READY, STATE_LOCKED].map((st) => panoramaDot(DOT[st].lit, look))
      // Stars in focus: dots on the whole map, glyphs zoomed in, crossfading between.
      // A dragged star is drawn last, over the stars it passes.
      const lastStar = drag ? drag.star : count - 1
      for (let j = 0; j < count; j += 1) {
        const i = j < lastStar ? j : j === count - 1 ? lastStar : j + 1
        const a = starAlpha[i]
        if (a < DRAW_THRESHOLD || !visible(i)) continue
        const focus = kept(i) * (scene.nebulae[scene.nebula[i]]?.dim ?? 1)
        const beacon = isBeacon(i)
        const breathing = breath && breath.index === i
        if (glyphs > 0.01 || beacon) {
          const box = beacon ? beaconSize : frame.glyphSize
          const alpha = a * (beacon ? 1 : glyphs) * (breathing ? breath.alpha : 1) * focus
          const grow = (breathing ? breath.scale : 1) * grown(i)
          for (const [sprites, cut, share] of [[set.small, GLYPH_SMALL, smallOut(box)], [set.large, GLYPH_LARGE, largeIn(box)]] as const) {
            if (share < 0.01) continue
            const sprite = sprites[state[i]]
            const size = (box * grow * sprite.extent * 2 * (cut === GLYPH_SMALL ? smallCutScale(box) : 1)) / cut.box
            ctx.globalAlpha = alpha * share
            ctx.drawImage(sprite.canvas, x[i] - size / 2, y[i] - size / 2, size, size)
          }
        }
        if (frame.dotBlend > 0.01 && !beacon) {
          // On the panorama a lit star is a small, dim dot without its glow: the light is its nebula's (#137 A2).
          const quiet = dotLooks[state[i]]
          const size = frame.dotRadius * 4 * quiet.radius
          const alpha = a * frame.dotBlend * focus * quiet.alpha
          const at = [x[i] - size / 2, y[i] - size / 2, size, size] as const
          if (quiet.glow >= 0.99 || !DOT[state[i]].glow) {
            ctx.globalAlpha = alpha
            ctx.drawImage(set.dots[state[i]], ...at)
          } else {
            if (quiet.glow > 0.01) {
              ctx.globalAlpha = alpha * quiet.glow
              ctx.drawImage(set.dotGlows[state[i]], ...at)
            }
            ctx.globalAlpha = alpha
            ctx.drawImage(set.quietDots[state[i]], ...at)
          }
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
        const skills = frame.showSkills > 0.01 ? scene.skills[i] : undefined
        if (!beacon && !inProgress && !review && !skills?.length) continue
        const px = x[i]
        const py = y[i]
        const box = beacon ? beaconSize : frame.glyphSize
        const grow = (breath && breath.index === i ? breath.scale : 1) * grown(i)
        const fade = a * show * kept(i)
        if (glyphs > 0.01 && inProgress && scene.progress[i] > 0) {
          ctx.globalAlpha = fade
          ctx.strokeStyle = colours.lit
          ctx.lineWidth = geom(box, (c) => c.inProgress.ringWidth) * grow
          ctx.beginPath()
          ctx.arc(px, py, geom(box, (c) => c.inProgress.ring) * grow, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, scene.progress[i]))
          ctx.stroke()
        }
        if (beacon) {
          ctx.globalAlpha = fade
          ctx.save()
          ctx.translate(px, py)
          halo(ctx, geom(box, (c) => c.recommended.halo) * grow, geom(box, (c) => c.recommended.blur) * grow, colours.lit, GLYPH_LARGE.recommended.haloAlpha)
          ctx.setLineDash([geom(box, (c) => c.recommended.dash[0]) * grow, geom(box, (c) => c.recommended.dash[1]) * grow])
          ring(ctx, geom(box, (c) => c.recommended.ring) * grow, geom(box, (c) => c.recommended.ringWidth) * grow, colours.lit, 1)
          ctx.restore()
        }
        if (glyphs > 0.01 && review) {
          const offset = geom(box, (c) => c.review.offset) / Math.SQRT2
          const radius = geom(box, (c) => c.review.radius)
          ctx.globalAlpha = fade
          ctx.fillStyle = colours.sky
          ctx.beginPath()
          ctx.arc(px + offset, py - offset, radius + geom(box, (c) => c.review.outline), 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = colours.text
          ctx.beginPath()
          ctx.arc(px + offset, py - offset, radius, 0, Math.PI * 2)
          ctx.fill()
        }
        if (skills?.length) {
          // Skill points: small dots on an arc over the star, clear of its name (#72 point 1).
          const radius = frame.glyphSize * 0.62
          const dot = Math.max(1.6, frame.glyphSize * 0.045)
          skills.forEach((lit, k) => {
            const angle = Math.PI * (7 / 6 + ((2 / 3) * (k + 0.5)) / skills.length)
            ctx.globalAlpha = fade * Math.min(1, frame.showSkills)
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

      // Names (#134: by zoom). Each stays by its own nebula or star; a name
      // with no free place is left out, and one whose nebula is off screen is
      // not drawn. Names stay out of the bands the page keeps for its own
      // controls: the placer only considers spots inside this area. A name
      // that gains or loses its place fades in or out (`labelFadeMs`) instead
      // of blinking, and keeps its place and side while it can.
      const labelArea: Box = { x0: 0, y0: viewport.top ?? 0, x1: width, y1: height - (viewport.bottom ?? 0) }
      const fadeStep = !(frame.labelFadeMs && frame.labelFadeMs > 0) || frame.time === undefined || lastLabelTime === null
        ? 1
        : Math.max(0, frame.time - lastLabelTime) / frame.labelFadeMs
      lastLabelTime = frame.time ?? null
      labelFrame += 1
      let settling = false
      const names = { stars: 0, nebulae: 0 }
      const fadeOf = (key: string): LabelFade => {
        let entry = labelFades.get(key)
        if (!entry) {
          entry = { alpha: 0, slot: -1, placed: false, seen: 0 }
          labelFades.set(key, entry)
        }
        entry.seen = labelFrame
        return entry
      }
      const settle = (entry: LabelFade, placed: boolean) => {
        entry.alpha = placed ? Math.min(1, entry.alpha + fadeStep) : Math.max(0, entry.alpha - fadeStep)
        entry.placed = placed
        if (entry.alpha > 0 && entry.alpha < 1) settling = true
      }
      /** The candidate boxes with the side the name had last frame first: a name does not hop sides. */
      const preferring = (boxes: Box[], slot: number) => (slot > 0 && slot < boxes.length ? [boxes[slot], ...boxes.filter((_, k) => k !== slot)] : boxes)

      // Star names: nearest the focus point first, more as the zoom grows.
      if (frame.starLabelAlpha > 0.01) {
        setFont(13, 500)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const glyphR = Math.max(frame.glyphSize * 0.42, frame.dotRadius * 2)
        const radiusOf = (i: number) => (isBeacon(i) ? beaconSize * 0.45 : glyphR)
        // The stars on screen, in a grid, so a name only checks its neighbours.
        const cell = 64
        const grid = new Map<number, number[]>()
        const cellKey = (cx: number, cy: number) => (cx + 1024) * 4096 + (cy + 1024)
        const listed: number[] = []
        for (let i = 0; i < count; i += 1) {
          if (starAlpha[i] < DRAW_THRESHOLD || !visible(i)) continue
          listed.push(i)
          const k = cellKey(Math.floor(x[i] / cell), Math.floor(y[i] / cell))
          const bucket = grid.get(k)
          if (bucket) bucket.push(i)
          else grid.set(k, [i])
        }
        const reachR = Math.max(glyphR, beaconSize * 0.45)
        const near = (box: Box, own: number): Circle[] => {
          const out: Circle[] = []
          for (let cx = Math.floor((box.x0 - reachR) / cell); cx <= Math.floor((box.x1 + reachR) / cell); cx += 1) {
            for (let cy = Math.floor((box.y0 - reachR) / cell); cy <= Math.floor((box.y1 + reachR) / cell); cy += 1) {
              for (const j of grid.get(cellKey(cx, cy)) ?? []) if (j !== own) out.push({ x: x[j], y: y[j], r: radiusOf(j) })
            }
          }
          return out
        }
        const reach = frame.starNameReach
        const candidates: { i: number; base: number; d: number; was: boolean }[] = []
        for (const i of listed) {
          if (x[i] < 0 || y[i] < 0 || x[i] > width || y[i] > height) continue
          const d = reach ? Math.hypot(x[i] - reach.x, y[i] - reach.y) : 0
          // The dragged star keeps its name wherever the hand takes it (#136).
          const base = frame.starLabelAlpha * (reach && !(drag && drag.star === i) ? reachFade(d, reach) : 1)
          const known = labelFades.get(`s${i}`)
          if (base < 0.01 && !(known && known.alpha > 0)) continue
          candidates.push({ i, base, d, was: known?.placed ?? false })
        }
        // The dragged star first, the focused star next, then the names already up (they keep their place), then by distance.
        const first = (i: number) => (drag && drag.star === i ? -2 : i === frame.focusStar ? -1 : 0)
        candidates.sort((a, b) =>
          first(a.i) - first(b.i) || Number(b.was) - Number(a.was) || a.d - b.d)
        let placedNames = 0
        for (const { i, base } of candidates) {
          const entry = fadeOf(`s${i}`)
          const nameWidth = (starNameWidths[i] ??= ctx.measureText(scene.names[i]).width + 6)
          const boxes = aroundDisc(x[i], y[i], radiusOf(i), nameWidth, 17, 3)
          let box: Box | null = null
          if (base >= 0.01 && placedNames < STAR_NAMES_AT_MOST) {
            const circles = near({ x0: x[i] - nameWidth, y0: y[i] - 40, x1: x[i] + nameWidth, y1: y[i] + 40 }, i)
            // The dragged star is held over the others, which step back, and its own lines
            // leave it every way: its name goes where it is least in the way (#136).
            const held = Boolean(drag && drag.star === i)
            const found = placeLabel(preferring(boxes, entry.slot), { boxes: placed, circles, segments: held ? [] : segments }, labelArea)
            // A star's name may not sit on another star at all.
            box = found && (held || !circles.some((c) => boxHitsCircle(found, c))) ? found : null
          }
          settle(entry, box !== null)
          if (box) {
            placed.push(box)
            placedNames += 1
            entry.slot = boxes.indexOf(box)
          }
          const at = box ?? (entry.slot >= 0 ? boxes[entry.slot] : null)
          if (!at || entry.alpha <= 0.001) continue
          const color =
            state[i] === STATE_LIT || state[i] === STATE_IN_PROGRESS ? colours.text : state[i] === STATE_READY ? colours.textBody : colours.textCaption
          ctx.globalAlpha = Math.min(1, base * entry.alpha * kept(i))
          outlinedText(scene.names[i], (at.x0 + at.x1) / 2, at.y0 + 1, color, colours.sky, 3)
          names.stars += 1
        }
      }

      // Nebula names, by their own nebula: by its size on screen (#134), and
      // the one hovered or in keyboard focus wherever nebula names are drawn.
      if (frame.nebulaLabelAlpha > 0.01) {
        setFont(12, 600)
        setLetterSpacing('1.5px')
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const priority = frame.highlightNebula >= 0 ? frame.highlightNebula : frame.hoveredNebula ?? -1
        const wholeMap = frame.wholeMap ?? frame.chosenNebula < 0
        const limit = width < 768 && frame.chosenNebula < 0 ? 4 : nebulaCount
        const nameOf = (n: number) => (frame.nebulaNames ? frame.nebulaNames[n] ?? 0 : 1)
        const order: { n: number; base: number; was: boolean; d: number }[] = []
        for (let n = 0; n < nebulaCount; n += 1) {
          if (n === frame.chosenNebula) continue
          if (nebulaX[n] < 0 || nebulaY[n] < 0 || nebulaX[n] > width || nebulaY[n] > height) continue
          const base = n === priority ? Math.max(nameOf(n), frame.priorityNameAlpha ?? 1) : nameOf(n)
          const known = labelFades.get(`n${n}`)
          if (base < 0.01 && !(known && known.alpha > 0)) continue
          order.push({ n, base, was: known?.placed ?? false, d: Math.hypot(nebulaX[n] - width / 2, nebulaY[n] - height / 2) })
        }
        order.sort((a, b) => (a.n === priority ? -1 : 0) - (b.n === priority ? -1 : 0) || Number(b.was) - Number(a.was) || a.d - b.d)
        let labelled = 0
        for (const { n, base } of order) {
          const entry = fadeOf(`n${n}`)
          const text = scene.nebulae[n].name.toLocaleUpperCase()
          const nameWidth = (nebulaNameWidths[n] ??= ctx.measureText(text).width + 8)
          const own = { x: nebulaX[n], y: nebulaY[n], r: nebulaR[n] }
          const others = cores.filter((_, m) => m !== n)
          const candidates = aroundDisc(own.x, own.y, Math.min(own.r * 0.95, NEBULA_NAME_RING), nameWidth, 16, 6)
          let box: Box | null = null
          if (base >= 0.01 && (labelled < limit || n === priority)) {
            const obstacles = { boxes: placed, circles: others, segments }
            const preferred = preferring(candidates, entry.slot)
            box =
              placeLabel(preferred, obstacles, labelArea,
                (candidate) => belongsTo(candidate, own, others) && !others.some((c) => boxHitsCircle(candidate, c)) ? 0 : Infinity) ??
              // The hovered or focused name far out on one sky: a nebula packed
              // among others has no side nearer itself than its neighbours, so
              // there being nearer is a preference, not a rule -- the pointer says whose name it is.
              (scene.galaxy && wholeMap && n === priority ? placeLabel(preferred, obstacles, labelArea, (candidate) => (belongsTo(candidate, own, others) ? 0 : 20)) : null)
          }
          settle(entry, box !== null)
          if (box) {
            labelled += 1
            placed.push(box)
            entry.slot = candidates.indexOf(box)
          }
          const at = box ?? (entry.slot >= 0 ? candidates[entry.slot] : null)
          if (!at || entry.alpha <= 0.001) continue
          ctx.globalAlpha = Math.min(1, frame.nebulaLabelAlpha * base * entry.alpha * INK.nebulaName.alpha * nebulaDim(n))
          outlinedText(text, (at.x0 + at.x1) / 2, at.y0 + 2, colours.textBody, colours.sky, INK.nebulaName.outline)
          names.nebulae += 1
        }
        setLetterSpacing('0px')
      }
      // Names no longer in play are forgotten (they had faded with the zoom).
      for (const [key, entry] of labelFades) if (entry.seen !== labelFrame) labelFades.delete(key)
      stats.names = names
      stats.settling = settling

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
      lightCache.canvas = null
      data = null
      tiles.clear()
    },
  }
}

