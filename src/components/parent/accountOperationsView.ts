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

export function describeIssueCode(code: string) {
  if (code === 'parent_email_unverified') return 'Parent email needs verification.'
  if (code === 'billing_inactive') return 'Billing needs attention.'
  if (code === 'no_linked_children') return 'No linked child account is available.'
  if (code === 'child_email_unverified') return 'A child account email is not verified.'
  if (code === 'usage_unreconciled') return 'Usage is still being reconciled.'
  if (code.startsWith('child_binding_')) return `Child link needs review: ${formatStatus(code.replace('child_binding_', ''))}.`
  return formatStatus(code)
}
