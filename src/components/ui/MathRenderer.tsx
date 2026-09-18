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

// Model answers arrive as Markdown-flavoured prose. Only `**bold**` is honoured,
// and only inside text segments, so a `*` inside a formula keeps its maths meaning.
const BOLD_RE = /\*\*(?=\S)([\s\S]*?\S)\*\*/g

/** Turn the `**bold**` runs of a text segment into React nodes. */
export function renderInlineMarkdown(value: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  BOLD_RE.lastIndex = 0
  while ((match = BOLD_RE.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(value.slice(lastIndex, match.index))
    }
    // React escapes these children, so model output cannot inject markup here.
    nodes.push(<strong key={`${keyPrefix}-${match.index}`}>{match[1]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex))
  }

  return nodes
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

  const nodes: React.ReactNode[] = []
  const cursor = { index: 0 }
  let lastIndex = 0
  let match: RegExpExecArray | null

  BOLD_RE.lastIndex = 0
  while ((match = BOLD_RE.exec(joined)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...expandFormulas(joined.slice(lastIndex, match.index), formulas, cursor, katex, `pre${match.index}`))
    }
    // React escapes these children, so model output cannot inject markup here.
    nodes.push(
      <strong key={`bold-${match.index}`}>
        {expandFormulas(match[1], formulas, cursor, katex, `bold${match.index}`)}
      </strong>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < joined.length) {
    nodes.push(...expandFormulas(joined.slice(lastIndex), formulas, cursor, katex, 'tail'))
  }

  return nodes
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
