import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'
import { Button } from '@/components/base/Button'

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

function collect(sheet: CSSStyleSheet) {
  const layerOrder: string[] = []
  const rules: { rule: CSSStyleRule; selectorText: string; layer: number; order: number }[] = []
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
  const walk = (list: CSSRuleList, layer: number, parent?: string) => {
    for (const rule of Array.from(list)) {
      const name = rule.constructor.name
      if (name === 'CSSLayerStatementRule') {
        for (const layerName of (rule as unknown as { nameList: string[] }).nameList ?? rule.cssText.replace(/^@layer\s+|;$/g, '').split(/\s*,\s*/)) layerIndex(layerName)
      } else if (name === 'CSSLayerBlockRule') {
        walk((rule as CSSGroupingRule).cssRules, layerIndex((rule as unknown as { name: string }).name), parent)
      } else if (name === 'CSSStyleRule') {
        const selectorText = nest(parent, (rule as CSSStyleRule).selectorText)
        rules.push({ rule: rule as CSSStyleRule, selectorText, layer, order: order++ })
        const nested = (rule as CSSStyleRule).cssRules
        if (nested?.length) walk(nested, layer, selectorText)
      } else if ('cssRules' in rule && name !== 'CSSMediaRule') {
        // @supports and the like: treat as met. @media is skipped: no rule this file checks sits in one.
        walk((rule as CSSGroupingRule).cssRules, layer, parent)
      }
    }
  }
  walk(sheet.cssRules, UNLAYERED)
  return rules
}

let sheetRules: ReturnType<typeof collect>

/** The declaration that wins `property` on `element`, among the declarations naming any of `via`. */
function winner(element: Element, via: string[]): Declaration | undefined {
  const found: Declaration[] = []
  for (const { rule, selectorText, layer, order } of sheetRules) {
    const hits = splitList(selectorText).filter((selector) => matches(element, selector))
    if (!hits.length) continue
    const specificity = hits.map(specificityOf).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]
    for (let i = 0; i < rule.style.length; i += 1) {
      const property = rule.style[i]
      if (!via.includes(property)) continue
      found.push({
        property,
        value: rule.style.getPropertyValue(property),
        important: rule.style.getPropertyPriority(property) === 'important',
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

function place(html: string) {
  document.body.innerHTML = html
  return document.body.firstElementChild as HTMLElement
}

let compiler: Awaited<ReturnType<typeof compile>>
const sheet = document.createElement('style')

/** Builds src/index.css with these class names in use, as Vite would. */
function useClasses(classes: string[]) {
  sheet.textContent = compiler.build(classes)
  sheetRules = collect(sheet.sheet as CSSStyleSheet)
}

describe('global base rules sit under the utilities (#73)', () => {
  beforeAll(async () => {
    const css = readFileSync(path.join(SRC, 'index.css'), 'utf8')
    compiler = await compile(css, { base: SRC, loadStylesheet })
    document.head.append(sheet)
    useClasses(['border', 'border-red', 'text-accent', 'underline', 'focus-visible:outline-none', 'max-w-[10px]'])
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
    const { getByRole } = render(
      <Button asChild variant="onSky">
        <a href="/chapter/u-1">Open</a>
      </Button>,
    )
    const link = getByRole('link', { name: 'Open' })
    useClasses(Array.from(link.classList))
    const win = winner(link, COLOR)
    expect(win?.selector).toBe('.text-\\[color\\:var\\(--on-sky-button-text\\)\\]')
    expect(win?.value).toBe('var(--on-sky-button-text)')
  })
})
