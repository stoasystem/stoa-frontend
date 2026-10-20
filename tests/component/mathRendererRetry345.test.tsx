/**
 * KaTeX loads the first time a formula appears. One failed load used to be
 * cached, so every formula after it stayed plain text until a reload, and the
 * rejection went unhandled (#345).
 */
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('@/components/ui/katexLoader')
  vi.resetModules()
})

describe('a KaTeX load that fails once', () => {
  it('leaves the formula as written, then typesets the next one', async () => {
    let attempts = 0
    vi.resetModules()
    vi.doMock('@/components/ui/katexLoader', async () => {
      attempts += 1
      if (attempts === 1) throw new Error('Failed to fetch dynamically imported module')
      return vi.importActual('@/components/ui/katexLoader')
    })
    const { MathRenderer } = await import('@/components/ui/MathRenderer')

    const first = render(<MathRenderer>{'area is $x^2$'}</MathRenderer>)
    await waitFor(() => expect(attempts).toBe(1))
    // Let the failed load settle; nothing may be typeset from it.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(first.container.querySelector('.katex')).toBeNull()
    expect(screen.getByText(/area is \$x\^2\$/)).toBeInTheDocument()
    first.unmount()

    const second = render(<MathRenderer>{'then $y^3$'}</MathRenderer>)
    await waitFor(() => expect(second.container.querySelector('.katex')).not.toBeNull())
    expect(attempts).toBe(2)
  })
})
