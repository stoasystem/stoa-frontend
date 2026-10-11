/**
 * The German pages a student, a parent and a teacher read say nothing in
 * English, and nothing in the formal address where the rest of the page is
 * informal.
 *
 * A 10 Oct 2026 walkthrough of production in German found "Signed in" as the
 * first thing after the sign-in, "Attention", "Admin marked verified" and
 * "None" on the parent account page, "REQUEST SUMMARY", "Teacher assistance
 * seed" and "STUDENT CONTEXT" on the teacher's request, "1 sources",
 * "mathematics - Sek1" and "Breached 6576m / 30m".
 *
 * `check:untranslated` saw none of it: its ROOTS list `src/pages/parent` and
 * `src/pages/teacher` but not `src/components/parent` or
 * `src/components/teacher`, which is where all of these sentences lived.
 * This stands in that gap for the lines the walkthrough named.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { getAccountStateLabel, getIssueLabel } from '@/components/parent/accountOperationsView'
import { TeacherSlaBadge } from '@/components/teacher/TeacherSlaBadge'
import { formatMinutes, getSubjectLabel } from '@/lib/displayLabels'
import deAuth from '@/i18n/locales/de/auth.json'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'
import deTeacher from '@/i18n/locales/de/teacher.json'
import enTeacher from '@/i18n/locales/en/teacher.json'
import frTeacher from '@/i18n/locales/fr/teacher.json'
import itTeacher from '@/i18n/locales/it/teacher.json'

const SRC = path.resolve(__dirname, '../../src')
const source = (relative: string) => readFileSync(path.join(SRC, relative), 'utf8')

const PARENT = { de: deParent, en: enParent, fr: frParent, it: itParent }
const TEACHER = { de: deTeacher, en: enTeacher, fr: frTeacher, it: itTeacher }

// Every code `account_verification_service.py` and `account_operations_service.py`
// can put in the account-operations payload. The screen title-cased whatever
// arrived, so each of these reached a German parent as an English phrase.
const BACKEND_STATE_CODES = [
  'ready', 'attention', 'blocked',
  'registered', 'unverified', 'pending_verification', 'verified',
  'expired_verification', 'resend_limited', 'admin_marked_verified',
  'active', 'active_pending_verification', 'profile_parent_link',
  'pending_email_verification', 'limited_onboarding',
  'expired_code', 'verification_not_required', 'resend_available', 'resend_cooldown',
  'none', 'resend_verification_code', 'contact_support',
  'wait_for_resend_cooldown', 'review_account_verification',
]

const EVIDENCE_LABELS = [
  'title', 'parent', 'child', 'status', 'activation', 'recovery', 'resend',
  'resendCount', 'updated', 'lastResend', 'policy', 'requested',
  'resendAllowed', 'resendNotAvailable', 'noDate',
]

describe('the parent account page names a backend code in the reader language', () => {
  it.each(Object.entries(PARENT))('%s names every code the backend can send', (language, bundle) => {
    const states = (bundle as unknown as { accountOps: { states: Record<string, string> } })
      .accountOps.states

    const missing = BACKEND_STATE_CODES.filter((code) => typeof states[code] !== 'string')

    expect(missing, language).toEqual([])
  })

  it.each(Object.entries(PARENT))('%s names every evidence column', (language, bundle) => {
    const evidence = (bundle as unknown as { accountOps: { evidence: Record<string, string> } })
      .accountOps.evidence

    const missing = EVIDENCE_LABELS.filter((label) => typeof evidence[label] !== 'string')

    expect(missing, language).toEqual([])
  })

  it('would notice a code nobody translated', () => {
    // Negative control: the two checks above are lookups, so a lookup has to
    // be able to come back empty.
    const states = (enParent as unknown as { accountOps: { states: Record<string, string> } })
      .accountOps.states

    expect(states['a_state_nobody_translated']).toBeUndefined()
  })

  it('keeps the English out of the evidence card', () => {
    const card = source('components/parent/VerificationRecoveryEvidence.tsx')

    for (const english of ['Verification recovery', 'Not available', "label=\"Status\"", "'None'"]) {
      expect(card, english).not.toContain(english)
    }
    expect(card).toContain("t('accountOps.evidence.title')")
  })

  it('still shows a code nobody has translated yet', async () => {
    // The lookup returns the empty string for a key it does not hold, so the
    // fallback is what stands between a new backend code and a blank field.
    await i18n.changeLanguage('de')

    expect(getAccountStateLabel('verified', i18n.t)).toBe('Bestätigt')
    expect(getAccountStateLabel('a_code_shipped_today', i18n.t)).toBe('A code shipped today')
    expect(getAccountStateLabel(undefined, i18n.t)).toBe('Unbekannt')
    expect(getIssueLabel('child_binding_active_pending_verification', i18n.t)).toBe(
      'Eine Verknüpfung mit einem Kind muss geprüft werden',
    )
    expect(getIssueLabel('an_issue_shipped_today', i18n.t)).toBe('An issue shipped today')

    await i18n.changeLanguage('en')
  })

  it('reads the issue codes the dashboard already names', () => {
    // The account page carried its own English copy of the same five codes.
    const view = source('components/parent/accountOperationsView.ts')

    expect(view).toContain('parent:overview.issues.')
    expect(source('pages/parent/ParentAccountOperationsPage.tsx')).toContain('getIssueLabel(issue, t)')
  })
})

describe('the parent reports page', () => {
  // Both of these are read off the source rather than off a render: the page
  // is behind DashboardLayout, whose shell, notifications and account reads
  // one render test already mocks (roleShellPages), and duplicating that here
  // would guard the mocks rather than the page.
  const page = source('pages/parent/ParentReportsPage.tsx')

  it('puts no word where a figure goes', () => {
    // `Stats` is a row of figures. "Ready" stood in one of them, reading as a
    // broken value next to "0 / Children".
    const live = page
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n')

    expect(live).not.toContain("value: t('reports.weeklyReportsValue')")
    expect(live).toContain("value: children.length")
  })

  it('does not tell a parent to open a report it has just said does not exist', () => {
    // With no linked child the page read "Open the report that matches the
    // time horizon you want" directly above "No linked student accounts are
    // available yet."
    expect(page).toMatch(/children\.length > 0 && \(\s*\n\s*<p[^>]*>\{t\('reports\.studentReportsDescription'\)\}/)
  })
})

describe('the teacher request page', () => {
  it.each(Object.entries(TEACHER))('%s carries the assistance card copy', (language, bundle) => {
    const assistance = (bundle as unknown as { assistance?: Record<string, string> }).assistance

    for (const key of ['title', 'description', 'sources_one', 'sources_other', 'studentContext', 'suggestedFocus']) {
      expect(typeof assistance?.[key], `${language}.assistance.${key}`).toBe('string')
    }
  })

  it.each(Object.entries(TEACHER))('%s names the four message roles', (language, bundle) => {
    const roles = (bundle as unknown as { detail: { roles?: Record<string, string> } }).detail.roles

    for (const role of ['student', 'assistant', 'teacher', 'system']) {
      expect(typeof roles?.[role], `${language}.detail.roles.${role}`).toBe('string')
    }
  })

  it('counts one source as one source', async () => {
    // "1 sources" was the badge in every language, because the count was
    // interpolated into a fixed English plural.
    for (const language of ['de', 'en', 'fr', 'it']) {
      await i18n.changeLanguage(language)
      const one = i18n.t('teacher:assistance.sources', { count: 1 })
      const many = i18n.t('teacher:assistance.sources', { count: 4 })

      expect(one, language).toContain('1')
      expect(one, language).not.toBe(many.replace('4', '1'))
    }
    await i18n.changeLanguage('en')
  })

  it('leaves the summary bodies to the backend', () => {
    // `studentContextSummary` and `suggestedFocus` are written by
    // teacher_assistance_service.py. The card must not try to translate them.
    const card = source('components/teacher/TeacherAssistanceSummaryCard.tsx')

    expect(card).toContain('{summary.studentContextSummary}')
    expect(card).toContain('{summary.suggestedFocus}')
    expect(card).not.toContain('Teacher assistance seed')
  })

  it('says Mathematik where the payload says mathematics', async () => {
    await i18n.changeLanguage('de')
    expect(getSubjectLabel('mathematics', i18n.t)).toBe('Mathematik')
    await i18n.changeLanguage('fr')
    expect(getSubjectLabel('mathematics', i18n.t)).toBe('Mathématiques')
    await i18n.changeLanguage('en')

    expect(source('components/teacher/HelpRequestDetailCard.tsx')).not.toContain('{request.subject} -')
  })

  it('would notice a subject nobody mapped', () => {
    // Negative control for the lookup above: an unmapped id comes back as
    // itself rather than silently reading as something else.
    expect(getSubjectLabel('astrophysics', i18n.t)).toBe('astrophysics')
  })

  it('gives a response time nobody has to divide by 60', async () => {
    // The badge read "Breached 6576m / 30m".
    for (const language of ['de', 'en', 'fr', 'it']) {
      await i18n.changeLanguage(language)
      const overdue = formatMinutes(6576, i18n.t)

      expect(overdue, language).not.toContain('6576')
      expect(formatMinutes(30, i18n.t), language).toContain('30')
    }
    await i18n.changeLanguage('en')

    expect(source('components/teacher/TeacherSlaBadge.tsx')).not.toContain("label: 'Breached'")
  })

  it('draws that badge without the raw figure, in the reader language', async () => {
    // The check above only proves the formatter; this is what the teacher
    // sees. Written as a render because putting `${minutes}m / ${target}m`
    // back into the badge is exactly how the figure returns.
    await i18n.changeLanguage('de')
    const { unmount } = render(
      <I18nextProvider i18n={i18n}>
        <TeacherSlaBadge sla={{ status: 'breached', requestToFirstActionMinutes: 6576, targetMinutes: 30 }} />
      </I18nextProvider>,
    )

    const badge = screen.getByText('Überfällig').parentElement
    expect(badge?.textContent).not.toMatch(/6576/)
    expect(badge?.textContent).toContain('Tage')

    unmount()
    await i18n.changeLanguage('en')
  })
})

describe('the student account page keeps one form of address', () => {
  // `/me` is the student's account page. It says "Dein Konto" and
  // "wende dich an"; its password section said "Geben Sie Ihr aktuelles
  // Passwort ein". Parent and teacher screens keep the formal address and are
  // not read here.
  const FORMAL = /\b(Sie|Ihr|Ihre|Ihrem|Ihren|Ihres|Ihnen)\b/

  const changePassword = deAuth.changePassword as unknown as Record<string, unknown>

  it.each(['body', 'forcedTitle', 'forcedBody', 'codeHelp', 'successBody', 'failed'])(
    'addresses the reader informally in changePassword.%s',
    (key) => {
      expect(FORMAL.test(String(changePassword[key])), key).toBe(false)
    },
  )

  it('addresses the reader informally in every password error', () => {
    const errors = changePassword.errors as Record<string, string>
    const formal = Object.entries(errors).filter(([, value]) => FORMAL.test(value))

    expect(formal.map(([key]) => key)).toEqual([])
  })

  it('can tell the two apart', () => {
    // Negative control: the German parent pages are formal on purpose, and
    // the check has to see that.
    expect(FORMAL.test(deParent.accountOps.description)).toBe(true)
    expect(FORMAL.test('Gib dein aktuelles Passwort ein.')).toBe(false)
  })
})

describe('the sign-in toast speaks the language the app just switched to', () => {
  it('reads the phrase off the instance, not off a pinned t', () => {
    // react-i18next pins `t` to the language the component last rendered in.
    // The sign-in changes the language first and then raised the toast with
    // the pinned `t`, so a German account signing in on an English sign-in
    // page read "Signed in" over an otherwise German app.
    const hook = source('hooks/auth/useLoginMutation.ts')

    expect(hook).toContain("toast.success(i18n.t('auth:login.signedIn'))")
    expect(hook).not.toContain("toast.success(t('login.signedIn'))")
  })
})
