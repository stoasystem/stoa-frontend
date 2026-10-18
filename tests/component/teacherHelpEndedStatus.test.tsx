import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { TeacherHelpStatusCard } from '@/features/ask/TeacherHelp'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

// #265: a request nobody took in time, or one the student withdrew, pinned
// `ask.help.title.expired` over `ask.help.body.expired` under the Ask header,
// in every language. Every status the server can report has its words.
const STATUSES: TeacherHelpStatus[] = [
  'pending',
  'assigned',
  'in_progress',
  'resolved',
  'cancelled',
  'withdrawn',
  'expired',
]
const LANGUAGES = ['en', 'de', 'fr', 'it'] as const
const initialLanguage = i18n.language

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

function renderCard(status: TeacherHelpStatus) {
  return render(
    <I18nextProvider i18n={i18n}>
      <TeacherHelpStatusCard
        request={{ requestId: 'r-1', conversationId: 'c-1', status, teacherName: 'Frau Muster' } as never}
        teachersOnline
      />
    </I18nextProvider>,
  )
}

describe('the pinned teacher help card', () => {
  for (const language of LANGUAGES) {
    it.each(STATUSES)(`says %s in ${language} words, not keys`, async (status) => {
      await i18n.changeLanguage(language)
      const { container } = renderCard(status)
      expect(container.textContent).not.toMatch(/ask\.help\./)
      expect(container.textContent?.trim()).not.toBe('')
    })
  }

  it('tells a German student, in du, that nobody was free in time', async () => {
    await i18n.changeLanguage('de')
    const { container } = renderCard('expired')
    expect(container.textContent).toContain('Keine Lehrperson war rechtzeitig frei')
    expect(container.textContent).toContain('Deine Anfrage ist abgelaufen.')
    expect(container.textContent).toContain('Abgelaufen')
  })

  it('tells a French student, in tu, that the request was withdrawn', async () => {
    await i18n.changeLanguage('fr')
    const { container } = renderCard('withdrawn')
    expect(container.textContent).toContain('Tu as retiré ta demande')
    expect(container.textContent).toContain('Retirée')
  })
})
