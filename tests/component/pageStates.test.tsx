import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Murmi } from '@/components/brand/Murmi'

// Empty, waiting and failed pages were three pairs of grey paragraphs. They
// carry the marmot now — which says nothing the text does not also say, so
// these tests hold the text as much as the figure.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'de', language: 'de' },
  }),
}))

describe('an empty page', () => {
  it('keeps every word it had, and adds a figure that is not read out', () => {
    const { container } = render(<EmptyState title="Noch nichts" description="Leg hier los." />)

    expect(screen.getByText('Noch nichts')).toBeInTheDocument()
    expect(screen.getByText('Leg hier los.')).toBeInTheDocument()
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('still takes the older `message` prop', () => {
    render(<EmptyState message="Keine Einträge." />)

    expect(screen.getByText('Keine Einträge.')).toBeInTheDocument()
  })
})

describe('a failed page', () => {
  it('says it is not the reader’s fault, and can be told otherwise', () => {
    const { rerender } = render(<ErrorState message="Etwas ging schief." />)
    expect(screen.getByText('state.notYourFault')).toBeInTheDocument()

    rerender(<ErrorState message="Konto nicht gefunden." reassure={false} />)
    expect(screen.queryByText('state.notYourFault')).toBeNull()
  })

  it('puts the message on its own surface rather than red text on the page', () => {
    // --red is a text colour and not meant to be a fill; the panel is what
    // makes "this part went wrong" visible without using it as one.
    const { container } = render(<ErrorState message="Etwas ging schief." />)

    const panel = [...container.querySelectorAll('div')].find((node) => node.style.background)
    expect(panel?.style.background).toBe('var(--state-error-surface)')
  })
})

describe('a waiting page', () => {
  it('falls back to a translated word, never to an English literal', () => {
    render(<LoadingState />)

    expect(screen.getByRole('status')).toHaveTextContent('status.loading')
  })

  it('says what it is waiting for when told', () => {
    render(<LoadingState message="Aufgaben werden geladen" />)

    expect(screen.getByRole('status')).toHaveTextContent('Aufgaben werden geladen')
  })
})

describe('how big Murmi is', () => {
  it('takes a token, so a size is not written into the page', () => {
    const { container } = render(<Murmi size="var(--murmi-inline)" />)
    const svg = container.querySelector('svg')!

    expect(svg.style.width).toBe('var(--murmi-inline)')
    expect(svg.getAttribute('width')).toBeNull()
  })

  it('still takes a plain number', () => {
    const { container } = render(<Murmi size={40} />)

    expect(container.querySelector('svg')?.getAttribute('width')).toBe('40')
  })
})
