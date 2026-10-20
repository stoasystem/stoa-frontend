/**
 * Renders the real MathRenderer through jsdom, so these cover the KaTeX
 * integration and the dangerouslySetInnerHTML path rather than a copy of
 * the parsing logic.
 */
import { render, screen, waitFor } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
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
  // KaTeX's module is a third of the shared bundle; imported cold with the full
  // suite beside it, it can run past waitFor's one second, as it did in
  // ChatMessageBubble (#133). Warmed here, the renderer still loads it on the
  // first formula; only the transform is done.
  beforeAll(async () => {
    await import('@/components/ui/katexLoader')
  })

  it('renders nothing for empty content', () => {
    const { container } = render(<MathRenderer>{''}</MathRenderer>)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders plain prose as text', () => {
    render(<MathRenderer>Solve for x</MathRenderer>)
    expect(screen.getByText('Solve for x')).toBeInTheDocument()
  })

  it('produces KaTeX markup for a valid formula', async () => {
    // KaTeX loads the first time a formula appears.
    const { container } = render(<MathRenderer>{'value is $x^2$'}</MathRenderer>)
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    expect(container.querySelector('.math-inline')).not.toBeNull()
  })

  it('marks block formulas with display mode', async () => {
    const { container } = render(<MathRenderer>{'$$\\int_0^1 x dx$$'}</MathRenderer>)
    await waitFor(() => expect(container.querySelector('.math-block')).not.toBeNull())
    expect(container.querySelector('.katex-display')).not.toBeNull()
  })

  it('keeps surrounding prose alongside a formula', () => {
    const { container } = render(<MathRenderer>{'before $x$ after'}</MathRenderer>)
    expect(container.textContent).toContain('before')
    expect(container.textContent).toContain('after')
  })

  it('degrades to a marked span when the formula is malformed', async () => {
    const { container } = render(<MathRenderer>{'$\\frac{{{$'}</MathRenderer>)
    await waitFor(() => expect(container.querySelector('.math-error')).not.toBeNull())
  })
})

describe('MathRenderer markdown emphasis', () => {
  it('renders **bold** as a strong element without the asterisks', () => {
    const { container } = render(<MathRenderer>{'**Hint:** keep going'}</MathRenderer>)
    expect(container.querySelector('strong')?.textContent).toBe('Hint:')
    expect(container.textContent).toBe('Hint: keep going')
  })

  it('emphasises prose beside a formula and leaves the formula untouched', async () => {
    const { container } = render(
      <MathRenderer>{'the **unit** is $\\frac{m}{s^2}$ here'}</MathRenderer>,
    )
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    expect(container.querySelector('strong')?.textContent).toBe('unit')
    expect(container.querySelector('.math-inline')?.querySelector('strong')).toBeNull()
  })

  it('hands the formula to katex with its own asterisks intact', async () => {
    // Asserting only that the formula holds no <strong> passes just as well
    // when the formula itself has been mangled, so this reads its content.
    const { container } = render(<MathRenderer>{'the **unit** is $a ** b$ here'}</MathRenderer>)
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    expect(container.querySelector('strong')?.textContent).toBe('unit')
    expect(container.querySelector('.math-inline')?.textContent).toContain('\u2217\u2217')
  })

  it('emphasises a run that opens before a formula and closes after it', async () => {
    // How an assistant writes most of its maths. Matching emphasis inside each
    // text run separately never paired these, so the asterisks were shown.
    const { container } = render(
      <MathRenderer>{'**Die Einheit ist $m/s^2$ hier**'}</MathRenderer>,
    )
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    const strong = container.querySelector('strong')
    expect(strong).not.toBeNull()
    expect(strong?.querySelectorAll('.math-inline')).toHaveLength(1)
    expect(container.textContent).not.toContain('**')
  })

  it('emphasises a formula standing on its own', async () => {
    const { container } = render(<MathRenderer>{'**$x$**'}</MathRenderer>)
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    expect(container.querySelector('strong')?.querySelectorAll('.math-inline')).toHaveLength(1)
    expect(container.textContent).not.toContain('**')
  })

  it('treats asterisks with no space around them as emphasis, as markdown does', () => {
    // CommonMark reads 2**3**4 as 2<strong>3</strong>4, and so does this. The
    // spaced form below is the one that means exponentiation, and it is safe.
    const { container } = render(<MathRenderer>{'2**3**4'}</MathRenderer>)
    expect(container.querySelector('strong')?.textContent).toBe('3')
  })

  it('leaves asterisks used as operators alone', () => {
    const { container } = render(<MathRenderer>{'2 ** 3 ** 4'}</MathRenderer>)
    expect(container.querySelector('strong')).toBeNull()
    expect(container.textContent).toBe('2 ** 3 ** 4')
  })

  it('escapes markup carried inside an emphasised run', () => {
    const { container } = render(
      <MathRenderer>{'**<img src=x onerror="window.__xss3=1">**'}</MathRenderer>,
    )
    expect(container.querySelector('img')).toBeNull()
    expect((window as unknown as { __xss3?: number }).__xss3).toBeUndefined()
    expect(container.querySelector('strong')?.textContent).toBe(
      '<img src=x onerror="window.__xss3=1">',
    )
  })
})

