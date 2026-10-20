/**
 * The `stoa/regexp-safari` lint rule keeps src parseable on iPadOS 15 (#398):
 * a lookbehind or the `v` flag, in a literal or handed to `RegExp`, is refused,
 * so a new pattern cannot again stop a page loading there.
 */
import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import stoaRegexpSafari from '../../scripts/eslint/regexp-safari.mjs'

function problems(code: string) {
  const linter = new Linter({ configType: 'flat' })
  return linter
    .verify(
      code,
      [
        {
          files: ['**/*.ts'],
          languageOptions: { parser: tseslint.parser },
          plugins: { stoa: stoaRegexpSafari },
          rules: { 'stoa/regexp-safari': 'error' },
        },
      ],
      { filename: 'src/components/example.ts' },
    )
    .map((message) => message.ruleId)
}

describe('stoa/regexp-safari', () => {
  it.each([
    // The two MathRenderer had (#398).
    'const ITALIC_RE = /(?<!\\*)\\*(?=[^\\s*])([^*\\n]*?[^\\s*])\\*(?!\\*)/g',
    'const RE = /(\\$\\$[\\s\\S]+?\\$\\$)|((?<!\\d[ \\t]*)\\$[^$\\n]*?\\$)/g',
    "const words = text.split(/(?<= )/)",
    "const re = new RegExp('(?<!\\\\d)x')",
    "const re = RegExp('a(?<=a)', 'g')",
    'const re = new RegExp(`^${prefix}(?<!/)$`)',
    'const re = new RegExp(String.raw`(?<!\\d)x`)',
    'const re = /[\\p{L}--\\p{N}]/v',
    "const re = new RegExp('[a]', 'v')",
  ])('refuses %s', (code) => {
    expect(problems(code)).toContain('stoa/regexp-safari')
  })

  it.each([
    'const re = /(?<year>\\d{4})-(?<month>\\d{2})/u',
    'const re = /a(?=b)(?!c)(?:d)/g',
    'const re = /[(?<!]/',
    'const re = /\\(?<!/',
    'const re = /[\\](?<!]/',
    'const re = /\\p{L}\\s*[-+*/<>]/u',
    "const match = new RegExp(`^${LEGACY_TEACHER_HOME}(/.*)?$`, 'i').exec(pathname)",
    "const note = '(?<!x) is a lookbehind'",
  ])('allows %s', (code) => {
    expect(problems(code)).toEqual([])
  })
})
