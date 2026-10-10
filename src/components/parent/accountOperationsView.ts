import type { TFunction } from 'i18next'

/*
 * The backend sends these as enum values (`admin_marked_verified`). Given a
 * `t` for the parent namespace they are shown in the reader's language, and a
 * value with no translation yet falls back to the value made readable, as all
 * of them were before - which put "Admin marked verified" in a German page
 * (app-planet, 2026-10-10, #162). The admin console still calls these without
 * a `t` and is unchanged.
 */
type ParentT = TFunction<'parent'> | TFunction<['parent', ...string[]]>

function readable(value: string) {
  return value.replace(/[_.-]/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}

export function formatStatus(value: string | null | undefined, t?: ParentT) {
  const raw = String(value || 'unknown')
  if (!t) return readable(raw)
  return (t as TFunction<'parent'>)(`status.${raw}`, { defaultValue: readable(raw) })
}

export function supportStateTone(state: string) {
  if (state === 'blocked') return 'border-destructive/40 bg-destructive/10'
  if (state === 'attention') return 'border-amber-300 bg-amber-50/80'
  return 'border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))]'
}

const ISSUE_CODES = new Set([
  'parent_email_unverified',
  'billing_inactive',
  'no_linked_children',
  'child_email_unverified',
  'usage_unreconciled',
])

/** A support issue as a sentence in the reader's language; the parent and admin pages both pass `t`. */
export function describeIssueCode(code: string, t: ParentT) {
  const translate = t as TFunction<'parent'>
  if (ISSUE_CODES.has(code)) return translate(`issues.${code}`)
  if (code.startsWith('child_binding_')) {
    return translate('issues.childBinding', { status: formatStatus(code.replace('child_binding_', ''), t) })
  }
  return formatStatus(code, t)
}