describe('MathRenderer italic', () => {
  it('renders *italic* as an em element without the asterisks', () => {
    // From an Ask answer on app.stoaedu.ch (2026-10-10), where it showed as written.
    const { container } = render(
      <MathRenderer>{'Der Nenner sagt uns: *Wie viele gleich große Stücke hat das Ganze?*'}</MathRenderer>,
    )
    expect(container.querySelector('em')?.textContent).toBe('Wie viele gleich große Stücke hat das Ganze?')
    expect(container.textContent).not.toContain('*')
  })

  it('keeps bold and italic apart, and italic inside bold', () => {
    const { container } = render(<MathRenderer>{'**fett** und *schräg* und **fett *beides* fett**'}</MathRenderer>)
    const strong = container.querySelectorAll('strong')
    expect([...strong].map((node) => node.textContent)).toEqual(['fett', 'fett beides fett'])
    expect([...container.querySelectorAll('em')].map((node) => node.textContent)).toEqual(['schräg', 'beides'])
    expect(container.textContent).not.toContain('*')
  })

  it('italicises prose around a formula and leaves the formula to katex', async () => {
    const { container } = render(<MathRenderer>{'*Hier ist $a * b$ das Produkt*'}</MathRenderer>)
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    const em = container.querySelector('em')
    expect(em?.querySelectorAll('.math-inline')).toHaveLength(1)
    expect(container.querySelector('.math-inline')?.textContent).toContain('\u2217')
  })

  it('leaves a list marker, a spaced operator and a lone asterisk alone', () => {
    const { container } = render(<MathRenderer>{'* erster Punkt\n2 * 3 * 4 und a*b'}</MathRenderer>)
    expect(container.querySelector('em')).toBeNull()
    expect(container.textContent).toBe('* erster Punkt\n2 * 3 * 4 und a*b')
  })

  it('does not pair asterisks across a line break', () => {
    const { container } = render(<MathRenderer>{'*anfang\nende*'}</MathRenderer>)
    expect(container.querySelector('em')).toBeNull()
  })

  it('escapes markup carried inside an italic run', () => {
    const { container } = render(<MathRenderer>{'*<img src=x onerror="window.__xss4=1">*'}</MathRenderer>)
    expect(container.querySelector('img')).toBeNull()
    expect((window as unknown as { __xss4?: number }).__xss4).toBeUndefined()
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

describe('plain: what a person typed (#183)', () => {
  it('typesets the formulas and leaves the rest exactly as written', async () => {
    const { container } = render(<MathRenderer plain>{'Is 2*3*4 the same as $\\sin 30^\\circ$?'}</MathRenderer>)

    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    expect(container.querySelector('em, strong')).toBeNull()
    expect(container.textContent).toContain('Is 2*3*4 the same as ')
    expect(container.textContent).not.toContain('$')
  })

  it('without a formula is the text itself, asterisks and all', () => {
    const { container } = render(<MathRenderer plain>{'2*3*4 is *not* emphasis here'}</MathRenderer>)

    expect(container.querySelector('em, strong')).toBeNull()
    expect(container.textContent).toBe('2*3*4 is *not* emphasis here')
  })
})

describe('money is not a formula (#370)', () => {
  // Any two dollars on a line were read as one inline formula, so an answer or
  // a teacher's reply about prices showed the words between them as maths.
  beforeAll(async () => {
    await import('@/components/ui/katexLoader')
  })

  it.each([
    'it costs $5 and the book $10',
    'Das Heft kostet $5, das Buch $10.',
    'Le cahier coûte 5$ et le livre 10$.',
    'between $20,000 and $30,000 a year',
    'from $3-$4 each',
    'pay $ 5 or $ 10',
  ])('leaves %j as text', (sentence) => {
    expect(parseSegments(sentence)).toEqual([{ type: 'text', value: sentence }])
  })

  it.each([
    ['$x$', 'x'],
    ['$x^2 + 1$', 'x^2 + 1'],
    ['$\\frac{1}{2}$', '\\frac{1}{2}'],
    ['$a = b$.', 'a = b'],
    ['($x$)', 'x'],
  ])('still reads %j as an inline formula', (written, tex) => {
    expect(parseSegments(written).filter((segment) => segment.type !== 'text')).toEqual([{ type: 'inline', value: tex }])
  })

  it('still reads block formulas, spaced or not', () => {
    expect(parseSegments('$$ a + b $$')).toEqual([{ type: 'block', value: 'a + b' }])
    expect(parseSegments('so\n$$\\sum_{i=1}^n i$$\ndone')).toEqual([
      { type: 'text', value: 'so\n' },
      { type: 'block', value: '\\sum_{i=1}^n i' },
      { type: 'text', value: '\ndone' },
    ])
  })

  it('reads a formula beside a price on the same line', () => {
    expect(parseSegments('It costs $5, so $x = 5$ here')).toEqual([
      { type: 'text', value: 'It costs $5, so ' },
      { type: 'inline', value: 'x = 5' },
      { type: 'text', value: ' here' },
    ])
  })

  it('shows a reply about prices exactly as written', () => {
    const sentence = 'it costs $5 and the book $10'
    const { container } = render(<MathRenderer plain>{sentence}</MathRenderer>)
    expect(container.querySelector('.math-inline, .katex')).toBeNull()
    expect(container.textContent).toBe(sentence)
  })

  it('typesets the formula and keeps the price as text', async () => {
    const { container } = render(<MathRenderer>{'It costs $5, so $x = 5$ here'}</MathRenderer>)
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    expect(container.querySelectorAll('.math-inline')).toHaveLength(1)
    expect(container.textContent).toContain('It costs $5, so ')
  })
})
