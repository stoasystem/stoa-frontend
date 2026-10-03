/**
 * How the star map is drawn (review of #71): names placed clear of each
 * other and of what they would cover, lines faded where they cross a third
 * nebula, dots on the whole map and glyphs zoomed in, a portrait screen
 * getting the map turned to fill it, and stars that never crowd.
 */
import { describe, expect, it } from 'vitest'
import { dotBlendFor, orient, orientationFor, StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { cloudStars } from '@/features/starmap/layout/layout'
import { aroundDisc, boxHitsSegment, placeLabel, splitByCircles } from '@/features/starmap/render/labels'
import { nebulaFocusSpot, NEBULA_FOCUS_HEIGHT } from '@/features/starmap/view/layers'
import { fakeClock, recordingRenderer, THEME, skyMap } from './starmapHarness'

describe('placing a name', () => {
  const viewport = { x0: 0, y0: 0, x1: 800, y1: 600 }

  it('prefers just below its own disc', () => {
    const box = placeLabel(aroundDisc(400, 300, 50, 80, 16, 4), { boxes: [], circles: [], segments: [] }, viewport)
    expect(box).toEqual({ x0: 360, y0: 354, x1: 440, y1: 370 })
  })

  it('moves round its disc to get clear of another name, a core or a line', () => {
    const below = { x0: 360, y0: 354, x1: 440, y1: 370 }
    expect(placeLabel(aroundDisc(400, 300, 50, 80, 16, 4), { boxes: [below], circles: [], segments: [] }, viewport)?.y1).toBe(246)
    const core = { x: 400, y: 380, r: 20 }
    expect(placeLabel(aroundDisc(400, 300, 50, 80, 16, 4), { boxes: [], circles: [core], segments: [] }, viewport)?.y1).toBe(246)
    const line = { x0: 300, y0: 362, x1: 500, y1: 362 }
    expect(placeLabel(aroundDisc(400, 300, 50, 80, 16, 4), { boxes: [], circles: [], segments: [line] }, viewport)?.y1).toBe(246)
  })

  it('is left out rather than put somewhere else, or off the screen', () => {
    const everywhere = aroundDisc(400, 300, 50, 80, 16, 4)
    expect(placeLabel(everywhere, { boxes: everywhere, circles: [], segments: [] }, viewport)).toBeNull()
    expect(placeLabel(aroundDisc(50, 20, 15, 80, 16, 4), { boxes: [], circles: [], segments: [] }, { x0: 0, y0: 0, x1: 100, y1: 40 })).toBeNull()
  })

  it('moves to the side clear of a control band instead of dropping the name', () => {
    // A band covers everything below y = 360: "below the disc" is out, "above" is chosen.
    const band = { x0: 0, y0: 0, x1: 800, y1: 360 }
    expect(placeLabel(aroundDisc(400, 300, 50, 80, 16, 4), { boxes: [], circles: [], segments: [] }, band)?.y1).toBe(246)
  })

  it('finds a segment that crosses a box, and one that misses it', () => {
    const box = { x0: 0, y0: 0, x1: 10, y1: 10 }
    expect(boxHitsSegment(box, { x0: -5, y0: 5, x1: 15, y1: 5 })).toBe(true)
    expect(boxHitsSegment(box, { x0: -5, y0: 20, x1: 15, y1: 20 })).toBe(false)
  })
})

describe('a line between nebulae crossing a third one', () => {
  it('is split into the parts clear of it and the part inside it', () => {
    const { clear, hidden } = splitByCircles({ x0: 0, y0: 0, x1: 100, y1: 0 }, [{ x: 50, y: 0, r: 10 }])
    expect(hidden).toEqual([[0.4, 0.6]])
    expect(clear).toEqual([
      [0, 0.4],
      [0.6, 1],
    ])
  })

  it('merges overlapping nebulae and ignores ones it misses', () => {
    const { clear, hidden } = splitByCircles({ x0: 0, y0: 0, x1: 100, y1: 0 }, [
      { x: 40, y: 0, r: 10 },
      { x: 55, y: 0, r: 10 },
      { x: 50, y: 50, r: 10 },
    ])
    expect(hidden).toHaveLength(1)
    expect(hidden[0][0]).toBeCloseTo(0.3, 9)
    expect(hidden[0][1]).toBeCloseTo(0.65, 9)
    expect(clear).toHaveLength(2)
  })
})

describe('dots on the whole map, glyphs zoomed in', () => {
  it('blends from dots to glyphs as the glyph box grows', () => {
    expect(dotBlendFor(12)).toBe(1)
    expect(dotBlendFor(18)).toBe(1)
    expect(dotBlendFor(22)).toBeCloseTo(0.5, 9)
    expect(dotBlendFor(26)).toBe(0)
    expect(dotBlendFor(50)).toBe(0)
  })

  it('draws the 2000-star map in dots and one of its nebulae in glyphs', () => {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now })
    engine.setViewport(1280, 776, 2)
    engine.setData(skyMap(2000), { layer: 'map' })
    clock.advance(20)
    expect(renderer.last().dotBlend).toBe(1)
    engine.setTarget({ layer: 'nebula', nebulaId: skyMap(2000).nebulae[0].topicId })
    clock.advance(300)
    expect(renderer.last().dotBlend).toBe(0)
  })
})

