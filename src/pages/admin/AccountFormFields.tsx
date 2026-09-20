import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import type { AccountDraft, AccountDraftIssues } from '@/pages/admin/accountFormRules'
import { PROVISIONABLE_ROLES } from '@/pages/admin/accountFormRules'

type FieldProps = {
  id: string
  label: string
  required: boolean
  hint?: string
  error?: string
  children: ReactNode
}

/**
 * Card 014: a field says whether it is required and names its own refusal.
 *
 * The rule itself waits under the pointer rather than sitting on the page: a
 * form where every field carries a sentence is a form nobody reads. What may
 * not hide is a refusal, so errors stay printed. Screen readers get the rule
 * either way, through a visually hidden copy the input points at.
 */
export function AccountFormField({ id, label, required, hint, error, children }: FieldProps) {
  const { t } = useTranslation('admin')
  return (
    <div className="flex min-w-[14rem] flex-col gap-1 text-sm">
      <span className="flex items-center gap-1">
        <label
          htmlFor={id}
          title={hint}
          className={hint ? 'cursor-help underline decoration-dotted underline-offset-4' : undefined}
        >
          {label}
        </label>
        {required ? (
          <span className="text-destructive" title={t('accounts.requiredTag')}>
            <span aria-hidden="true">*</span>
            <span className="sr-only">{t('accounts.requiredTag')}</span>
          </span>
        ) : (
          <span className="sr-only">{t('accounts.optionalTag')}</span>
        )}
      </span>
      {children}
      {hint ? (
        <span id={`${id}-hint`} className="sr-only">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  )
}

/** Both the rule and the refusal, for the input's `aria-describedby`. */
function describedBy(id: string, hint: string | undefined, error: string | undefined) {
  const parts = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : undefined
}

type FieldsProps = {
  idPrefix: string
  draft: AccountDraft
  issues: AccountDraftIssues
  touched: Partial<Record<keyof AccountDraft, boolean>>
  onChange: (patch: Partial<AccountDraft>) => void
  onTouch: (field: keyof AccountDraft) => void
}

export function AccountDraftFields({
  idPrefix,
  draft,
  issues,
  touched,
  onChange,
  onTouch,
}: FieldsProps) {
  const { t } = useTranslation('admin')

  function errorFor(field: keyof AccountDraft, value: string) {
    const issue = issues[field]
    if (!issue) return undefined
    if (!touched[field] && !value.trim()) return undefined
    return t(`accounts.fieldIssues.${issue}`)
  }

  const emailError = errorFor('email', draft.email)
  const nameError = errorFor('fullName', draft.fullName)
  const dateError = errorFor('dateOfBirth', draft.dateOfBirth)
  const dateHint =
    draft.role === 'student'
      ? t('accounts.dateOfBirthStudentHint')
      : t('accounts.dateOfBirthHint')

  return (
    <>
      <AccountFormField id={`${idPrefix}-role`} label={t('accounts.roleLabel')} required>
        <select
          id={`${idPrefix}-role`}
          className="h-9 rounded-md border px-2"
          required
          value={draft.role}
          onChange={(event) => onChange({ role: event.target.value })}
        >
          {PROVISIONABLE_ROLES.map((item) => (
            <option key={item} value={item}>
              {t(`accounts.role.${item}`)}
            </option>
          ))}
        </select>
      </AccountFormField>

      <AccountFormField
        id={`${idPrefix}-email`}
        label={t('accounts.emailLabel')}
        required
        hint={t('accounts.emailHint')}
        error={emailError}
      >
        <Input
          id={`${idPrefix}-email`}
          type="email"
          required
          aria-required="true"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={describedBy(`${idPrefix}-email`, t('accounts.emailHint'), emailError)}
          value={draft.email}
          onBlur={() => onTouch('email')}
          onChange={(event) => onChange({ email: event.target.value })}
        />
      </AccountFormField>

      <AccountFormField
        id={`${idPrefix}-name`}
        label={t('accounts.nameLabel')}
        required={false}
        hint={t('accounts.nameHint')}
        error={nameError}
      >
        <Input
          id={`${idPrefix}-name`}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={describedBy(`${idPrefix}-name`, t('accounts.nameHint'), nameError)}
          value={draft.fullName}
          onBlur={() => onTouch('fullName')}
          onChange={(event) => onChange({ fullName: event.target.value })}
        />
      </AccountFormField>

      <AccountFormField
        id={`${idPrefix}-dob`}
        label={t('accounts.dateOfBirthLabel')}
        required={false}
        hint={dateHint}
        error={dateError}
      >
        <Input
          id={`${idPrefix}-dob`}
          type="date"
          aria-invalid={dateError ? true : undefined}
          aria-describedby={describedBy(`${idPrefix}-dob`, dateHint, dateError)}
          value={draft.dateOfBirth}
          onBlur={() => onTouch('dateOfBirth')}
          onChange={(event) => onChange({ dateOfBirth: event.target.value })}
        />
      </AccountFormField>
    </>
  )
}

type BlockedProps = {
  id: string
  reasons: string[]
}

/** The same sentence the button carries in its tooltip, kept visible. */
export function BlockedReason({ id, reasons }: BlockedProps) {
  const { t } = useTranslation('admin')
  if (reasons.length === 0) return null
  return (
    <p id={id} className="w-full text-xs text-destructive">
      {t('accounts.blockedPrefix')} {reasons.join(' · ')}
    </p>
  )
}
