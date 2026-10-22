/**
 * MathRenderer — renders text that may contain LaTeX inline ($...$) or
 * block ($$...$$) expressions using KaTeX.
 *
 * Falls back to plain text when KaTeX is unavailable or the expression
 * is malformed, so the chat experience is never broken by a bad formula.
 */
import React, { useEffect, useMemo, useState } from 'react'

type Katex = { renderToString: (tex: string, options?: Record<string, unknown>) => string }

// KaTeX and its stylesheet are a third of the shared bundle, and most screens
// never show a formula, so they load the first time one appears.
let katexPromise: Promise<Katex> | null = null

// A failed load (a dropped connection, a chunk gone after a deploy) is not
// kept: the next formula asks again (#345). Nor is a module that came back
// empty, which is what Vite hands over when a `vite:preloadError` listener
// prevents the failure (#401).
//
// Asking for the same address again is not enough: Chromium keeps a failed
// import for the rest of the document and answers it again without asking
// the network (seen with 148), so formulas stayed as written for good. The
// next formula therefore asks for KaTeX's file under a new address,
// `?retry=1`, then `?retry=2` (#447). That is safe for this file alone: it
// imports nothing, while a page's file would meet its own imports' failures again.
let katexRetry: { file: string; count: number } | null = null

/**
 * KaTeX's file, as a failed import names it: Chromium and Firefox put the
 * address in the message, of the error or of one it wraps (`cause`). A
 * browser that does not (Safari) asks for the same address again, as before.
 */
function katexFileIn(error: unknown): string | null {
  for (const failure of [error, error instanceof Error ? (error as { cause?: unknown }).cause : undefined]) {
    if (!(failure instanceof Error)) continue
    for (const word of failure.message.split(/\s+/)) {
      let url: URL
      try {
        url = new URL(word, window.location.href)
      } catch {
        continue
      }
      // Only our own file: the address is read from a message, after all.
      if (url.origin === window.location.origin && /\/katexLoader[\w-]*\.[jt]s$/.test(url.pathname)) return url.pathname
    }
  }
  return null
}

function loadKatex(): Promise<Katex> {
  if (!katexPromise) {
    const pending: Promise<{ default?: unknown } | undefined> = katexRetry
      ? import(/* @vite-ignore */ `${katexRetry.file}?retry=${(katexRetry.count += 1)}`)
      : import('./katexLoader')
    katexPromise = pending
      .then((module) => {
        if (!module?.default) throw new Error('KaTeX did not load')
        return module.default as Katex
      })
      .catch((error: unknown) => {
        katexPromise = null
        const file = katexRetry ? null : katexFileIn(error)
        if (file) katexRetry = { file, count: 0 }
        throw error
      })
  }
  return katexPromise
}

export type MathSegment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string }

/**
 * What a pair of dollars with space just inside must hold to be a formula: a
 * TeX command or mark, a letter beside an operator (x + 1, 2x - 3), or one term
 * with no space in it (x, 2x, f(x)). The words between two prices have none.
 */
const PADDED_MATHS_RE = /[\\^_{}=]|\p{L}\s*[-+*/<>]|[-+*/<>]\s*\p{L}|^\S+$/u

/**
 * Whether a number, maybe then spaces or tabs, ends just before `index`. A
 * check in code rather than a lookbehind in the pattern: Safari before 16.4
 * cannot parse one, and the whole module then fails to load (#398).
 */
function followsNumber(text: string, index: number): boolean {
  let at = index
  while (at > 0 && (text[at - 1] === ' ' || text[at - 1] === '\t')) at -= 1
  return at > 0 && /\d/.test(text[at - 1])
}

/** Split a string into text / inline-math / block-math segments. */
export function parseSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = []

  // Match $$...$$ first (greedy-free), then $...$. An inline formula hugs its
  // dollars -- no space just inside either one -- and its closing dollar is
  // not followed by a digit, as in Pandoc: so "it costs $5 and the book $10"
  // stays a sentence about money (#370).
  //
  // Models and teachers also write "$ x^2 + 1 $", so a pair with space inside
  // is read too when what it holds is maths, its opening dollar does not follow
  // a number ("5 $ et 10 $") and its closing one is not followed by a number,
  // even after a space ("$ 5 or $ 10") (#386).
  const RE = /(\$\$[\s\S]+?\$\$|\$[^\s$](?:[^$\n]*?[^\s$])?\$(?!\d))|(\$[^$\n]*?\$(?![ \t]*\d))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = RE.exec(text)) !== null) {
    const padded = match[2]
    if (padded && (followsNumber(text, match.index) || !PADDED_MATHS_RE.test(padded.slice(1, -1).trim()))) {
      // Not a formula; its closing dollar may still open one.
      RE.lastIndex = match.index + 1
      continue
    }

    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }

    const raw = match[0]
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
// (`* item`) stays a list marker. It does not run across a line. A run of two
// or more asterisks is matched first, capturing nothing, and passed over whole,
// so none of its asterisks opens one: that stands in for a lookbehind,
// `(?<!\*)`, which Safari before 16.4 cannot parse (#398).
const ITALIC_RE = /\*{2,}|\*(?=[^\s*])([^*\n]*?[^\s*])\*(?!\*)/g

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
    // A match that captured nothing is passed over: ITALIC_RE's runs of asterisks.
    if (found[1] === undefined) continue
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
  /**
   * Formulas only: everything else stays exactly as written. For what a
   * person typed (a student's question, a teacher's reply), where "2*3*4" is a
   * product and not emphasis; the assistant's markdown keeps the default.
   */
  plain?: boolean
}

/** Text runs as they are, formulas typeset. */
function renderPlainSegments(segments: MathSegment[], katex: Katex): React.ReactNode[] {
  const formulas = segments.filter((segment) => segment.type !== 'text')
  const joined = segments.map((segment) => (segment.type === 'text' ? segment.value.split(MATH_PLACEHOLDER).join('') : MATH_PLACEHOLDER)).join('')
  return expandFormulas(joined, formulas, { index: 0 }, katex, 'plain')
}

export function MathRenderer({ children, className, plain = false }: MathRendererProps) {
  const segments = useMemo(() => (children ? parseSegments(children) : []), [children])
  const hasMath = segments.some((segment) => segment.type !== 'text')
  const [katex, setKatex] = useState<Katex | null>(null)

  useEffect(() => {
    if (!hasMath || katex) return
    let cancelled = false
    loadKatex().then(
      (loaded) => {
        if (!cancelled) setKatex(loaded)
      },
      () => {
        // The expression stays as written; the next render that needs a
        // formula tries the load again.
      },
    )
    return () => {
      cancelled = true
    }
  }, [hasMath, katex])

  // Typesetting is the costly part, and the text is drawn again whenever what
  // is around it is: in Ask, at every key typed and every frame of the sheet
  // dragged (#416). So it is done again only when the text or KaTeX changes.
  const nodes = useMemo(() => {
    if (!children) return null
    // Until it loads, and if it never does, the expression is shown as written.
    if (!hasMath || !katex) return plain ? children : renderInlineMarkdown(children, 'md')
    return plain ? renderPlainSegments(segments, katex) : renderSegments(segments, katex)
  }, [children, hasMath, katex, plain, segments])

  if (!children) return null

  // Plain text with no formula is the text itself, with no wrapper of its own.
  if (plain && (!hasMath || !katex) && !className) return <>{children}</>
  return <span className={className}>{nodes}</span>
}
