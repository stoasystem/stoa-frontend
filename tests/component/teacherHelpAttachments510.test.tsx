/**
 * #510: the teacher sees the pictures the student sent in a help request.
 *
 * How a picture shows, fails, and is read once is the attachment viewer's
 * (#563, `attachmentPictures563.test.tsx`). What is left here is the wiring:
 *
 * T1 - the detail card reads each picture through this request, names the
 *      student's as the student's and a teacher's message's as the
 *      teacher's; the timeline names a reply's as the teacher's.
 * T2 - the sentences are there in all four languages.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HelpRequestDetailCard } from '@/components/teacher/HelpRequestDetailCard'
import { TeacherRequestTimeline } from '@/components/teacher/TeacherRequestTimeline'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/teacher.json'
import en from '@/i18n/locales/en/teacher.json'
import fr from '@/i18n/locales/fr/teacher.json'
import italian from '@/i18n/locales/it/teacher.json'
import * as teacherApi from '@/services/teacher/teacherApi'
import type { AttachmentSummary } from '@/types/file'
import type { TeacherHelpMessage, TeacherHelpRequestDetail, TeacherHelpRequestNote } from '@/types/teacher'

vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequestAttachment: vi.fn(),
}))

const mockedContent = vi.mocked(teacherApi.getTeacherHelpRequestAttachment)
const copy = de.detail.attachments
const named = (text: string, name: string) => text.replace('{{name}}', name)

function picture(overrides: Partial<AttachmentSummary> = {}): AttachmentSummary {
  return {
    attachmentId: 'att-1',
    filename: 'tafel.png',
    mediaType: 'image/png',
    sizeBytes: 2048,
    status: 'active',
    createdAt: '2026-10-28T10:00:00Z',
    ...overrides,
  }
}

function message(role: TeacherHelpMessage['role'], attachments: AttachmentSummary[]): TeacherHelpMessage {
  return {
    id: `${role}-1`,
    conversationId: 'c1',
    role,
    content: 'Ich verstehe Schritt 2 nicht.',
    createdAt: '2026-10-28T10:00:00Z',
    attachments,
  }
}

function request(messages: TeacherHelpMessage[]): TeacherHelpRequestDetail {
  return {
    requestId: 'r1',
    conversationId: 'c1',
    student: { id: 's1', name: 'Lea', grade: '8' },
    subject: 'mathematics',
    status: 'in_progress',
    messages,
    notes: [],
  }
}

function renderWith(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  mockedContent.mockReset()
  mockedContent.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => 'blob:test/1')
  URL.revokeObjectURL = vi.fn()
  await i18n.changeLanguage('de')
})

describe('T1: each picture is read through this request, named as whose it is', () => {
  it('in the detail card: the student\'s as the student\'s, a teacher message\'s as the teacher\'s', async () => {
    renderWith(
      <HelpRequestDetailCard
        request={request([
          message('student', [picture()]),
          message('teacher', [picture({ attachmentId: 'att-2', filename: 'antwort.png' })]),
        ])}
      />,
    )

    const student = await screen.findByRole('button', { name: named(copy.open, 'tafel.png') })
    expect(within(student).getByRole('img')).toHaveAttribute('alt', named(copy.alt, 'tafel.png'))
    const teacher = await screen.findByRole('button', { name: named(copy.open, 'antwort.png') })
    expect(within(teacher).getByRole('img')).toHaveAttribute('alt', named(copy.altTeacher, 'antwort.png'))
    expect(mockedContent).toHaveBeenCalledWith('r1', 'att-1')
    expect(mockedContent).toHaveBeenCalledWith('r1', 'att-2')
    expect(screen.getAllByRole('list', { name: copy.label })).toHaveLength(2)
    expect(document.querySelectorAll('[data-help-attachments]')).toHaveLength(2)
  })

  it('in the timeline: a reply\'s as the teacher\'s', async () => {
    const note: TeacherHelpRequestNote = {
      id: 'n1',
      note: 'Schau dir die Skizze an.',
      createdAt: '2026-10-30T10:00:00Z',
      teacher: { id: 't1', name: 'Frau Keller' },
      attachments: [picture({ attachmentId: 'att-9', filename: 'skizze.png' })],
    }
    renderWith(<TeacherRequestTimeline requestId="r7" notes={[note]} />)

    const open = await screen.findByRole('button', { name: named(copy.open, 'skizze.png') })
    expect(within(open).getByRole('img')).toHaveAttribute('alt', named(copy.altTeacher, 'skizze.png'))
    expect(mockedContent).toHaveBeenCalledWith('r7', 'att-9')
  })
})

describe('T2: copy', () => {
  it('has every line in all four languages, with the file name where it is named', () => {
    const keys = Object.keys(de.detail.attachments).sort()
    for (const locale of [en, fr, italian]) {
      expect(Object.keys(locale.detail.attachments).sort()).toEqual(keys)
    }
    for (const locale of [de, en, fr, italian]) {
      const lines = locale.detail.attachments
      for (const key of ['alt', 'altTeacher', 'open', 'retryNamed'] as const) expect(lines[key]).toContain('{{name}}')
      // The retry button's name starts with its visible text (WCAG 2.5.3).
      expect(lines.retryNamed.startsWith(lines.retry)).toBe(true)
      for (const key of ['label', 'loading', 'unavailable', 'failed', 'retry'] as const) {
        expect(lines[key]).not.toContain('{{')
      }
    }
    // German for Switzerland: no ß.
    expect(JSON.stringify(de.detail.attachments)).not.toContain('ß')
  })
})
