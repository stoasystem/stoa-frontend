import { describe, expect, it } from 'vitest'
import { galaxyHazeBox } from '@/features/starmap/render/galaxy'

// The haze canvas is sized by dividing by this box's width (`canvas2d.ts`),
// so a box with no extent made the height NaN, the canvas 0 px tall, and
// every drawImage onto it throw. Found when the read model (#48) first served
// a subject with a single topic - which is what a newly opened subject is.

describe('a galaxy haze box', () => {
  it('has an extent even when the galaxy is a single point', () => {
    const box = galaxyHazeBox({ x0: 0.5, x1: 0.5, y0: 0.5, y1: 0.5 })

    expect(box.x1 - box.x0).toBeGreaterThan(0)
    expect(box.y1 - box.y0).toBeGreaterThan(0)
  })

  it('gives a canvas sized from it real dimensions, not NaN', () => {
    const box = galaxyHazeBox({ x0: 0.5, x1: 0.5, y0: 0.5, y1: 0.5 })
    const width = 1024

    const height = Math.max(16, Math.round((width * (box.y1 - box.y0)) / (box.x1 - box.x0)))

    expect(Number.isFinite(height)).toBe(true)
    expect(height).toBeGreaterThan(0)
  })

  it('still wraps a galaxy that has real extent', () => {
    const box = galaxyHazeBox({ x0: 0.2, x1: 0.8, y0: 0.3, y1: 0.7 })

    expect(box.x0).toBeLessThan(0.2)
    expect(box.x1).toBeGreaterThan(0.8)
    expect(box.y0).toBeLessThan(0.3)
    expect(box.y1).toBeGreaterThan(0.7)
  })
})
