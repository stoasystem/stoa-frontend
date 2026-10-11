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
