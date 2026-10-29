/**
 * The pressable solid, and the four moments the marmot is for (#125).
 *
 * The signature of the design is the 4 px hard edge under a button and the
 * way the button sinks onto it: it is what tells a reader the thing is a
 * control rather than a coloured rectangle. Nothing held it before this file,
 * which is how the student's own screens ended up without it at all — they
 * are drawn by `components/base/Button`, and the edge had only ever been
 * written into `components/ui/button`, which draws the parent, teacher and
 * admin screens.
 *
 * Each rule below is held over its whole set rather than over one string, so
 * writing a literal into a single variant cannot slip past, and each has a
 * negative control standing next to it: an assertion that passes only because
 * everything passes is not a test.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { ReactElement } from 'react'
import { cleanup, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button, type ButtonVariant } from '@/components/base/Button'

const SRC = path.resolve(__dirname, '../../src')
const read = (relative: string) => readFileSync(path.join(SRC, relative), 'utf8')
const tokens = read('styles/brand-tokens.css')

/** The value of a custom property declared in the token file. */
function token(name: string): string {
  const match = tokens.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))
  if (!match) throw new Error(`${name} is not declared in brand-tokens.css`)
  return match[1].trim()
}

/** The two variants that are a solid: the only ones with a side to show. */
const SOLID: ButtonVariant[] = ['filled', 'onSky']
/** Everything else: text, or a fill so quiet that an edge would be a lie. */
const FLAT: ButtonVariant[] = ['plain', 'onSkyPlain', 'tinted', 'gray']

function classesOf(element: ReactElement): string[] {
  const { container } = render(element)
  const names = [...(container.firstElementChild?.classList ?? [])]
  cleanup()
  return names
}

const lifted = (variant: ButtonVariant) => classesOf(<Button lift variant={variant}>Weiter</Button>)
const unlifted = (variant: ButtonVariant) => classesOf(<Button variant={variant}>Weiter</Button>)

/* ── the depth is a token ──────────────────────────────────────────────── */

describe('the edge is one token, everywhere (#125)', () => {
  it('is 4 px, and the sink is the depth itself so the button lands on it', () => {
    expect(token('--press-depth')).toBe('4px')
    // Not "4px" written again: the two may not drift apart.
    expect(token('--press-sink')).toBe('var(--press-depth)')
  })

  it('presses inside the 110 ms the canvas allows a direct manipulation', () => {
    const ms = Number(token('--press-time').replace('ms', ''))
    expect(ms).toBeGreaterThan(0)
    expect(ms).toBeLessThanOrEqual(110)
  })

  it('keeps the canvas 48 px floor as a token rather than a number in a page', () => {
    expect(token('--control-h-roomy')).toBe('48px')
  })

  it('rings a focus stop at 3 px, offset 3', () => {
    expect(token('--focus-ring-width')).toBe('3px')
    expect(token('--focus-ring-offset')).toBe('3px')
  })
})

/* ── every solid draws it from that token, none writes it out ──────────── */

/**
 * A length written out, rather than read from a token. Tailwind spells a
 * space as `_`, so a digit after one starts a value of its own.
 *
 * The shapes this refuses are assembled from pieces below rather than typed
 * out, here and in the control that exercises it: Tailwind scans this
 * directory too, and a whole class name written in a test is a real utility
 * compiled into the production stylesheet. Three dead rules reached `dist`
 * that way before the pieces were split.
 */
const LITERAL_LENGTH = /\[[^\]]*(?<![a-zA-Z0-9.-])\d+(?:\.\d+)?(px|rem|em)/

const PX = `4${'px'}`
const WRITTEN_OUT_EDGE = `shadow-[0_${PX}_0_var(--accent-pressed)]`
const WRITTEN_OUT_SINK = `active:translate-y-[${'3px'}]`
const FROM_THE_TOKEN = `shadow-[0_var(--press-${'depth'})_0_var(--accent-pressed)]`

describe('a lifted solid sits on the edge and sinks onto it', () => {
  it.each(SOLID)('%s draws its edge from --press-depth', (variant) => {
    const classes = lifted(variant)
    const shadow = classes.filter((name) => name.startsWith('shadow-['))

    expect(shadow).toHaveLength(1)
    expect(shadow[0]).toMatch(/^shadow-\[0_var\(--press-depth\)_0_var\(--[\w-]+\)\]$/)
  })

  it.each(SOLID)('%s moves down by --press-sink and loses the edge', (variant) => {
    const classes = lifted(variant)

    expect(classes).toContain('active:translate-y-[var(--press-sink)]')
    expect(classes).toContain('active:shadow-none')
  })

  it.each(SOLID)('%s writes no length out as a number', (variant) => {
    const written = lifted(variant).filter((name) => LITERAL_LENGTH.test(name))
    expect(written).toEqual([])
  })

  it('catches a length that is written out (a negative control for the rule above)', () => {
    // The shapes the rule exists to refuse, and the shape it must let through.
    expect(LITERAL_LENGTH.test(WRITTEN_OUT_EDGE)).toBe(true)
    expect(LITERAL_LENGTH.test(WRITTEN_OUT_SINK)).toBe(true)
    expect(LITERAL_LENGTH.test(FROM_THE_TOKEN)).toBe(false)
  })
})

