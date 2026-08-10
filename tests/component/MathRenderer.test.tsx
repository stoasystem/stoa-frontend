/**
 * Renders the real MathRenderer through jsdom, so these cover the KaTeX
 * integration and the dangerouslySetInnerHTML path rather than a copy of
 * the parsing logic.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MathRenderer, parseSegments } from '@/components/ui/MathRenderer'

describe('parseSegments', () => {
  it('returns a single text segment for plain prose', () => {
    expect(parseSegments('just words')).toEqual([{ type: 'text', value: 'just words' }])
  })

  it('extracts inline math', () => {
    expect(parseSegments('area is $x^2$ units')).toEqual([
      { type: 'text', value: 'area is ' },
      { type: 'inline', value: 'x^2' },
      { type: 'text', value: ' units' },
    ])
  })

  it('extracts block math', () => {
    expect(parseSegments('$$a+b$$')).toEqual([{ type: 'block', value: 'a+b' }])
  })

  it('prefers block delimiters over inline ones', () => {
    const [segment] = parseSegments('$$\\frac{1}{2}$$')
    expect(segment.type).toBe('block')
  })

  it('leaves a lone dollar sign as text', () => {
    expect(parseSegments('costs $5 today')).toEqual([{ type: 'text', value: 'costs $5 today' }])
  })

  it('does not span newlines for inline math', () => {
    const segments = parseSegments('$a\nb$')
    expect(segments.every((s) => s.type === 'text')).toBe(true)
  })
})

describe('MathRenderer rendering', () => {
  it('renders nothing for empty content', () => {
    const { container } = render(<MathRenderer>{''}</MathRenderer>)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders plain prose as text', () => {
    render(<MathRenderer>Solve for x</MathRenderer>)
    expect(screen.getByText('Solve for x')).toBeInTheDocument()
  })

  it('produces KaTeX markup for a valid formula', () => {
    const { container } = render(<MathRenderer>{'value is $x^2$'}</MathRenderer>)
    expect(container.querySelector('.katex')).not.toBeNull()
    expect(container.querySelector('.math-inline')).not.toBeNull()
  })

  it('marks block formulas with display mode', () => {
    const { container } = render(<MathRenderer>{'$$\\int_0^1 x dx$$'}</MathRenderer>)
    expect(container.querySelector('.math-block')).not.toBeNull()
    expect(container.querySelector('.katex-display')).not.toBeNull()
  })

  it('keeps surrounding prose alongside a formula', () => {
    const { container } = render(<MathRenderer>{'before $x$ after'}</MathRenderer>)
    expect(container.textContent).toContain('before')
    expect(container.textContent).toContain('after')
  })

  it('degrades to a marked span when the formula is malformed', () => {
    const { container } = render(<MathRenderer>{'$\\frac{{{$'}</MathRenderer>)
    expect(container.querySelector('.math-error')).not.toBeNull()
  })
})

describe('MathRenderer escaping', () => {
  // AI output is not trusted markup. A malformed formula takes the fallback
  // branch, which must not be able to inject nodes into the document.
  it('does not execute markup smuggled through a malformed formula', () => {
    const { container } = render(
      <MathRenderer>{'$<img src=x onerror="window.__xss=1">\\frac{{{$'}</MathRenderer>,
    )
    expect(container.querySelector('img')).toBeNull()
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined()
  })

  it('does not inject a script element from a malformed formula', () => {
    const { container } = render(
      <MathRenderer>{'$<script>window.__xss2=1</script>\\frac{{{$'}</MathRenderer>,
    )
    expect(container.querySelector('script')).toBeNull()
    expect((window as unknown as { __xss2?: number }).__xss2).toBeUndefined()
  })
})
