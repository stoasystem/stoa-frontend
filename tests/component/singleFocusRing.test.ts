/**
 * One focus indicator per stop (#83). The ring is the base layer's 2 px
 * outline (src/styles/premium-theme.css); a `focus-visible:ring-*` box-shadow
 * on top of it drew a second, differently coloured ring (light `--ring` under
 * a star-gold outline on the sky). No source file may bring one back.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(__dirname, '../../src')

/** A ring utility behind a focus variant, any stack of variants before it. */
const FOCUS_RING = /(?<![\w-])(?:[\w-]+:)*(?:focus|focus-visible|focus-within):(?:[\w-]+:)*ring(?:-[^\s'"`]*)?(?![\w-])/g

const focusRings = (source: string) => source.match(FOCUS_RING) ?? []

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : []
  })
}

describe('the focus-ring pattern', () => {
  it.each([
    ['focus-visible:ring-2'],
    ['focus-visible:ring-ring/45'],
    ['focus-visible:ring-offset-2'],
    ['focus-visible:ring-0'],
    ['focus:ring-2'],
    ['focus-within:ring-1'],
    ['md:focus-visible:ring-2'],
    ['focus-visible:ring-[hsl(var(--x)/0.2)]'],
  ])('catches %s', (token) => {
    expect(focusRings(`className="a ${token} b"`)).toEqual([token])
  })

  it.each([
    ['ring-2 ring-primary'],
    ['ring-offset-background'],
    ['focus-visible:outline-none'],
    ['focus-visible:border-primary/45'],
    ['data-[state=active]:ring-1'],
  ])('leaves %s alone', (source) => {
    expect(focusRings(`className="${source}"`)).toEqual([])
  })
})

describe('no second focus ring in src (#83)', () => {
  it('finds no focus-variant ring utility in any source file', () => {
    const hits = sourceFiles(SRC).flatMap((file) =>
      focusRings(readFileSync(file, 'utf8')).map((token) => `${path.relative(SRC, file)}: ${token}`),
    )
    expect(hits).toEqual([])
  })
})
