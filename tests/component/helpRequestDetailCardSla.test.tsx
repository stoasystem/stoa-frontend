/**
 * The #162 production recheck (release 5ec52d50) found the closed request's
 * detail card still saying "Überfällig · 5 Tage (Ziel: 30 Minuten)" after #206
 * took the same pill off its row in the list. A finished request has no target
 * left to miss; the card shows the target only while the request is open.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { HelpRequestDetailCard } from '@/components/teacher/HelpRequestDetailCard'
import type { TeacherHelpRequestDetail } from '@/types/teacher'

const request = (status: TeacherHelpRequestDetail['status']): TeacherHelpRequestDetail =>
  ({
    requestId: 'r-1',
    conversationId: 'c-1',
    status,
    subject: 'math',
    grade: 'Sek1',
    createdAt: '2026-09-24T02:12:00Z',
    firstTeacherActionAt: '2026-09-28T15:48:00Z',
    requestMessage: 'Bitte hilf mir beim Dividieren.',
    student: { id: 's-1', name: 'Test Student', grade: 'Sek1' },
    messages: [],
    notes: [],
    sla: { status: 'breached', targetMinutes: 30, requestToFirstActionMinutes: 6576 },
  }) as unknown as TeacherHelpRequestDetail

function renderCard(status: TeacherHelpRequestDetail['status']) {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <HelpRequestDetailCard request={request(status)} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

describe('the help request card in the teacher view', () => {
  it('says nothing about the response target once the request is finished', () => {
    renderCard('resolved')
    expect(screen.queryByText('Überfällig')).toBeNull()
    expect(screen.getByText('Abgeschlossen')).toBeInTheDocument()
  })

  it('still marks a missed target while the request is open', () => {
    renderCard('in_progress')
    expect(screen.getByText('Überfällig')).toBeInTheDocument()
  })
})
