/*
 * Which renderer draws the planet. Canvas 2D is the only one written; the
 * WebGL slot stays empty until the phone benchmark (#44) says the sprites miss
 * 60 fps at 2000 points even with breathing and glow turned off (#11 point 3).
 * A WebGL renderer implements `PlanetRenderer` and goes in the table below;
 * nothing else changes.
 */
import { createCanvas2DRenderer } from '@/features/planet/render/canvas2d'
import type { PlanetRenderer, RendererFactory, RendererKind } from '@/features/planet/render/types'

export const RENDERERS: Record<RendererKind, RendererFactory | null> = {
  canvas2d: createCanvas2DRenderer,
  webgl: null,
}

/** Does nothing: where a canvas has no 2D context (jsdom, a lost GPU process). */
export function createNullRenderer(): PlanetRenderer {
  return {
    kind: 'canvas2d',
    resize() {},
    setTheme() {},
    setData() {},
    draw() {},
    snapshot() {},
    destroy() {},
  }
}

/** The renderer asked for, else Canvas 2D, else one that draws nothing. */
export function createRenderer(canvas: HTMLCanvasElement, preferred: RendererKind = 'canvas2d'): PlanetRenderer {
  const factories = [RENDERERS[preferred], RENDERERS.canvas2d]
  for (const factory of factories) {
    const renderer = factory?.(canvas)
    if (renderer) return renderer
  }
  return createNullRenderer()
}
