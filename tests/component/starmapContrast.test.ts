/**
 * The canvas's colours against the sky (review of #71). `check:contrast`
 * rates token pairs in CSS; what the canvas composites -- white at some
 * alpha over the sky, or over nebula haze -- it cannot see, so the same WCAG
 * arithmetic runs here on the real tokens and the renderer's and engine's
 * own alphas, against the sky and against stacked haze.
 *
 *   text (names, legend)        4.5:1
 *   a locked star               3:1 (a control)
 *   lines visible at rest that  3:1 (#121: brightness is relevance now --
 *   carry that message              tier 1, into the recommended star, and
 *                                   tier 2, an in-progress star to its
 *                                   prerequisites; the path walked, lines
 *                                   into locked stars and the panorama's
 *                                   bridges are quiet on purpose, below it)
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { NEBULA_LABEL_ALPHA } from '@/features/starmap/engine/starMapEngine'
import { HAZE, INK } from '@/features/starmap/render/canvas2d'
import { GALAXY_HAZE_ALPHA, KNOWLEDGE_GLOW_ALPHA, NEBULA_GLOW, SKY_MIST_ALPHA } from '@/features/starmap/render/galaxy'
import { LOCKED_RING_ALPHA } from '@/features/starmap/render/glyph'
import { LINK_INK } from '@/features/starmap/render/links'

type RGBA = [number, number, number, number]

const css = readFileSync(path.resolve(__dirname, '../../src/styles/brand-tokens.css'), 'utf8')
const skyBlock = css.slice(css.indexOf('[data-surface="sky"] {'))

function token(name: string): RGBA {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(skyBlock)
  if (!match) throw new Error(`no ${name} in the sky block`)
  const value = match[1].trim()
  if (value.startsWith('#')) {
    return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16), 1]
  }
  const parts = value.match(/[\d.]+/g)!.map(Number)
  return [parts[0], parts[1], parts[2], parts[3] ?? 1]
}

/** `fg` at its own alpha times `alpha`, over an opaque `bg`. */
function over(fg: RGBA, bg: RGBA, alpha = 1): RGBA {
  const a = fg[3] * alpha
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]
}

function luminance([r, g, b]: RGBA): number {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: RGBA, b: RGBA): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const sky = token('--sky')
const text = token('--on-sky-text')
const body = token('--on-sky-text-body')
const caption = token('--on-sky-text-caption')
const lit = token('--lit')
const glass = token('--sky-glass')
/** One nebula's brightest haze: the atmosphere at its core, and full warmth (every star lit). */
const oneHaze = over(lit, over(token('--atmosphere'), sky, HAZE.core), HAZE.warmthBase + HAZE.warmthLit)
/**
 * The realistic worst case: that core with a neighbour's halo laid over it.
 * Nebulae never overlap (the layout keeps their discs apart, tested in
 * starmapLayout), and a tile reaches 1.3 radii, so a neighbour's haze over
 * this core is its outer ring, at most its mid stop -- taken whole here.
 */
const haze = over(token('--atmosphere'), oneHaze, HAZE.mid)
const white: RGBA = [255, 255, 255, 1]

