/**
 * The compact language switch (marketing header) was named "Language" while
 * showing "EN", so a voice command naming what is on screen missed it, and its
 * options were plain menu items, so the chosen one was not read out (#345).
 * It now matches the sky variant.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import i18n from '@/i18n'

function renderSwitcher() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher compact />
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
})
afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the compact language switch', () => {
  it('is named with the code it shows', () => {
    renderSwitcher()
    const trigger = screen.getByRole('button', { name: 'Language: English (EN)' })
    expect(trigger).toHaveTextContent('EN')
  })

  it('offers each language as a radio, the current one checked, in its own language', async () => {
    renderSwitcher()
    await userEvent.click(screen.getByRole('button', { name: 'Language: English (EN)' }))

    expect(screen.getByRole('group')).toBeInTheDocument()
    const options = screen.getAllByRole('menuitemradio')
    expect(options.map((option) => option.getAttribute('lang'))).toEqual(['en', 'de', 'fr', 'it'])
    expect(options.map((option) => option.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false'])

    await userEvent.click(options[1])
    expect(i18n.language).toBe('de')
    expect(screen.getByRole('button', { name: 'Sprache: Deutsch (DE)' })).toHaveTextContent('DE')
  })
})
