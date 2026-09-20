/**
 * Card 007: the pages must not describe what the app refuses to do.
 *
 * The route judge in `billingFrozen.test.ts` reads registrations, so it can
 * only say the paid pages are unreachable. It says nothing about a page that
 * is reachable and talks about subscriptions anyway, which the terms page did
 * in all four languages. This one renders the legal pages and reads what comes
 * out, so the claim rests on the copy itself rather than on somebody grepping.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import i18n from '@/i18n'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'

const LOCALES = ['de', 'en', 'fr', 'it'] as const

// The frozen domain in the four languages the app ships. Deliberately the
// nouns for what is sold and what is paid, not every money-adjacent word: a
// judge that flags "kostenlos" would be turned off within a week.
const FROZEN_VOCABULARY =
  /subscription|checkout|refund|invoice|stripe|abonnement|rückerstattung|zahlungs|abbonamento|rimborso|pagamento|remboursement|paiement|fattura/i

async function textOf(page: 'terms' | 'privacy', locale: string): Promise<string> {
  await i18n.changeLanguage(locale)
  const Page = page === 'terms' ? TermsPage : PrivacyPage
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Page />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
  const text = document.body.textContent ?? ''
  unmount()
  return text
}

describe('card 007: the legal pages say nothing the freeze refuses', () => {
  for (const locale of LOCALES) {
    it(`renders no frozen vocabulary on the terms page in ${locale}`, async () => {
      const text = await textOf('terms', locale)

      expect(text.length).toBeGreaterThan(200)
      expect(text.match(FROZEN_VOCABULARY)).toBeNull()
    })

    it(`renders no frozen vocabulary on the privacy page in ${locale}`, async () => {
      const text = await textOf('privacy', locale)

      expect(text.length).toBeGreaterThan(200)
      expect(text.match(FROZEN_VOCABULARY)).toBeNull()
    })
  }

  it('catches the section this card withdrew, in every language', async () => {
    // The negative control. These are the strings still sitting in legal.json,
    // and the judge has to recognise them or it is reading an empty page.
    for (const locale of LOCALES) {
      await i18n.changeLanguage(locale)
      const withheld = i18n.t('terms.sections.subscriptions.body', { ns: 'legal' })

      expect(withheld.length).toBeGreaterThan(20)
      expect(withheld).toMatch(FROZEN_VOCABULARY)
    }
  })
})
