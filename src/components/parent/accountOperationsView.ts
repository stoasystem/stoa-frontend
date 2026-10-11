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

/** The English wording, still read by the administrator's copy of this screen. */
export function describeIssueCode(code: string) {
  if (code === 'parent_email_unverified') return 'Parent email needs verification.'
  if (code === 'billing_inactive') return 'Billing needs attention.'
  if (code === 'no_linked_children') return 'No linked child account is available.'
  if (code === 'child_email_unverified') return 'A child account email is not verified.'
  if (code === 'usage_unreconciled') return 'Usage is still being reconciled.'
  if (code.startsWith('child_binding_')) return `Child link needs review: ${formatStatus(code.replace('child_binding_', ''))}.`
  return formatStatus(code)
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
