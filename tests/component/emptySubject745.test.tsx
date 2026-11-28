/**
 * #745 (stoa-backend#637): reader endpoints name a subject only by its
 * canonical id (`math`, `physics`, `german`, `english`), or send `null` when
 * there is none or the backend does not know it; the frontend names it. A
 * missing or unknown subject is left out: no "null", no "General", no raw id
 * on a teacher's or a parent's page.
 */
import { render } from '@testing-library/react'
import type { TFunction } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import deChat from '@/i18n/locales/de/chat.json'
import deCommon from '@/i18n/locales/de/common.json'
import { ChildLearningHistoryList } from '@/components/parent/ChildLearningHistoryList'
import { HelpRequestDetailCard } from '@/components/teacher/HelpRequestDetailCard'
import { HelpRequestList } from '@/components/teacher/HelpRequestList'
import { getHelpRequestWhere, getSubjectLabel } from '@/lib/displayLabels'
import type { TeacherHelpRequestDetail, TeacherHelpRequestSummary } from '@/types/teacher'

const t = ((key: string, options?: Record<string, unknown>) => i18n.t(key, options)) as unknown as TFunction

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

/** Words a reader must never see in place of a subject. */
function expectNoRawSubject(text: string) {
  expect(text).not.toMatch(/\bnull\b/)
  expect(text).not.toMatch(/General/i)
  expect(text).not.toMatch(/\bastronomy\b/)
}

describe('getSubjectLabel', () => {
  it('names each canonical id in the reader language', () => {
    expect(getSubjectLabel('math', t)).toBe(deChat.subjects.math)
    expect(getSubjectLabel('physics', t)).toBe(deChat.subjects.physics)
    expect(getSubjectLabel('german', t)).toBe(deChat.subjects.german)
    expect(getSubjectLabel('english', t)).toBe(deChat.subjects.english)
  })

  it('gives an empty string for null, a missing value, or an id it does not know', () => {
    expect(getSubjectLabel(null, t)).toBe('')
    expect(getSubjectLabel(undefined, t)).toBe('')
    expect(getSubjectLabel('', t)).toBe('')
    expect(getSubjectLabel('general', t)).toBe('')
    expect(getSubjectLabel('General', t)).toBe('')
    expect(getSubjectLabel('astronomy', t)).toBe('')
  })
})

describe('getHelpRequestWhere', () => {
  it('reads "subject · grade" when the subject is named', () => {
    expect(getHelpRequestWhere('math', 'grade_6_primary', t)).toBe(
      `${deChat.subjects.math} · ${deCommon.grades.grade_6_primary}`,
    )
  })

  it('reads just the grade when the subject is null or unknown', () => {
    expect(getHelpRequestWhere(null, 'grade_6_primary', t)).toBe(deCommon.grades.grade_6_primary)
    expect(getHelpRequestWhere('astronomy', '', t)).toBe(deCommon.grades.notSet)
  })
})

function summary(requestId: string, subject: string | null): TeacherHelpRequestSummary {
  return {
    requestId,
    conversationId: `c-${requestId}`,
    studentName: 'Lea Muster',
    subject,
    grade: 'grade_6_primary',
    status: 'pending',
    requestMessage: 'Wie rechne ich das?',
    createdAt: '2026-11-20T10:00:00Z',
  }
}

describe('teacher pages', () => {
  it('leave a null or unknown subject out of the request list', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HelpRequestList requests={[summary('a', null), summary('b', 'astronomy'), summary('c', 'math')]} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const text = container.textContent ?? ''
    expectNoRawSubject(text)
    expect(text).toContain(`${deChat.subjects.math} · ${deCommon.grades.grade_6_primary}`)
    expect(text).toContain(`${deCommon.grades.grade_6_primary} — Wie rechne ich das?`)
  })

  it('leave a null subject out of the request detail', () => {
    const request: TeacherHelpRequestDetail = {
      requestId: 'r1',
      conversationId: 'c1',
      student: { id: 's1', name: 'Lea Muster', grade: 'grade_6_primary' },
      subject: null,
      status: 'pending',
      messages: [],
      firstQuestion: null,
      aiAnswer: null,
      studentFollowUps: [],
    } as unknown as TeacherHelpRequestDetail
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HelpRequestDetailCard request={request} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const text = container.textContent ?? ''
    expectNoRawSubject(text)
    expect(text).toContain(deCommon.grades.grade_6_primary)
  })
})

describe('parent pages', () => {
  it('leave a null or unknown subject out of the learning history', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <ChildLearningHistoryList
          items={[
            { id: '1', title: 'Frage', summary: 'Eine Frage', subject: null, createdAt: '2026-11-20T10:00:00Z' },
            { id: '2', title: 'Frage', summary: 'Noch eine', subject: 'astronomy', createdAt: '2026-11-20T11:00:00Z' },
            { id: '3', title: 'Frage', summary: 'Und eine', subject: 'math', createdAt: '2026-11-20T12:00:00Z' },
          ]}
        />
      </I18nextProvider>,
    )
    const text = container.textContent ?? ''
    expectNoRawSubject(text)
    expect(text).toContain(deChat.subjects.math)
  })
})