describe('a portrait screen', () => {
  it('turns the map a quarter to fill it, the same way every time', () => {
    const map = skyMap(500)
    expect(orientationFor(390, 700)).toBe('portrait')
    expect(orientationFor(1280, 776)).toBe('landscape')
    const turned = orient(map, 'portrait')
    turned.stars.forEach((star, i) => {
      expect(star.x).toBeCloseTo(1 - map.stars[i].y, 12)
      expect(star.y).toBeCloseTo(map.stars[i].x, 12)
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThanOrEqual(1)
    })
    expect(orient(map, 'portrait')).toEqual(turned)
    expect(orient(map, 'landscape')).toBe(map)
  })

  it('makes the map taller than wide on a phone held upright', () => {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now })
    engine.setViewport(390, 700, 2)
    engine.setData(skyMap(2000), { layer: 'map' })
    clock.advance(20)
    const frame = renderer.last()
    const xs = frame.nebulaX.map((x, n) => [x - frame.nebulaR[n], x + frame.nebulaR[n]]).flat()
    const ys = frame.nebulaY.map((y, n) => [y - frame.nebulaR[n], y + frame.nebulaR[n]]).flat()
    const width = Math.max(...xs) - Math.min(...xs)
    const height = Math.max(...ys) - Math.min(...ys)
    expect(height).toBeGreaterThan(width)
    // And it fills the screen's height much more than a landscape map would.
    expect(height).toBeGreaterThan(700 * 0.6)
  })
})

describe('stars in a nebula', () => {
  it('never crowd, dense core and all: no two closer than a quarter of the typical spacing', () => {
    const disc = { x: 0.5, y: 0.5, r: 0.12 }
    for (const count of [12, 60, 160]) {
      const stars = cloudStars(count, disc, count)
      const spacing = disc.r * Math.sqrt(Math.PI / count)
      let closest = Infinity
      for (let i = 0; i < stars.length; i += 1) {
        for (let j = i + 1; j < stars.length; j += 1) closest = Math.min(closest, Math.hypot(stars[i][0] - stars[j][0], stars[i][1] - stars[j][1]))
      }
      expect(closest).toBeGreaterThan(spacing * 0.25)
    }
  })
})

describe('a focused nebula link', () => {
  const viewport = { width: 1280, height: 776 }
  const bands = { top: 76, bottom: 164 }
  const inside = (spot: { y: number }) => spot.y >= bands.top && spot.y + NEBULA_FOCUS_HEIGHT <= viewport.height - bands.bottom

  it('shows its name just below the nebula when there is room', () => {
    expect(nebulaFocusSpot({ x: 640, y: 300, r: 60 }, viewport, bands)).toEqual({ x: 640, y: 368 })
  })

  it('goes above a nebula near the legend, and never into a control band', () => {
    const low = nebulaFocusSpot({ x: 300, y: 560, r: 60 }, viewport, bands)
    expect(low.y).toBe(560 - 60 - 8 - NEBULA_FOCUS_HEIGHT)
    for (const y of [0, 80, 300, 600, 700, 900]) {
      for (const r of [10, 80, 400]) expect(inside(nebulaFocusSpot({ x: 50, y, r }, viewport, bands))).toBe(true)
    }
  })
})
