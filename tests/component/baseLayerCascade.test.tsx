import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { ReactElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'
import { Button } from '@/components/base/Button'
import { Button as UiButton } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

/*
 * The global base rules -- `* { border-color }`, `a { color; text-decoration }`
 * and the focus ring -- sit in Tailwind's `base` layer, so a utility class
 * overrides them (#73). Outside any layer they outranked every utility, and
 * pages worked around it with data attributes, unlayered overrides and inline
 * styles.
 *
 * jsdom parses `@layer` but applies none of it, so this compiles the real
 * src/index.css with Tailwind and settles the cascade here: origin importance,
 * then layer order (unlayered last), then specificity, then source order.
 *
 * `@media` blocks are walked and each rule keeps its conditions (#83). A test
 * page is taken to be wide and to hover: `(hover: hover)` and a lower width
 * bound (`md:` and up) count as met; anything else (`max-md:`,
 * `motion-reduce:`, print) does not, and its rules never win.
 */

const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'src')

type Declaration = { property: string; value: string; important: boolean; layer: number; specificity: number[]; order: number; selector: string }

const UNLAYERED = Number.POSITIVE_INFINITY

async function loadStylesheet(id: string, base: string) {
  const file = id === 'tailwindcss'
    ? path.join(ROOT, 'node_modules/tailwindcss/index.css')
    : id.startsWith('tailwindcss/')
      ? path.join(ROOT, 'node_modules', `${id}.css`.replace(/\.css\.css$/, '.css'))
      : path.resolve(base, id)
  return { path: file, base: path.dirname(file), content: readFileSync(file, 'utf8') }
}

/** Specificity of one complex selector, [ids, classes, types]. Enough for the rules this file meets. */
function specificityOf(selector: string): number[] {
  let s = selector
  // :where() counts nothing; :is(), :not(), :has() count their argument (one simple argument here).
  s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '')
  s = s.replace(/:(is|not|has)\(((?:[^()]|\([^()]*\))*)\)/g, ' $2')
  s = s.replace(/\\./g, 'x')
  const ids = (s.match(/#[\w-]+/g) ?? []).length
  const classes = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length
  const types = (s.replace(/\[[^\]]*\]/g, '').match(/(^|[\s>+~(])[a-z][\w-]*|::[\w-]+/gi) ?? []).length
  return [ids, classes, types]
}

function splitList(selectorText: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of selectorText) {
    if (ch === '(') depth += 1
    if (ch === ')') depth -= 1
    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else current += ch
  }
  parts.push(current.trim())
  return parts
}

// jsdom has no :focus-visible; the element under test is focused from the keyboard's point of view.
const matches = (element: Element, selector: string) => {
  try {
    return element.matches(selector.replace(/:focus-visible/g, ':focus'))
  } catch {
    return false
  }
}

/**
 * Whether a test page meets a media query list: it is wide and it hovers.
 * Every feature of one comma-separated alternative must be `hover: hover` or
 * a lower width bound.
 */
