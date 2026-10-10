/**
 * MathRenderer — renders text that may contain LaTeX inline ($...$) or
 * block ($$...$$) expressions using KaTeX.
 *
 * Falls back to plain text when KaTeX is unavailable or the expression
 * is malformed, so the chat experience is never broken by a bad formula.
 */
import React, { useEffect, useState } from 'react'

type Katex = { renderToString: (tex: string, options?: Record<string, unknown>) => string }

// KaTeX and its stylesheet are a third of the shared bundle, and most screens
// never show a formula, so they load the first time one appears.
let katexPromise: Promise<Katex> | null = null

function loadKatex(): Promise<Katex> {
  if (!katexPromise) {
    katexPromise = import('./katexLoader').then(
      (module) => module.default as unknown as Katex,
    )
  }
  return katexPromise
}

export type MathSegment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string }

/** Split a string into text / inline-math / block-math segments. */
export function parseSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = []

  // Match $$...$$ first (greedy-free), then $...$
  const RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

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

// Model answers arrive as Markdown-flavoured prose. `**bold**` and `*italic*`
// are honoured, and only outside formulas, so a `*` inside one keeps its maths
// meaning. Italic was left out at first and its asterisks were shown as
// written, in the middle of an assistant's explanation.
const BOLD_RE = /\*\*(?=\S)([\s\S]*?\S)\*\*/g
// A single asterisk, not part of a pair, with no space just inside it: the same
// flanking rule as bold, so `2 * 3 * 4` stays an expression and a list marker
// (`* item`) stays a list marker. It does not run across a line.
const ITALIC_RE = /(?<!\*)\*(?=[^\s*])([^*\n]*?[^\s*])\*(?!\*)/g

type Leaf = (text: string, key: string) => React.ReactNode[]

/** Split one run by `re`, wrapping each match and handing the rest to `rest`. */
function splitBy(
  value: string,
  re: RegExp,
  key: string,
  wrap: (inner: React.ReactNode[], key: string) => React.ReactNode,
  inner: Leaf,
  rest: Leaf,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  re.lastIndex = 0
  const matches: RegExpExecArray[] = []
  while ((match = re.exec(value)) !== null) matches.push(match)
  for (const found of matches) {
    if (found.index > lastIndex) nodes.push(...rest(value.slice(lastIndex, found.index), `${key}-${lastIndex}`))
    const at = `${key}-${found.index}`
    nodes.push(wrap(inner(found[1], at), at))
    lastIndex = found.index + found[0].length
  }
  if (lastIndex < value.length) nodes.push(...rest(value.slice(lastIndex), `${key}-${lastIndex}`))
  return nodes
}

/**
 * Bold, then italic inside and between the bold runs. React escapes these
 * children, so model output cannot inject markup through them.
 */
function emphasise(value: string, key: string, leaf: Leaf): React.ReactNode[] {
  const italic: Leaf = (text, at) =>
    splitBy(text, ITALIC_RE, `${at}i`, (inner, k) => <em key={k}>{inner}</em>, leaf, leaf)
  return splitBy(value, BOLD_RE, `${key}b`, (inner, k) => <strong key={k}>{inner}</strong>, italic, italic)
}

/** Turn the `**bold**` and `*italic*` runs of a text into React nodes. */
export function renderInlineMarkdown(value: string, keyPrefix: string): React.ReactNode[] {
  return emphasise(value, keyPrefix, (text) => (text ? [text] : []))
}

/**
 * Stands in for a formula while emphasis is matched across the whole string.
 *
 * Emphasis used to be matched inside each text run separately, so a pair that
 * opened before a formula and closed after it never met and the asterisks were
 * shown as written — which is how an assistant writes most of its maths.
 * A NUL is used because it cannot occur in the model's output.
 */
const MATH_PLACEHOLDER = '\u0000'

/** Put the formulas back where their placeholders sit, in order. */
function expandFormulas(
  text: string,
  formulas: MathSegment[],
  cursor: { index: number },
  katex: Katex,
  keyPrefix: string,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const chunks = text.split(MATH_PLACEHOLDER)

  chunks.forEach((chunk, i) => {
    if (chunk) nodes.push(chunk)
    if (i === chunks.length - 1) return

    const segment = formulas[cursor.index]
    cursor.index += 1
    if (!segment) return

    nodes.push(
      <span
        key={`${keyPrefix}-math-${cursor.index}`}
        className={segment.type === 'block' ? 'math-block' : 'math-inline'}
        // Safe only because renderKatex returns KaTeX-generated markup, and HTML-escapes
        // the raw expression on its parse-failure path. Do not pass unescaped input here.
        dangerouslySetInnerHTML={{
          __html: renderKatex(katex, segment.value, segment.type === 'block'),
        }}
      />,
    )
  })

  return nodes
}

/** Emphasis and formulas together, with emphasis allowed to span a formula. */
function renderSegments(segments: MathSegment[], katex: Katex): React.ReactNode[] {
  const formulas: MathSegment[] = []
  const joined = segments
    .map((segment) => {
      if (segment.type === 'text') return segment.value.split(MATH_PLACEHOLDER).join('')
      formulas.push(segment)
      return MATH_PLACEHOLDER
    })
    .join('')

  // Runs are visited left to right, so the formulas come back in their order.
  const cursor = { index: 0 }
  return emphasise(joined, 'md', (text, key) => expandFormulas(text, formulas, cursor, katex, key))
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char])
}

function renderKatex(katex: Katex, expression: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: true,
      strict: 'warn',
    })
  } catch {
    // This string is fed to dangerouslySetInnerHTML, and the expression comes
    // from model output, so it must be escaped before being shown verbatim.
    return `<span class="math-error">${escapeHtml(expression)}</span>`
  }
}

interface MathRendererProps {
  children: string
  className?: string
}

export function MathRenderer({ children, className }: MathRendererProps) {
  const segments = children ? parseSegments(children) : []
  const hasMath = segments.some((segment) => segment.type !== 'text')
  const [katex, setKatex] = useState<Katex | null>(null)

  useEffect(() => {
    if (!hasMath || katex) return
    let cancelled = false
    void loadKatex().then((loaded) => {
      if (!cancelled) setKatex(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [hasMath, katex])

  if (!children) return null

  // Until it loads, and if it never does, the expression is shown as written.
  if (!hasMath || !katex) {
    return <span className={className}>{renderInlineMarkdown(children, 'md')}</span>
  }

  return <span className={className}>{renderSegments(segments, katex)}</span>
}
