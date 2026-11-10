/**
 * --sky-mist is the star map's mist at the top of the map (#649).
 *
 * The map's canvas never shows bare --sky: paintGalaxy lays a radial mist from
 * GALAXY.mist to GALAXY.violet over it at SKY_MIST_ALPHA. The seamless bar
 * lays --sky-mist over the sky so it matches the canvas's top edge. The token
 * is that mist's mean colour at that alpha; this keeps the two together.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, it } from 'vitest'
import { GALAXY, SKY_MIST_ALPHA } from '@/features/starmap/render/galaxy'

const css = readFileSync(path.resolve(__dirname, '../../src/styles/brand-tokens.css'), 'utf8')
const skyBlock = css.slice(css.indexOf('[data-surface="sky"] {'))
const hex = (value: string) => [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16))

it('is the mean of the mist and the violet, at the mist alpha', () => {
  const match = skyBlock.match(/--sky-mist:\s*rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/)
  expect(match, '--sky-mist is defined in the sky scope as rgba()').not.toBeNull()
  const [r, g, b, alpha] = match!.slice(1).map(Number)
  expect(alpha).toBe(SKY_MIST_ALPHA)
  const mist = hex(GALAXY.mist)
  const violet = hex(GALAXY.violet)
  ;[r, g, b].forEach((channel, i) => {
    expect(Math.abs(channel - (mist[i] + violet[i]) / 2)).toBeLessThanOrEqual(1)
  })
})
