/*
 * Galaxy names (#137, round two A3 of #123). Far out, each galaxy carries its
 * subject's name -- MATHEMATICS, PHYSICS, CHEMISTRY, in the student's
 * language as the read model names the subject -- very faint and large, so a
 * galaxy reads as one whole. It sits under the galaxy's lowest stars,
 * anchored to the map and growing with it, and fades out continuously as the
 * zoom passes the panorama (`galaxyNameAlpha`), so it never pops; a
 * neighbour's name fades as it moves aside (`galaxyNameAside`). A subject the
 * student does not take keeps its whole galaxy dimmed, its name too.
 *
 * Decorative text (WCAG 1.4.3 "incidental"): the same name is the page's
 * heading and the switcher's segment, both readable; the canvas name is
 * deliberately low contrast and is never the only place a name is said.
 * Its ink is the `--starmap-galaxy-name` sky token, recorded with
 * `gate: false` in scripts/contrast-pairs.json.
 */
import type { SceneData, SceneFrame, StarMapTheme } from '@/features/starmap/render/types'
import { galaxyNameAlpha, PANORAMA, ramp } from '@/features/starmap/view/semanticZoom'

/** The ink when the theme does not bring the token (tests): the token's value. */
export const GALAXY_NAME_INK = 'rgba(214, 222, 255, 0.13)'

