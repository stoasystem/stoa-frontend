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

/**
 * Draws every galaxy's name that is on screen and not yet faded out. Returns
 * how many it drew (for the render stats and tests).
 */
export function drawGalaxyNames(ctx: CanvasRenderingContext2D, scene: SceneData, frame: SceneFrame, theme: StarMapTheme): number {
  const galaxies = scene.galaxies
  if (!galaxies || frame.pastPanorama === undefined) return 0
  const visibility = galaxyNameAlpha(frame.pastPanorama)
  if (visibility < 0.01) return 0
  const { width, height } = frame.viewport
  const ink = theme.galaxyName ?? GALAXY_NAME_INK
  const { tracking, weight, below } = PANORAMA.galaxyName
  const canSpace = 'letterSpacing' in ctx
  let drawn = 0
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  galaxies.forEach((galaxy, g) => {
    const turn = frame.galaxyShift?.[g] ?? 0
    const x0 = frame.ox + (galaxy.x0 + turn) * frame.scale
    const x1 = frame.ox + (galaxy.x1 + turn) * frame.scale
    const px = galaxyNameSize(x1 - x0)
    const y = frame.oy + galaxy.y1 * frame.scale + px * below
    const text = galaxy.name.toLocaleUpperCase()
    // A rough reach (the measured width is not needed to skip a galaxy far off screen).
    const reach = px * (0.62 + tracking) * text.length / 2
    const cx = (x0 + x1) / 2
    const alpha = visibility * galaxy.dim * galaxyNameAside(cx - width / 2, width)
    if (alpha < 0.005 || cx + reach < 0 || cx - reach > width || y + px < 0 || y - px > height) return
    ctx.font = `${weight} ${px}px ${theme.fontFamily}`
    // Chrome 99+, Safari 18+; elsewhere the name just sits tighter.
    if (canSpace) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(px * tracking)}px`
    ctx.globalAlpha = 1
    ctx.fillStyle = fade(ink, alpha)
    // Letter spacing adds a trailing space after the last letter: shift by half of it to stay centred.
    ctx.fillText(text, cx + (canSpace ? (px * tracking) / 2 : 0), y)
    drawn += 1
  })
  if (canSpace) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'
  ctx.restore()
  return drawn
}
