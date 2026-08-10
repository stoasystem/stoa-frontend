/**
 * MathRenderer — renders text that may contain LaTeX inline ($...$) or
 * block ($$...$$) expressions using KaTeX.
 *
 * Falls back to plain text when KaTeX is unavailable or the expression
 * is malformed, so the chat experience is never broken by a bad formula.
 */
import React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

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

function renderKatex(expression: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: true,
      strict: 'warn',
    })
  } catch {
    return `<span class="math-error">${expression}</span>`
  }
}

interface MathRendererProps {
  children: string
  className?: string
}

export function MathRenderer({ children, className }: MathRendererProps) {
  if (!children) return null

  const segments = parseSegments(children)

  if (segments.length === 1 && segments[0].type === 'text') {
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
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: renderKatex(seg.value, seg.type === 'block'),
            }}
          />
        )
      })}
    </span>
  )
}
