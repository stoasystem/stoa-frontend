/**
 * Star names that read clearly after flying into a nebula (#755): a name
 * that has to sit over a line or a star gets an opaque, padded backing; a
 * name on the far ring, or nearer another star than its own, is tied to its
 * star by a thin leader; a long name breaks into two lines before anything
 * is cut.
 */
import { describe, expect, it } from 'vitest'
import { backingBox, cutToWidth, leaderLine, nearerStars, ownerUnclear, wrapName, type Box, type Circle } from '@/features/starmap/render/labels'
import { REVEAL } from '@/features/starmap/view/semanticZoom'

/** Text at 7 px a character, as the other label tests measure it. */
const measure = (text: string) => 7 * text.length

describe('#755: the backing under a name over a line or a star is opaque', () => {
  it('is drawn at full alpha, round-cornered', () => {
    expect(REVEAL.keyName.backing).toBe(1)
    expect(REVEAL.keyName.backingRadiusPx).toBeGreaterThan(0)
  })

  it('leaves the text about 4 px of backing all round', () => {
    // A name's box holds its text with 3 px either side and 2 px above and below.
    const text = { x0: 103, y0: 52, x1: 197, y1: 67 }
    const box: Box = { x0: text.x0 - 3, y0: text.y0 - 2, x1: text.x1 + 3, y1: text.y1 + 2 }
    const back = backingBox(box, REVEAL.keyName.backingPadPx)
    expect(REVEAL.keyName.backingPadPx).toBe(4)
    expect(text.x0 - back.x0).toBe(4)
    expect(back.x1 - text.x1).toBe(4)
    expect(text.y0 - back.y0).toBe(4)
    expect(back.y1 - text.y1).toBe(4)
  })
})

describe('#755: a leader ties a name to its star when the name alone might not', () => {
  const own: Circle = { x: 100, y: 100, r: 10 }
  const { gapPx, minLengthPx } = REVEAL.nameLeader

  it('none for a name right beside its star, with no other star nearer it', () => {
    const below: Box = { x0: 60, y0: 113, x1: 140, y1: 130 }
    expect(leaderLine(below, own, [{ x: 400, y: 400, r: 10 }], false, gapPx, minLengthPx)).toBeNull()
  })

  it('one for a name on the far ring, from just past the star’s rim to the name’s nearest point', () => {
    const far: Box = { x0: 60, y0: 130, x1: 140, y1: 147 }
    const leader = leaderLine(far, own, [], true, gapPx, minLengthPx)
    expect(leader).not.toBeNull()
    expect(leader!.x0).toBeCloseTo(100)
    expect(leader!.y0).toBeCloseTo(100 + own.r + gapPx)
    expect(leader!.x1).toBeCloseTo(100)
    expect(leader!.y1).toBeCloseTo(130)
  })

  it('one for a name about as near another star as its own (#755: halfway along a line between two)', () => {
    // 20 px below its own star, 24 px above another: either could own it.
    const between: Box = { x0: 60, y0: 120, x1: 140, y1: 137 }
    const other: Circle = { x: 100, y: 161, r: 10 }
    const { nearRatio } = REVEAL.nameLeader
    expect(leaderLine(between, own, [other], false, gapPx, minLengthPx, nearRatio)).not.toBeNull()
    // With that other star well away, the name reads as its own star's.
    expect(leaderLine(between, own, [{ ...other, y: 240 }], false, gapPx, minLengthPx, nearRatio)).toBeNull()
  })

  it('one for a name whose middle is nearer another star than its own', () => {
    // The name sits off to the right, where another star is nearer its middle.
    const aside: Box = { x0: 130, y0: 90, x1: 230, y1: 107 }
    const other: Circle = { x: 190, y: 120, r: 10 }
    const leader = leaderLine(aside, own, [other], false, gapPx, minLengthPx)
    expect(leader).not.toBeNull()
    expect(leader!.x1).toBe(130)
    expect(leader!.y1).toBe(100)
  })
})

