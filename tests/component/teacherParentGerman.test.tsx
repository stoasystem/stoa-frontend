/**
 * The teacher and parent pages showed English in a German interface: the
 * availability editor, the request detail (AI tools, reply, SLA), and the
 * parent account page, where backend values such as `admin_marked_verified`
 * were only made readable (app-planet, 2026-10-10, #162). These render the
 * pieces in German and check that every new key exists in all four languages.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'
import { describeIssueCode, formatStatus } from '@/components/parent/accountOperationsView'
import { VerificationRecoveryEvidence } from '@/components/parent/VerificationRecoveryEvidence'
import { TeacherAvailabilitySummary } from '@/components/teacher/TeacherAvailabilitySummary'
import { TeacherReplyComposer } from '@/components/teacher/TeacherReplyComposer'
import { TeacherSubjectSelector } from '@/components/teacher/TeacherSubjectSelector'
import { TeacherSlaBadge } from '@/components/teacher/TeacherSlaBadge'
import i18n from '@/i18n'
import deParent from '@/i18n/locales/de/parent.json'
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
  it('names the SLA state and the minutes in German', () => {
    render(wrap(<TeacherSlaBadge sla={{ status: 'at_risk', targetMinutes: 30, requestToFirstActionMinutes: 24 } as never} />))
    expect(screen.getByText('Frist gefährdet')).toBeInTheDocument()
    expect(screen.getByText('24 / 30 Min.')).toBeInTheDocument()
  })

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
    expect(changes).toEqual([['Mathematics']])
  })

  it('labels the reply composer in German', () => {
    render(wrap(<TeacherReplyComposer isSubmitting={false} onSubmit={() => undefined} />))
    expect(screen.getByLabelText('Antwort der Lehrperson')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Formel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Antwort senden' })).toBeInTheDocument()
  })
})

describe('the parent account page in German', () => {
  const t = () => i18n.getFixedT('de', 'parent') as unknown as TFunction<'parent'>

  it('translates the backend values it knows and makes the rest readable', () => {
    expect(formatStatus('admin_marked_verified', t())).toBe('Von der Verwaltung bestätigt')
    expect(formatStatus('attention', t())).toBe('Aufmerksamkeit nötig')
    expect(formatStatus('something_new', t())).toBe('Something new')
    // Without a reader language, as before.
    expect(formatStatus('admin_marked_verified')).toBe('Admin marked verified')
  })

  it('says what a support issue means in German', () => {
    expect(describeIssueCode('no_linked_children', t())).toBe('Es ist noch kein Kinderkonto verknüpft.')
    expect(describeIssueCode('child_binding_pending', t())).toBe('Die Verknüpfung mit dem Kind muss geprüft werden: Ausstehend.')
  })

  it('shows the verification evidence in German', () => {
    render(wrap(
      <VerificationRecoveryEvidence
        parent={{ name: 'Test Parent', email: 'parent@example.com', verification: { emailVerificationStatus: 'admin_marked_verified', supportAction: 'contact_support', resendAllowed: false } } as never}
        children={[]}
      />,
    ))
    expect(screen.getByText('Wiederherstellung der Verifizierung')).toBeInTheDocument()
    expect(screen.getByText('Von der Verwaltung bestätigt')).toBeInTheDocument()
    expect(screen.getByText('Support kontaktieren')).toBeInTheDocument()
    expect(screen.getByText('Nicht möglich')).toBeInTheDocument()
    expect(screen.queryByText('Verification recovery')).toBeNull()
  })
})

describe('every backend status value the parent page can show', () => {
  // The #162 re-check still found "None": support_action can be `none`, and
  // only the values seen so far had been translated. This is every value the
  // backend's support_action / support_recovery_state and the frontend's
  // verification and activation types name (2026-10-11).
  const VALUES = [
    'none', 'blocked', 'contact_support', 'expired_code', 'resend_available', 'resend_cooldown', 'resend_limited',
    'resend_verification_code', 'review_account_verification', 'verification_not_required', 'verified',
    'wait_for_resend_cooldown', 'active', 'admin_marked_verified', 'expired_verification', 'limited_onboarding',
    'pending_email_verification', 'pending_verification', 'registered', 'unverified',
  ]

  it.each(['de', 'en', 'fr', 'it'])('has a translation in %s', (language) => {
    const missing = VALUES.filter((value) => !i18n.exists(`parent:status.${value}`, { lng: language }))
    expect(missing).toEqual([])
  })

  it('shows the support action "none" in German', () => {
    expect(formatStatus('none', i18n.getFixedT('de', 'parent') as unknown as TFunction<'parent'>)).toBe('Keine Massnahme nötig')
  })
})

describe('the new keys exist in all four languages', () => {
  function leaves(node: unknown, prefix = ''): string[] {
    if (typeof node !== 'object' || node === null) return [prefix]
    return Object.entries(node).flatMap(([key, value]) => leaves(value, prefix ? `${prefix}.${key}` : key))
  }

  it.each([
    ['teacher', ['availability.editor', 'availability.editor.subjectNames', 'availability.summary', 'aiTools', 'reply', 'slaBadge', 'detail.card', 'practiceContext', 'assistance'], deTeacher],
    ['parent', ['verification', 'issues', 'status'], deParent],
  ] as const)('%s', (namespace, groups, german) => {
    const keys = groups.flatMap((group) => leaves(group.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], german), group))
    expect(keys.length).toBeGreaterThan(20)
    for (const language of ['de', 'en', 'fr', 'it']) {
      for (const key of keys) {
        const base = key.replace(/_(one|other)$/, '')
        expect(i18n.exists(`${namespace}:${base}`, { lng: language, count: 2 }) || i18n.exists(`${namespace}:${key}`, { lng: language }), `${language} ${namespace}:${key}`).toBe(true)
      }
    }
  })
})
