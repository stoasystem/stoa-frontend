/**
 * Pure-logic tests for parseSegments (the math-splitting algorithm in MathRenderer).
 * Duplicates the function in plain JS so we can test without a TypeScript compiler.
 *
 * Run: node tests/unit/MathRenderer.parseSegments.test.mjs
 */
import assert from 'node:assert/strict'
import test from 'node:test'

/** @param {string} text @returns {Array<{type:string,value:string}>} */
function parseSegments(text) {
  const segments = []
  const RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  let lastIndex = 0
  let match

  while ((match = RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    const raw = match[1]
    if (raw.startsWith('$$')) {
      segments.push({ type: 'block', value: raw.slice(2, -2).trim() })
    } else {
      segments.push({ type: 'inline', value: raw.slice(1, -1).trim() })
    }
    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return segments
}

test('plain text with no math returns single text segment', () => {
  const result = parseSegments('Hello world')
  assert.equal(result.length, 1)
  assert.equal(result[0].type, 'text')
  assert.equal(result[0].value, 'Hello world')
})

test('inline math $x^2$ is recognised', () => {
  const result = parseSegments('The value is $x^2$ here.')
  assert.equal(result.length, 3)
  assert.equal(result[0].type, 'text')
  assert.equal(result[1].type, 'inline')
  assert.equal(result[1].value, 'x^2')
  assert.equal(result[2].type, 'text')
})

test('block math $$...$$ is recognised', () => {
  const result = parseSegments('Area: $$A = \\pi r^2$$')
  assert.equal(result.length, 2)
  assert.equal(result[0].type, 'text')
  assert.equal(result[1].type, 'block')
  assert.equal(result[1].value, 'A = \\pi r^2')
})

test('multiple inline expressions in one string', () => {
  const result = parseSegments('$a$ plus $b$ equals $c$')
  const types = result.map((s) => s.type)
  assert.deepEqual(types, ['inline', 'text', 'inline', 'text', 'inline'])
})

test('empty string returns empty array', () => {
  const result = parseSegments('')
  assert.equal(result.length, 0)
})

test('unmatched single dollar is treated as plain text', () => {
  const result = parseSegments('Price: $99.99')
  assert.ok(result.every((s) => s.type === 'text'))
})

test('block math takes precedence over inline delimiters', () => {
  const result = parseSegments('$$x + y = z$$')
  assert.equal(result.length, 1)
  assert.equal(result[0].type, 'block')
})

test('mixed text and block math', () => {
  const result = parseSegments('The formula $$E = mc^2$$ is famous.')
  assert.equal(result.length, 3)
  assert.equal(result[0].type, 'text')
  assert.equal(result[1].type, 'block')
  assert.equal(result[2].type, 'text')
})
