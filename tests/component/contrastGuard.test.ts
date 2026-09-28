/**
 * The contrast gate refuses a rated token defined outside the token file
 * (#18). Each form a browser would honour is poisoned here once, and each
 * form that only reads a token, or only mentions one in a comment, is shown
 * to pass.
 */
import { describe, expect, it } from 'vitest'
import { findForeignDefinitions, stripComments } from '../../scripts/contrast-guard.mjs'

const TOKENS = ['--ink', '--secondary', '--accent']
const defined = (source: string, extension: string) =>
  findForeignDefinitions(source, extension, TOKENS).map((hit) => hit.token)

describe('a rated token defined outside the token file', () => {
  it.each([
    ['a later stylesheet', '.css', ':root{--ink:#CCC;--secondary:#DDD}', ['--ink', '--secondary']],
    ['a declaration on its own line', '.css', 'body {\n  --accent: red;\n}', ['--accent']],
    ['a style attribute in the entry HTML', '.html', '<body style="--ink:#CCC">', ['--ink']],
    ['a style attribute after other properties', '.html', "<p style='color: red;--ink: #CCC'>", ['--ink']],
    ['a <style> element in HTML', '.html', '<style>:root { --accent: #000 }</style>', ['--accent']],
    ['a style string in JSX', '.tsx', '<div style="--ink:#CCC" />', ['--ink']],
    ['a cssText assignment', '.ts', "element.style.cssText = '--ink: #CCC'", ['--ink']],
    ['a template literal', '.ts', 'const css = `color: red; --secondary: ${grey};`', ['--secondary']],
    ['a style object key', '.tsx', "<div style={{ '--accent': '#999' }} />", ['--accent']],
    ['a computed style object key', '.tsx', "style={{ ['--accent' as string]: '#999' }}", ['--accent']],
    ['a Tailwind arbitrary property', '.tsx', '<p className="[--ink:#555] text-ink" />', ['--ink']],
    ['setProperty', '.ts', "document.body.style.setProperty('--ink', '#000')", ['--ink']],
  ])('is caught in %s', (_form, extension, source, tokens) => {
    expect(defined(source, extension)).toEqual(tokens)
  })

  it('names the line it is on', () => {
    expect(findForeignDefinitions('a {}\n\nb { --ink: red }', '.css', TOKENS)).toEqual([{ token: '--ink', line: 3 }])
  })
})

describe('what is not a definition', () => {
  it.each([
    ['a var() reference', '.css', 'p { color: var(--ink); background: var(--accent) }'],
    ['a longer token with the same start', '.css', ':root { --ink-soft: #333; --accent-tint: #eee }'],
    ['an alias that ends in the name', '.css', ':root { --color-ink: var(--ink); --legacy-ink: 0 0% 0% }'],
    ['a CSS comment', '.css', '/* --ink: #CCC */ p {}'],
    ['an HTML comment', '.html', '<!-- <body style="--ink:#CCC"> -->'],
    ['a line comment in TS', '.ts', "// style.cssText = '--ink: #CCC'\nconst a = 1"],
    ['a block comment in TSX', '.tsx', "/* style={{ '--accent': '#999' }} */ <p />"],
    ['a read of the value', '.ts', "getComputedStyle(el).getPropertyValue('--ink')"],
    ['a mention in an array', '.ts', "const used = ['--ink', '--accent']"],
    ['a JSX reference', '.tsx', "<p style={{ color: 'var(--ink)' }} />"],
  ])('passes %s', (_form, extension, source) => {
    expect(defined(source, extension)).toEqual([])
  })

  it('does not take a URL in a string for a comment', () => {
    const source = "const api = 'https://api.test/*'\nconst css = '--ink: #CCC'"
    expect(stripComments(source, '.ts')).toBe(source)
    expect(defined(source, '.ts')).toEqual(['--ink'])
  })
})