describe('nothing else grows an edge (the negative controls)', () => {
  it.each(FLAT)('%s has none even when lifted: it is text, not a solid', (variant) => {
    const classes = lifted(variant)

    expect(classes.filter((name) => name.startsWith('shadow-['))).toEqual([])
    expect(classes).not.toContain('active:translate-y-[var(--press-sink)]')
  })

  it.each(SOLID)('%s has none without `lift`: the parent and admin screens do not move', (variant) => {
    const classes = unlifted(variant)

    expect(classes.filter((name) => name.startsWith('shadow-['))).toEqual([])
    expect(classes).not.toContain('active:translate-y-[var(--press-sink)]')
  })

  it.each(SOLID)('%s only takes the 48 px floor when lifted', (variant) => {
    const style = (element: ReactElement) => {
      const { container } = render(element)
      const value = (container.firstElementChild as HTMLElement).style.minHeight
      cleanup()
      return value
    }

    expect(style(<Button lift variant={variant}>Weiter</Button>)).toBe('var(--control-h-roomy)')
    expect(style(<Button variant={variant}>Weiter</Button>)).toBe('')
  })
})

/* ── reduced motion keeps the press ────────────────────────────────────── */

describe('reduced motion keeps the one movement that is a receipt', () => {
  it.each(SOLID)('%s puts no motion variant in front of the press', (variant) => {
    // The whole set, so adding `motion-safe:active:translate-y-…` — which
    // would silently drop the press for a reader who asked for less motion —
    // cannot pass by being one more class among many.
    const motion = lifted(variant).filter((name) => /^motion-(safe|reduce):/.test(name))

    expect(motion).toEqual(['motion-reduce:transition-none'])
  })

  it('takes the tween off and nothing else', () => {
    // The press is a transform; `transition-none` stops it being animated to,
    // it does not stop it happening. Nothing on the button says otherwise.
    const classes = lifted('onSky')

    expect(classes).toContain('motion-reduce:transition-none')
    expect(classes.filter((name) => /motion-/.test(name) && /translate|transform|shadow/.test(name))).toEqual([])
  })
})