function mediaMet(condition: string): boolean {
  return condition.split(/\s*,\s*/).some((alternative) => {
    if (/^\s*not\b|\bprint\b/.test(alternative)) return false
    const features = alternative.match(/\([^()]*\)/g) ?? []
    return features.every(
      (feature) =>
        /^\(\s*hover\s*:\s*hover\s*\)$/.test(feature) || /^\(\s*min-width\s*:/.test(feature) || /^\(\s*width\s*>=?[^<]*\)$/.test(feature),
    )
  })
}

type Rule = { style: CSSStyleDeclaration; selectorText: string; layer: number; order: number; media: string[] }

function collect(sheet: CSSStyleSheet) {
  const layerOrder: string[] = []
  const rules: Rule[] = []
  let order = 0
  const layerIndex = (name: string) => {
    if (!layerOrder.includes(name)) layerOrder.push(name)
    return layerOrder.indexOf(name)
  }
  // A nested rule (`.x { &:focus-visible { ... } }`, how Tailwind writes a
  // variant) stands for its selector with `&` read as the parent's.
  const nest = (parent: string | undefined, own: string) =>
    parent === undefined
      ? own
      : splitList(parent)
          .flatMap((outer) => splitList(own).map((inner) => (inner.includes('&') ? inner.replace(/&/g, outer) : `${outer} ${inner}`)))
          .join(', ')
  const walk = (list: CSSRuleList, layer: number, media: string[], parent?: string) => {
    for (const rule of Array.from(list)) {
      const name = rule.constructor.name
      if (name === 'CSSLayerStatementRule') {
        for (const layerName of (rule as unknown as { nameList: string[] }).nameList ?? rule.cssText.replace(/^@layer\s+|;$/g, '').split(/\s*,\s*/)) layerIndex(layerName)
      } else if (name === 'CSSLayerBlockRule') {
        walk((rule as CSSGroupingRule).cssRules, layerIndex((rule as unknown as { name: string }).name), media, parent)
      } else if (name === 'CSSStyleRule') {
        const selectorText = nest(parent, (rule as CSSStyleRule).selectorText)
        rules.push({ style: (rule as CSSStyleRule).style, selectorText, layer, order: order++, media })
        const nested = (rule as CSSStyleRule).cssRules
        if (nested?.length) walk(nested, layer, media, selectorText)
      } else if (name === 'CSSNestedDeclarations') {
        // Declarations inside an at-rule nested in a style rule
        // (`&:hover { @media (hover: hover) { ... } }`) belong to that rule's selector.
        if (parent !== undefined) rules.push({ style: (rule as unknown as { style: CSSStyleDeclaration }).style, selectorText: parent, layer, order: order++, media })
      } else if (name === 'CSSMediaRule') {
        walk((rule as CSSMediaRule).cssRules, layer, [...media, (rule as CSSMediaRule).media.mediaText], parent)
      } else if ('cssRules' in rule) {
        // @supports and the like: treat as met.
        walk((rule as CSSGroupingRule).cssRules, layer, media, parent)
      }
    }
  }
  walk(sheet.cssRules, UNLAYERED, [])
  return rules
}

let sheetRules: ReturnType<typeof collect>

/** The declaration that wins `property` on `element`, among the declarations naming any of `via`. */
function winner(element: Element, via: string[]): Declaration | undefined {
  const found: Declaration[] = []
  for (const { style, selectorText, layer, order, media } of sheetRules) {
    if (!media.every(mediaMet)) continue
    const hits = splitList(selectorText).filter((selector) => matches(element, selector))
    if (!hits.length) continue
    const specificity = hits.map(specificityOf).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]
    for (let i = 0; i < style.length; i += 1) {
      const property = style[i]
      if (!via.includes(property)) continue
      found.push({
        property,
        value: style.getPropertyValue(property),
        important: style.getPropertyPriority(property) === 'important',
        layer,
        specificity,
        order,
        selector: selectorText,
      })
    }
  }
  const rank = (d: Declaration) => [d.important ? 1 : 0, d.important ? -d.layer : d.layer, ...d.specificity, d.order]
  return found.sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    for (let i = 0; i < ra.length; i += 1) if (ra[i] !== rb[i]) return rb[i] - ra[i]
    return 0
  })[0]
}

const BORDER_COLOR = ['border', 'border-color', 'border-top', 'border-top-color']
const COLOR = ['color']
const DECORATION = ['text-decoration', 'text-decoration-line']
const OUTLINE_STYLE = ['outline', 'outline-style']
const MAX_WIDTH = ['max-width']
const RING_SHADOW = ['--tw-ring-shadow']

function place(html: string) {
  document.body.innerHTML = html
  return document.body.firstElementChild as HTMLElement
}

/** The shadcn primitives that drew their own ring on top of the base one (#83), and how to reach the focusable part. */
const PRIMITIVES: [string, () => ReactElement, () => HTMLElement][] = [
  ['ui Button', () => <UiButton>Save</UiButton>, () => screen.getByRole('button', { name: 'Save' })],
  ['Input', () => <Input aria-label="Name" />, () => screen.getByRole('textbox', { name: 'Name' })],
  ['Textarea', () => <Textarea aria-label="Note" />, () => screen.getByRole('textbox', { name: 'Note' })],
  [
    'TabsTrigger',
    () => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">First</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel</TabsContent>
      </Tabs>
    ),
    () => screen.getByRole('tab', { name: 'First' }),
  ],
  [
    'TabsContent',
    () => (
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">First</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel</TabsContent>
      </Tabs>
    ),
    () => screen.getByRole('tabpanel'),
  ],
  [
    'Dialog close button',
    () => (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Body</DialogDescription>
        </DialogContent>
      </Dialog>
    ),
    () => screen.getByRole('button', { name: 'Close' }),
  ],
]

const skyLink = () => (
  <Button asChild variant="onSky">
    <a href="/chapter/u-1">Open</a>
  </Button>
)

/** Every class the fixtures above put on the page, so one build covers them all. */
function classesInUse(fixtures: (() => ReactElement)[]) {
  const classes = new Set<string>()
  for (const fixture of fixtures) {
    render(fixture())
    for (const element of Array.from(document.body.querySelectorAll('[class]'))) element.classList.forEach((name) => classes.add(name))
    cleanup()
  }
  return Array.from(classes)
}

