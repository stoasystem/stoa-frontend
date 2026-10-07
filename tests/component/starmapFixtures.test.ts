/**
 * The star map has one data set since #119: the design preview's sky
 * (`demoSky`, tested in demoSky.test.ts). Here: picking its size and the
 * foveation switch from the URL, as the bench and the preview do.
 */
import { describe, expect, it } from 'vitest'
import { BENCH_SIZES } from '@/dev/benchStats'
import { FIXTURE_SIZES } from '@/dev/demo/sky/demoSky'
import { fixtureSizeFrom, foveationFrom } from '@/features/starmap/useStarMap'

describe('the fixture size in the URL (#44)', () => {
  it('offers the three sizes the phone bench measures: 500, 1000 and 2000', () => {
    for (const size of BENCH_SIZES) expect(FIXTURE_SIZES).toContain(size)
    for (const size of BENCH_SIZES) {
      expect(fixtureSizeFrom(new URLSearchParams(`points=${size}`))).toBe(size)
    }
  })

  it('falls back to the ten-star sky for anything else', () => {
    expect(fixtureSizeFrom(new URLSearchParams('points=750'))).toBe(10)
    expect(fixtureSizeFrom(new URLSearchParams(''))).toBe(10)
  })
})

describe('the foveation switch in the URL (#44)', () => {
  it('is on unless the URL says foveation=off', () => {
    expect(foveationFrom(new URLSearchParams(''))).toBe(true)
    expect(foveationFrom(new URLSearchParams('foveation=on'))).toBe(true)
    expect(foveationFrom(new URLSearchParams('foveation=off'))).toBe(false)
  })
})
