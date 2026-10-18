/**
 * The teacher pages the #162 walkthrough found in English (app-planet,
 * 2026-10-10) and main had not reached yet: the availability editor with its
 * subject options and summary, the reply composer, the AI teacher tools and
 * the practice context. Rendered in German, with every new key checked in all
 * four languages.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'
import { PracticeRequestContextCard } from '@/components/teacher/PracticeRequestContextCard'
import { TeacherAvailabilitySummary } from '@/components/teacher/TeacherAvailabilitySummary'
import { TeacherReplyComposer } from '@/components/teacher/TeacherReplyComposer'
import { TeacherSubjectSelector } from '@/components/teacher/TeacherSubjectSelector'
import i18n from '@/i18n'
import deTeacher from '@/i18n/locales/de/teacher.json'

function wrap(children: ReactNode) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
    </I18nextProvider>
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

describe('the teacher pages in German', () => {
  it('shows availability with German weekdays and subject names', () => {
    render(wrap(
      <TeacherAvailabilitySummary
        availability={{ subjects: ['math'], weeklyAvailability: [{ dayOfWeek: 'friday', startTime: '16:00', endTime: '18:00' }] } as never}
      />,
    ))
    expect(screen.getByText('Aktuelle Verfügbarkeit')).toBeInTheDocument()
    expect(screen.getByText('Fächer: Mathematik')).toBeInTheDocument()
    expect(screen.getByText('Freitag: 16:00–18:00')).toBeInTheDocument()
  })

  it('reads the subject options in German and keeps the values it sends', async () => {
    const changes: string[][] = []
    render(wrap(<TeacherSubjectSelector selectedSubjects={[]} onChange={(next) => changes.push(next)} />))
    for (const label of ['Mathematik', 'Physik', 'Chemie', 'Englisch', 'Biologie']) {
      expect(screen.getByRole('checkbox', { name: label })).toBeInTheDocument()
    }
    expect(screen.queryByText('Mathematics')).toBeNull()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mathematik' }))
    expect(changes).toEqual([['math']])
  })

  it('labels the reply composer in German', () => {
    render(wrap(<TeacherReplyComposer isSubmitting={false} onSubmit={() => undefined} />))
    expect(screen.getByLabelText('Antwort der Lehrperson')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Formel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Antwort senden' })).toBeInTheDocument()
  })

  it('describes the practice context in German', () => {
    render(wrap(
      <PracticeRequestContextCard
        context={{ source: 'question-bank', topic: 'Brüche', attempts: 2, studentAnswer: '', hintViewed: true } as never}
      />,
    ))
    expect(screen.getByText('Quelle: Übungsbibliothek')).toBeInTheDocument()
    expect(screen.getByText('Nicht erfasst')).toBeInTheDocument()
    expect(screen.getByText('Ja')).toBeInTheDocument()
  })
})

describe('the new teacher keys exist in all four languages', () => {
  function leaves(node: unknown, prefix: string): string[] {
    if (typeof node !== 'object' || node === null) return [prefix]
    return Object.entries(node).flatMap(([key, value]) => leaves(value, `${prefix}.${key}`))
  }

  it('availability, AI tools, reply and practice context', () => {
    const groups = ['availability.editor', 'availability.summary', 'aiTools', 'reply', 'practiceContext']
    const keys = groups.flatMap((group) =>
      leaves(group.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], deTeacher), group),
    )
    expect(keys.length).toBeGreaterThan(40)
    for (const language of ['de', 'en', 'fr', 'it']) {
      const missing = keys.filter((key) => {
        const base = key.replace(/_(one|other)$/, '')
        return !i18n.exists(`teacher:${key}`, { lng: language }) && !i18n.exists(`teacher:${base}`, { lng: language, count: 2 })
      })
      expect(missing, language).toEqual([])
    }
  })
})
