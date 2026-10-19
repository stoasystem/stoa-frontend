import { formattingLocale } from '@/i18n/languages'
import type { TFunction } from 'i18next'

export function formatStatus(value: string | null | undefined) {
  return String(value || 'unknown')
    .replace(/[_.-]/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

export function supportStateTone(state: string) {
  if (state === 'blocked') return 'border-destructive/40 bg-destructive/10'
  if (state === 'attention') return 'border-amber-300 bg-amber-50/80'
  return 'border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))]'
}

/*
 * The account-operations payload carries enum codes, not sentences: the page
 * used to title-case them and print the result, so a German parent read
 * "Attention", "Admin marked verified" and "None". Every code the backend can
 * send (account_verification_service, account_operations_service) is named in
 * `parent:accountOps.states`; anything new still falls back to the raw value
 * rather than disappearing.
 */
export function getAccountStateLabel(value: string | null | undefined, t: TFunction) {
  const code = String(value || 'unknown')
  const translated = t(`parent:accountOps.states.${code}`, { defaultValue: '' })
  return translated || formatStatus(code)
}

/*
 * The administrator's copy of this screen names the same codes in its own,
 * operator-facing words (`parent:accountOps.adminIssues`); an unknown code
 * still falls back to the raw value.
 */
export function describeIssueCode(code: string, t: TFunction) {
  if (code.startsWith('child_binding_')) {
    return t('parent:accountOps.adminIssues.child_binding', {
      status: formatStatus(code.replace('child_binding_', '')),
    })
  }
  const translated = t(`parent:accountOps.adminIssues.${code}`, { defaultValue: '' })
  return translated || formatStatus(code)
}

/*
 * The parent dashboard already names each issue code; this reads the same
 * phrases so the two screens cannot drift apart.
 */
export function getIssueLabel(code: string, t: TFunction) {
  const key = code.startsWith('child_binding_') ? 'child_binding' : code
  const translated = t(`parent:overview.issues.${key}`, { defaultValue: '' })
  return translated || formatStatus(code)
}

/*
 * The usage cards carry three more codes: the metered action
 * (`question_submission`), the quota period (a UTC day, `2026-10-18`) and a
 * reconciliation support action (`review_stale_counter`). They were
 * title-cased or printed as sent, so a German parent read "Question
 * submission", "2026-10-18" and "Support: Review stale counter". Each code
 * usage_ledger_service can send is named in `parent:accountOps.usageActions`
 * and `parent:accountOps.usageSupportActions`; a new one reads as a generic
 * phrase in the parent's language, never as the raw code.
 */
export function getUsageActionLabel(code: string | null | undefined, t: TFunction) {
  const translated = code ? t(`parent:accountOps.usageActions.${code}`, { defaultValue: '' }) : ''
  return translated || t('parent:accountOps.usageActions.unknown')
}

export function getUsageSupportActionLabel(code: string | null | undefined, t: TFunction) {
  const translated = code ? t(`parent:accountOps.usageSupportActions.${code}`, { defaultValue: '' }) : ''
  return translated || t('parent:accountOps.usageSupportActions.unknown')
}

const QUOTA_DAY = /^\d{4}-\d{2}-\d{2}$/

export function getQuotaPeriodLabel(period: string | null | undefined, t: TFunction, language: string) {
  if (period && QUOTA_DAY.test(period)) {
    const day = new Date(`${period}T00:00:00Z`)
    if (!Number.isNaN(day.getTime())) {
      // The period is a UTC day; formatting it in the reader's zone would
      // show the day before anywhere west of Greenwich.
      const date = new Intl.DateTimeFormat(formattingLocale(language), { dateStyle: 'medium', timeZone: 'UTC' }).format(day)
      return t('parent:accountOps.quotaPeriodDay', { date })
    }
  }
  return t('parent:accountOps.quotaPeriodUnknown')
}
