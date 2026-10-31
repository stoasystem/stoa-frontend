/**
 * stoa-backend#137: the privacy page says where data is stored and processed.
 *
 * ADR-010 keeps storage in Zurich and lets AI explanations and image checks
 * be processed in the EU. The page has to say so in every language it ships,
 * together with the image retention periods decided in #133.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import i18n from '@/i18n'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'

const CITY = { de: 'Zürich', en: 'Zurich', fr: 'Zurich', it: 'Zurigo' } as const
const EU = { de: 'in der EU', en: 'in the EU', fr: "dans l'UE", it: "nell'UE" } as const

async function privacyText(locale: string): Promise<string> {
  await i18n.changeLanguage(locale)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <PrivacyPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  )
  const text = document.body.textContent ?? ''
  unmount()
  return text
}

describe('stoa-backend#137: the privacy page says where data is processed', () => {
  for (const locale of ['de', 'en', 'fr', 'it'] as const) {
    it(`names Zurich storage, EU processing and image retention in ${locale}`, async () => {
      const text = await privacyText(locale)

      expect(text).toContain(i18n.t('privacy.sections.dataLocation.title', { ns: 'legal' }))
      expect(text).toContain(CITY[locale])
      expect(text).toContain(`(AWS)`)
      expect(text).toContain(EU[locale])
      expect(text).toContain('EXIF')
      expect(text).toContain('365')
      expect(text).toContain('90')
    })
  }
})
