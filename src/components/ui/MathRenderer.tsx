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
    return <span className={className}>{children}</span>
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <React.Fragment key={i}>{seg.value}</React.Fragment>
        }
        return (
          <span
            key={i}
            className={seg.type === 'block' ? 'math-block' : 'math-inline'}
            // Safe only because renderKatex returns KaTeX-generated markup, and HTML-escapes
            // the raw expression on its parse-failure path. Do not pass unescaped input here.
            dangerouslySetInnerHTML={{
              __html: renderKatex(katex, seg.value, seg.type === 'block'),
            }}
          />
        )
      })}
    </span>
  )
}
