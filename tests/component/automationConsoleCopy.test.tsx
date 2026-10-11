/**
 * The learning automation console a teacher opens from
 * /teacher/learning-automation was English from top to bottom on the German
 * product (#162 walkthrough, 10 Oct 2026). It is drawn here in German, as a
 * teacher with no student chosen yet first sees it.
 */
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { LearningAutomationConsolePage } from '@/pages/learning/LearningAutomationConsolePage'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

function renderConsole() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <LearningAutomationConsolePage />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the automation console speaks the teacher’s language', () => {
  it('opens in German, with nothing left in English', () => {
    const { container } = renderConsole()

    expect(screen.getByRole('heading', { name: 'Automatisierung prüfen' })).toBeInTheDocument()
    expect(screen.getByLabelText('Schüler-ID')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vorschläge ansehen' })).toBeInTheDocument()
    expect(screen.getByText('Gib oben eine Schüler-ID ein, um die bisherigen Zuweisungen zu sehen.')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Mittel' })).toBeInTheDocument()

    const text = container.textContent ?? ''
    for (const english of ['Policy controls', 'Student id', 'Preview candidates', 'Selected candidates', 'Refused candidates', 'Assignment history', 'Medium']) {
      expect(text, english).not.toContain(english)
    }
  })
})