describe('names on the canvas keep 4.5:1', () => {
  it('nebula names, drawn over a sky outline, and over stacked haze, in every layer that shows them', () => {
    const weakest = Math.min(...Object.values(NEBULA_LABEL_ALPHA).filter((alpha) => alpha > 0)) * INK.nebulaName.alpha
    expect(weakest).toBeCloseTo(0.8, 9)
    expect(contrast(over(body, sky, weakest), sky)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(over(body, haze, weakest), haze)).toBeGreaterThanOrEqual(4.5)
    expect(INK.nebulaName.outline).toBeGreaterThanOrEqual(2)
  })

  it('stacked haze is brighter than one nebula alone (the check is not vacuous)', () => {
    expect(contrast(white, haze)).toBeLessThan(contrast(white, oneHaze))
    expect(contrast(white, oneHaze)).toBeLessThan(contrast(white, sky))
  })

  it('star names, the faintest (a locked star) included', () => {
    for (const colour of [text, body, caption]) {
      expect(contrast(over(colour, sky), sky)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(over(colour, haze), haze)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('the legend, on its glass, whatever glows behind it', () => {
    for (const behind of [white, over(lit, sky), haze, sky]) {
      const backing = over(glass, behind)
      expect(contrast(over(body, backing), backing)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

/** A line's ink, alpha in the token, at `strength`, over `bg`. */
const line = (name: string, bg: RGBA, strength = 1) => contrast(over(token(name), bg, strength), bg)

describe('lines by tier (#121) and locked stars', () => {
  it('the canvas falls back to exactly the sky tokens', () => {
    const tokens = {
      recommended: '--starmap-link-recommended',
      inProgress: '--starmap-link-in-progress',
      walked: '--starmap-link-walked',
      locked: '--starmap-link-locked',
      bridge: '--starmap-bridge',
    } as const
    for (const [key, name] of Object.entries(tokens)) {
      const fallback = LINK_INK[key as keyof typeof LINK_INK].match(/[\d.]+/g)!.map(Number)
      expect(token(name)).toEqual([fallback[0], fallback[1], fallback[2], fallback[3] ?? 1])
    }
  })

  it('the tiers seen at rest that say "now" keep 3:1, on the sky and on stacked haze', () => {
    for (const name of ['--starmap-link-recommended', '--starmap-link-in-progress']) {
      expect(line(name, sky)).toBeGreaterThanOrEqual(3)
      expect(line(name, haze)).toBeGreaterThanOrEqual(3)
    }
  })

  it('brightness falls tier by tier; the quiet tiers and the bridges stay below 3:1 on purpose', () => {
    const tiers = ['--starmap-link-recommended', '--starmap-link-in-progress', '--starmap-link-walked'].map((name) => line(name, sky))
    expect(tiers[0]).toBeGreaterThan(tiers[1])
    expect(tiers[1]).toBeGreaterThan(tiers[2])
    // Tier 4 is drawn dashed (about a third inked), so its ink may be a little stronger than tier 3's.
    for (const name of ['--starmap-link-walked', '--starmap-link-locked', '--starmap-bridge']) expect(line(name, sky)).toBeLessThan(3)
  })

  it('a locked star’s ring, on the sky and on stacked haze', () => {
    expect(contrast(over(text, sky, LOCKED_RING_ALPHA), sky)).toBeGreaterThanOrEqual(3)
    expect(contrast(over(text, haze, LOCKED_RING_ALPHA), haze)).toBeGreaterThanOrEqual(3)
  })
})

it('one sky (#119) keeps readable states even at a fully lit nebula’s core', () => {
  // A galaxy's haze under one nebula's cloud at full brightness (every star lit),
  // taken as white -- the stellar grain is -- at the sum of their alphas. Nebula
  // discs never overlap (starmapLayout), so a neighbour's cloud never reaches a core.
  expect(KNOWLEDGE_GLOW_ALPHA).toBeCloseTo(GALAXY_HAZE_ALPHA + NEBULA_GLOW.base + NEBULA_GLOW.lit, 9)
  const peak: RGBA = [255, 255, 255, 1]
  const background = over(peak, over(peak, sky, SKY_MIST_ALPHA), KNOWLEDGE_GLOW_ALPHA)
  expect(contrast(over(text, background, LOCKED_RING_ALPHA), background)).toBeGreaterThanOrEqual(3)
  expect(line('--starmap-link-recommended', background)).toBeGreaterThanOrEqual(3)
  expect(line('--starmap-link-in-progress', background)).toBeGreaterThanOrEqual(3)
  expect(contrast(over(body, background, 0.8), background)).toBeGreaterThanOrEqual(4.5)
})
