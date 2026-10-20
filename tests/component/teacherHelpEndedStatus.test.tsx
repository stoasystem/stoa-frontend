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
  'waiting_no_teacher',
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

// #397: a status the server may add later. Each would build a key that does
// not exist -- and `constructor` would pass an `in` check on a plain object.
const UNKNOWN = ['reassigning', 'constructor', 'title.pending']

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

  for (const language of LANGUAGES) {
    it.each(UNKNOWN)(`says %s, a status it does not know, in general ${language} words`, async (status) => {
      await i18n.changeLanguage(language)
      const { container } = renderCard(status as never)
      expect(container.textContent).not.toMatch(/ask\.help\./)
      expect(container.textContent).not.toContain(status)
      expect(container.textContent).toContain(i18n.t('chat:ask.help.fallback.body'))
    })
  }

  it('tells an English student, in general words, that a teacher was asked', async () => {
    await i18n.changeLanguage('en')
    const { container } = renderCard('reassigning' as never)
    expect(container.textContent).toContain('Teacher support requested')
    expect(container.textContent).toContain('Replies from a teacher appear in this conversation.')
    expect(container.textContent).toContain('Requested')
  })

  it('tells a German student, in du, that no teacher is free yet and the request stays open', async () => {
    await i18n.changeLanguage('de')
    const { container } = renderCard('waiting_no_teacher')
    expect(container.textContent).toContain('Gerade ist keine Lehrperson frei')
    expect(container.textContent).toContain('Deine Anfrage bleibt offen.')
    expect(container.textContent).toContain('Wartet')
  })

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
