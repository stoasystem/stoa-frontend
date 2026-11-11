/**
 * The lighting moment's way back to its star (#51) on a wide screen (#660):
 * with Ask risen over the map the flight would happen behind the dim, so the
 * link moves Ask beside the map, as a star an answer found does
 * (`askFindStar487.test.tsx`). Without a host that offers it (a phone, the
 * practice stage) the link only goes to the star, as before.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AskLitCard } from '@/features/ask/AskLitCard'
import { AskMakeWayContext } from '@/features/ask/askMakeWay'
import i18n from '@/i18n'
import type { LitMoment } from '@/store/litMomentsStore'

const moment: LitMoment = {
  unitId: 'demo-refraction',
  name: 'Refraction',
  subjectId: 'physics',
  nebulaId: 'optics',
  litAt: '2026-11-01T10:00:00Z',
  conversationId: 'c-1',
}

function mount(makeWay: (() => void) | null) {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/ask/c-1']}>
        <AskMakeWayContext.Provider value={makeWay}>
          <Routes>
            <Route path="/ask/:id" element={<AskLitCard moment={moment} />} />
            <Route path="*" element={<p>the map</p>} />
          </Routes>
        </AskMakeWayContext.Provider>
      </MemoryRouter>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the lit card’s way to its star (#660)', () => {
  it('moves Ask beside the map where the host offers it', async () => {
    const makeWay = vi.fn()
    mount(makeWay)

    await userEvent.click(screen.getByRole('link', { name: i18n.t('chat:ask.lit.link') }))

    expect(makeWay).toHaveBeenCalledTimes(1)
    expect(screen.getByText('the map')).toBeInTheDocument()
  })

  it('only goes to the star where it does not (the negative control)', async () => {
    mount(null)

    await userEvent.click(screen.getByRole('link', { name: i18n.t('chat:ask.lit.link') }))

    expect(screen.getByText('the map')).toBeInTheDocument()
  })
})