/** Every `@media (prefers-reduced-motion: reduce)` body in a stylesheet. */
function reducedMotionBlocks(css: string): string[] {
  const blocks: string[] = []
  const opener = /@media[^{]*prefers-reduced-motion[^{]*\{/g
  while (opener.exec(css) !== null) {
    let depth = 1
    let index = opener.lastIndex
    while (index < css.length && depth > 0) {
      if (css[index] === '{') depth += 1
      else if (css[index] === '}') depth -= 1
      index += 1
    }
    blocks.push(css.slice(opener.lastIndex, index - 1))
  }
  return blocks
}

/** What inside such a block would reach the press and stop it. */
function pressKillers(block: string): string[] {
  const found: string[] = []
  if (/--press-(depth|sink)\s*:/.test(block)) found.push('redeclares the press tokens')
  for (const [, selector] of block.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    const name = selector.trim()
    if (name.includes(':active')) found.push(`reaches a pressed control: ${name}`)
    if (/(^|[,\s])\*([\s,{]|$)/.test(name)) found.push(`resets everything: ${name}`)
  }
  return found
}

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return stylesheets(full)
    return entry.name.endsWith('.css') ? [full] : []
  })
}

describe('no stylesheet turns the press off under reduced motion', () => {
  it('finds nothing in any reduced-motion block that would reach it', () => {
    const hits = stylesheets(SRC).flatMap((file) =>
      reducedMotionBlocks(readFileSync(file, 'utf8')).flatMap((block) =>
        pressKillers(block).map((why) => `${path.relative(SRC, file)}: ${why}`),
      ),
    )

    expect(hits).toEqual([])
  })

  it('reads the blocks it is meant to read, and names each way of killing the press', () => {
    // A negative control for the scanner: it has to see all three shapes, or
    // the clean result above means only that it found nothing to look at.
    const synthetic = `
      .a { color: red }
      @media (prefers-reduced-motion: reduce) {
        :root { --press-sink: 0px; }
        .btn:active { transform: none; }
        * { transition: none; }
      }
    `
    const blocks = reducedMotionBlocks(synthetic)

    expect(blocks).toHaveLength(1)
    expect(pressKillers(blocks[0])).toEqual([
      'redeclares the press tokens',
      'reaches a pressed control: .btn:active',
      'resets everything: *',
    ])
  })

  it('leaves a reduced-motion block that only stops decoration alone', () => {
    const fine = `@media (prefers-reduced-motion: reduce) { .sky-breathe { animation: none } .card:hover { transform: none } }`

    expect(pressKillers(reducedMotionBlocks(fine)[0])).toEqual([])
  })
})

/* ── the student's screens are the ones that asked for it ──────────────── */

/** Attributes of every `<Button …>` tag in a source file. */
function buttonTags(source: string): string[] {
  return [...source.matchAll(/<Button\b([^>]*?)\/?>/gs)].map(([, attributes]) => attributes)
}

/** The student surfaces whose solid buttons the canvas redraws (#125). */
const STUDENT_FILES = [
  'features/chapter/LessonStage.tsx',
  'features/chapter/ChapterView.tsx',
  'features/starmap/components/StarCard.tsx',
  'features/starmap/components/StarSheet.tsx',
]

const solidTags = (source: string) => buttonTags(source).filter((attributes) => /variant="(onSky|filled)"/.test(attributes))

describe('the student’s solid buttons take the edge (#125)', () => {
  it.each(STUDENT_FILES)('%s lifts every solid button it draws', (file) => {
    const solids = solidTags(read(file))

    expect(solids.length).toBeGreaterThan(0)
    expect(solids.filter((attributes) => !/\blift\b/.test(attributes))).toEqual([])
  })

  it('counts the ten the canvas names and the small star’s way in (#501), and no fewer', () => {
    const total = STUDENT_FILES.reduce((sum, file) => sum + solidTags(read(file)).length, 0)
    expect(total).toBe(11)
  })

  it('sees a solid button that was left flat (a negative control for the scan)', () => {
    const missed = '<Button asChild variant="onSky" size="regular">x</Button>'
    expect(solidTags(missed)).toHaveLength(1)
    expect(solidTags(missed).filter((attributes) => !/\blift\b/.test(attributes))).toHaveLength(1)
    // And the same tag, lifted, is not reported.
    expect(solidTags('<Button asChild lift variant="onSky">x</Button>').filter((a) => !/\blift\b/.test(a))).toEqual([])
  })

  it('leaves the parent, teacher and admin screens flat: they are not in this round', () => {
    const elsewhere = ['pages/admin', 'pages/parent', 'components/teacher', 'components/parent']
      .flatMap((dir) => {
        const full = path.join(SRC, dir)
        return readdirSync(full, { withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
          .map((entry) => path.join(dir, entry.name))
      })
      .filter((file) => /\blift\b/.test(read(file)))

    expect(elsewhere).toEqual([])
  })
})

/* ── the four moments ──────────────────────────────────────────────────── */

/** The one `<section>` a marker attribute opens, up to the tag that closes it. */
function sectionAt(source: string, marker: string): string {
  const start = source.indexOf(marker)
  if (start === -1) return ''
  const end = source.indexOf('</section>', start)
  return end === -1 ? '' : source.slice(start, end)
}

/**
 * Nothing empty, waiting, failed or finished on the student's screens may be
 * a paragraph on its own. Each entry is a section the page draws, named by
 * the attribute it carries, and the mood the marmot wears there.
 */
const MOMENTS: [file: string, marker: string, mood: RegExp][] = [
  // Finished: at the telescope while a lesson is left, delighted once whole.
  ['features/chapter/LessonStage.tsx', 'data-stage-done', /mood=\{allDone \? 'delighted' : 'watching'\}/],
  // Failed: the quiz lost, and the quiz refused. Looking again, never sorry.
  ['features/chapter/LessonStage.tsx', 'data-quiz-failed', /mood="thinking"/],
  ['features/chapter/LessonStage.tsx', 'data-quiz-trouble', /mood="thinking"/],
]

describe('the marmot is at each of its four moments (#125)', () => {
  it.each(MOMENTS)('%s: the section at %s carries one', (file, marker, mood) => {
    const section = sectionAt(read(file), marker)

    expect(section, `no section opened at ${marker} in ${file}`).not.toBe('')
    expect(section).toMatch(/<Murmi\b/)
    expect(section).toMatch(mood)
  })

  it('sees a section that lost its marmot (a negative control for the scan)', () => {
    const stripped = '<section data-stage-done><h2>Fertig</h2></section>'
    expect(sectionAt(stripped, 'data-stage-done')).not.toBe('')
    expect(/<Murmi\b/.test(sectionAt(stripped, 'data-stage-done'))).toBe(false)
    // And a marker that is not there at all is told apart from one that is.
    expect(sectionAt(stripped, 'data-quiz-failed')).toBe('')
  })

  it('keeps one on every empty, waiting and failed page the whole app shares', () => {
    for (const file of ['components/common/EmptyState.tsx', 'components/common/ErrorState.tsx', 'components/common/LoadingState.tsx']) {
      expect(read(file), file).toMatch(/<Murmi\b/)
    }
  })
})