const sheet = document.createElement('style')

describe('global base rules sit under the utilities (#73)', () => {
  // One build of src/index.css with every candidate class in use, as Vite would.
  beforeAll(async () => {
    const css = readFileSync(path.join(SRC, 'index.css'), 'utf8')
    const compiler = await compile(css, { base: SRC, loadStylesheet })
    const candidates = [
      'border',
      'border-red',
      'text-accent',
      'underline',
      'hover:underline',
      'focus-visible:outline-none',
      'max-w-[10px]',
      'md:max-w-[20px]',
      'max-md:max-w-[30px]',
      'motion-reduce:max-w-[40px]',
      ...classesInUse([skyLink, ...PRIMITIVES.map(([, fixture]) => fixture)]),
    ]
    sheet.textContent = compiler.build(candidates)
    document.head.append(sheet)
    sheetRules = collect(sheet.sheet as CSSStyleSheet)
  })

  it('draws a border in --hairline when no class names a colour', () => {
    expect(winner(place('<div class="border"></div>'), BORDER_COLOR)?.value).toBe('var(--hairline)')
  })

  it('lets a border colour class win over it', () => {
    const win = winner(place('<div class="border border-red"></div>'), BORDER_COLOR)
    expect(win?.selector).toBe('.border-red')
  })

  it('gives a bare link its text colour and no underline', () => {
    const link = place('<a href="/x">x</a>')
    expect(winner(link, COLOR)?.value).toBe('inherit')
    expect(winner(link, DECORATION)?.value).toBe('none')
  })

  it('lets a link colour class and an underline class win over it', () => {
    const link = place('<a href="/x" class="text-accent underline">x</a>')
    expect(winner(link, COLOR)?.selector).toBe('.text-accent')
    expect(winner(link, DECORATION)?.selector).toBe('.underline')
  })

  it('rings a focused button with the 2 px focus ring', () => {
    const button = place('<button type="button">x</button>')
    button.focus()
    const win = winner(button, OUTLINE_STYLE)
    expect(win?.property).toBe('outline')
    expect(win?.value).toContain('var(--focus-ring-width)')
  })

  it('lets focus-visible:outline-none take the ring off a hit box', () => {
    const button = place('<button type="button" class="focus-visible:outline-none">x</button>')
    button.focus()
    expect(winner(button, OUTLINE_STYLE)?.selector).toBe('.focus-visible\\:outline-none:focus-visible')
  })

  it('caps a bare svg at its container width', () => {
    expect(winner(place('<svg></svg>'), MAX_WIDTH)?.value).toBe('100%')
  })

  it('lets a max-width class win over the svg cap', () => {
    expect(winner(place('<svg class="max-w-[10px]"></svg>'), MAX_WIDTH)?.selector).toBe('.max-w-\\[10px\\]')
  })

  it('draws a sky Button rendered as a link (asChild) in the button label colour', () => {
    render(skyLink())
    const win = winner(screen.getByRole('link', { name: 'Open' }), COLOR)
    expect(win?.selector).toBe('.text-\\[color\\:var\\(--on-sky-button-text\\)\\]')
    expect(win?.value).toBe('var(--on-sky-button-text)')
  })
})

describe('rules inside @media (#83)', () => {
  it('keeps the condition of a hover variant on its rule and reads it as met', () => {
    // jsdom matches no :hover, so the rule is looked up rather than won.
    const rule = sheetRules.find(({ selectorText, style }) => selectorText === '.hover\\:underline:hover' && style.length > 0)
    expect(rule?.media).toEqual(['(hover: hover)'])
    expect(rule?.media.every(mediaMet)).toBe(true)
  })

  it('lets a min-width breakpoint class win over the svg cap', () => {
    expect(winner(place('<svg class="md:max-w-[20px]"></svg>'), MAX_WIDTH)?.value).toBe('20px')
  })

  it.each([['max-md:max-w-[30px]'], ['motion-reduce:max-w-[40px]']])('leaves %s out, its condition unmet', (name) => {
    expect(winner(place(`<svg class="${name}"></svg>`), MAX_WIDTH)?.value).toBe('100%')
  })
})

describe('one focus ring on the shadcn primitives (#83)', () => {
  it.each(PRIMITIVES)('rings a focused %s with the base outline and no ring shadow', (_name, fixture, target) => {
    render(fixture())
    const element = target()
    element.focus()
    const outline = winner(element, OUTLINE_STYLE)
    expect(outline?.value).toContain('var(--focus-ring-width)')
    expect(winner(element, RING_SHADOW)?.selector ?? '').not.toMatch(/:focus/)
  })
})