describe('#755: “Ideales Gas und kinetische Gastheorie” between two rings (physics, 1440×900, CSS px)', () => {
  // Its own ring and the ring to its left, 84 px apart; the name in two lines just above its own.
  const own: Circle = { x: 847, y: 554, r: 11 }
  const left: Circle = { x: 763, y: 553, r: 11 }
  const width = 153
  const height = 17 + REVEAL.keyName.lineHeightPx
  const { gapPx, minLengthPx, nearRatio } = REVEAL.nameLeader
  const above = (gap: number): Box => ({ x0: own.x - width / 2, y0: own.y - own.r - gap - height, x1: own.x + width / 2, y1: own.y - own.r - gap })

  it('beside its ring it could be either ring’s: the other ring is about as near its edge, though not its middle', () => {
    const beside = above(3)
    expect(nearerStars(beside, own, [left])).toBe(0)
    expect(ownerUnclear(beside, own, [left], nearRatio)).toBe(true)
    // There a leader would be a pixel long: such a spot costs more than any on the far ring.
    expect(leaderLine(beside, own, [left], false, gapPx, minLengthPx, nearRatio)).toBeNull()
    expect(REVEAL.keyName.unclearCost).toBeGreaterThan(15 * 0.5)
  })

  it('on the far ring above it the name has its leader down to its own ring', () => {
    const far = above(3 + REVEAL.keyName.farGap)
    const leader = leaderLine(far, own, [left], true, gapPx, minLengthPx, nearRatio)
    expect(leader).not.toBeNull()
    expect(leader!.x0).toBeCloseTo(own.x)
    expect(leader!.y1).toBeCloseTo(far.y1)
    expect(leader!.y0 - leader!.y1).toBeGreaterThanOrEqual(minLengthPx)
  })

  it('with the left ring well away, the same spot beside its ring reads as its own: no cost, no leader', () => {
    const away = { ...left, x: 600 }
    expect(ownerUnclear(above(3), own, [away], nearRatio)).toBe(false)
    expect(leaderLine(above(3), own, [away], false, gapPx, minLengthPx, nearRatio)).toBeNull()
  })
})

describe('#755: a long name breaks into two lines before it is cut', () => {
  const { lineWidthPx, lines, maxWidthPx } = REVEAL.keyName

  it('a name that fits stays on one line', () => {
    expect(wrapName('Druck und Auftrieb', measure, lineWidthPx, lines, maxWidthPx)).toEqual(['Druck und Auftrieb'])
  })

  it('the longest German name of the physics sky reads in full over two lines, none wider than a line', () => {
    const name = 'Messen, Energie sparen und Steuern in der Praxis'
    const set = wrapName(name, measure, lineWidthPx, lines, maxWidthPx)
    expect(set).toHaveLength(2)
    expect(set.join(' ')).toBe(name)
    for (const line of set) expect(measure(line)).toBeLessThanOrEqual(lineWidthPx)
  })

  it('on a phone’s narrow stage the same name reads in full over three narrower lines', () => {
    const { narrowLineWidthPx, narrowLines } = REVEAL.keyName
    const name = 'Messen, Energie sparen und Steuern in der Praxis'
    const set = wrapName(name, measure, narrowLineWidthPx, narrowLines, maxWidthPx)
    expect(set).toHaveLength(3)
    expect(set.join(' ')).toBe(name)
    for (const line of set) expect(measure(line)).toBeLessThanOrEqual(narrowLineWidthPx)
  })

  it('only a name too long for two lines is cut, at the end of the second', () => {
    const name = 'Kräfte zusammensetzen, zerlegen und im Gleichgewicht halten an schiefen Ebenen'
    const set = wrapName(name, measure, lineWidthPx, lines, maxWidthPx)
    expect(set).toHaveLength(2)
    expect(set[0].endsWith('…')).toBe(false)
    expect(set[1].endsWith('…')).toBe(true)
    for (const line of set) expect(measure(line)).toBeLessThanOrEqual(lineWidthPx)
    expect(name.startsWith(`${set[0]} ${set[1].slice(0, -1)}`.trimEnd())).toBe(true)
  })

  it('a single word wider than a line keeps a line of its own, up to the widest a word may run', () => {
    const word = 'Zustandsänderungsgleichungen' // 28 characters, 196 px: wider than a line
    expect(wrapName(`${word} idealer Gase`, measure, lineWidthPx, lines, maxWidthPx)).toEqual([word, 'idealer Gase'])
    expect(cutToWidth('x'.repeat(60), measure, maxWidthPx).endsWith('…')).toBe(true)
  })
})