/** `rgb()`/`rgba()`/`#RRGGBB` with its alpha multiplied by `alpha`. */
function fade(colour: string, alpha: number): string {
  const value = colour.trim()
  let parts: number[]
  if (value.startsWith('#')) parts = [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16))
  else parts = value.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255]
  const a = (parts[3] ?? 1) * alpha
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${Math.max(0, Math.min(1, a))})`
}

/** A galaxy name's font size, CSS px, for the galaxy's width on screen. */
export function galaxyNameSize(galaxyWidthPx: number): number {
  const { size, minPx, maxPx } = PANORAMA.galaxyName
  return Math.max(minPx, Math.min(maxPx, galaxyWidthPx * size))
}

/** A galaxy name's share of its alpha with its middle `offsetPx` from the view's centre, on a screen `width` px wide. */
export function galaxyNameAside(offsetPx: number, width: number): number {
  return width > 0 ? 1 - ramp(Math.abs(offsetPx) / width, PANORAMA.galaxyName.aside) : 1
}

/** Where and how strongly one galaxy's name is drawn this frame. */
export type GalaxyNamePlacement = { galaxy: number; text: string; x: number; y: number; px: number; alpha: number }

/**
 * Every galaxy name on screen and not yet faded out: its text (the subject's
 * name, upper case), its middle, its size and its alpha (the token's own
 * alpha times its visibility, the galaxy's dimming and how far aside it is).
 */
export function galaxyNamePlacements(scene: SceneData, frame: SceneFrame, theme: StarMapTheme): GalaxyNamePlacement[] {
  const galaxies = scene.galaxies
  if (!galaxies || frame.pastPanorama === undefined) return []
  const visibility = galaxyNameAlpha(frame.pastPanorama)
  if (visibility < 0.01) return []
  const { width, height } = frame.viewport
  const inkAlpha = alphaOf(theme.galaxyName ?? GALAXY_NAME_INK)
  const { tracking, below } = PANORAMA.galaxyName
  const out: GalaxyNamePlacement[] = []
  galaxies.forEach((galaxy, g) => {
    const turn = frame.galaxyShift?.[g] ?? 0
    const x0 = frame.ox + (galaxy.x0 + turn) * frame.scale
    const x1 = frame.ox + (galaxy.x1 + turn) * frame.scale
    const px = galaxyNameSize(x1 - x0)
    const y = frame.oy + galaxy.y1 * frame.scale + px * below
    const text = galaxy.name.toLocaleUpperCase()
    // A rough reach (the measured width is not needed to skip a galaxy far off screen).
    const reach = (px * (0.62 + tracking) * text.length) / 2
    const x = (x0 + x1) / 2
    const alpha = inkAlpha * visibility * galaxy.dim * galaxyNameAside(x - width / 2, width)
    if (alpha < 0.002 || x + reach < 0 || x - reach > width || y + px < 0 || y - px > height) return
    out.push({ galaxy: g, text, x, y, px, alpha })
  })
  return out
}

function alphaOf(colour: string): number {
  const parts = colour.trim().startsWith('#') ? [] : (colour.match(/[\d.]+/g)?.map(Number) ?? [])
  return parts[3] ?? 1
}

type MakeCanvas = (width: number, height: number) => HTMLCanvasElement

/** Sprites are set at sizes this many steps per octave apart, and drawn scaled by less than one step. */
const SPRITE_STEPS_PER_OCTAVE = 8
/** At most this many sprites are kept (a zoom out and in again sets a few sizes). */
const SPRITES_KEPT = 24

/**
 * The names as the renderer draws them: each name is set once per size step
 * into its own sprite, and each frame only places and fades it, at nearly
 * its own size -- no text is shaped while the map pans, and no large image
 * is resampled.
 */
export function createGalaxyNames(makeCanvas: MakeCanvas) {
  const sprites = new Map<string, { canvas: HTMLCanvasElement; size: number; width: number; height: number }>()
  const spriteFor = (text: string, px: number, theme: StarMapTheme, dpr: number) => {
    const ink = fade(theme.galaxyName ?? GALAXY_NAME_INK, 1 / Math.max(1e-6, alphaOf(theme.galaxyName ?? GALAXY_NAME_INK)))
    const size = 2 ** (Math.round(Math.log2(px) * SPRITE_STEPS_PER_OCTAVE) / SPRITE_STEPS_PER_OCTAVE)
    const key = `${text}|${size}|${ink}|${theme.fontFamily}|${dpr}`
    const hit = sprites.get(key)
    if (hit) return hit
    if (sprites.size >= SPRITES_KEPT) sprites.delete(sprites.keys().next().value!)
    const { tracking, weight } = PANORAMA.galaxyName
    const scale = Math.max(1, dpr)
    const font = `${weight} ${size * scale}px ${theme.fontFamily}`
    const spacing = Math.round(size * tracking * scale)
    const probe = makeCanvas(1, 1).getContext('2d')
    let measured = text.length * size * scale * 0.7
    if (probe) {
      probe.font = font
      if ('letterSpacing' in probe) (probe as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`
      measured = probe.measureText(text)?.width ?? measured
    }
    const width = Math.ceil(measured + spacing + size * scale * 0.5)
    const height = Math.ceil(size * scale * 1.6)
    const canvas = makeCanvas(width, height)
    const c = canvas.getContext('2d')
    if (c) {
      c.font = font
      if ('letterSpacing' in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillStyle = ink
      // Letter spacing adds a trailing space after the last letter: shift by half of it to stay centred.
      c.fillText(text, width / 2 + spacing / 2, height / 2)
    }
    const sprite = { canvas, size, width: width / scale, height: height / scale }
    sprites.set(key, sprite)
    return sprite
  }
  return {
    /** Draws every name in view; returns how many. */
    draw(ctx: CanvasRenderingContext2D, scene: SceneData, frame: SceneFrame, theme: StarMapTheme, dpr: number): number {
      const placements = galaxyNamePlacements(scene, frame, theme)
      for (const name of placements) {
        const sprite = spriteFor(name.text, name.px, theme, dpr)
        const k = name.px / sprite.size
        ctx.globalAlpha = Math.min(1, name.alpha)
        ctx.drawImage(sprite.canvas, name.x - (sprite.width * k) / 2, name.y - (sprite.height * k) / 2, sprite.width * k, sprite.height * k)
      }
      ctx.globalAlpha = 1
      return placements.length
    },
    clear() {
      sprites.clear()
    },
  }
}
