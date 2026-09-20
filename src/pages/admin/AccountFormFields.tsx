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
 * Card 014: a field says up front whether it is required, and names its own
 * refusal underneath. A red ring with no sentence teaches nobody anything.
 */
export function AccountFormField({ id, label, required, hint, error, children }: FieldProps) {
  const { t } = useTranslation('admin')
  return (
    <div className="flex min-w-[14rem] flex-col gap-1 text-sm">
      <span className="flex items-center gap-1">
        <label htmlFor={id}>{label}</label>
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {required ? t('accounts.requiredTag') : t('accounts.optionalTag')}
        </span>
      </span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      {error ? (
        <span id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  )
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
          aria-describedby={emailError ? `${idPrefix}-email-error` : undefined}
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
          aria-describedby={nameError ? `${idPrefix}-name-error` : undefined}
          value={draft.fullName}
          onBlur={() => onTouch('fullName')}
          onChange={(event) => onChange({ fullName: event.target.value })}
        />
      </AccountFormField>

      <AccountFormField
        id={`${idPrefix}-dob`}
        label={t('accounts.dateOfBirthLabel')}
        required={false}
        hint={
          draft.role === 'student'
            ? t('accounts.dateOfBirthStudentHint')
            : t('accounts.dateOfBirthHint')
        }
        error={dateError}
      >
        <Input
          id={`${idPrefix}-dob`}
          type="date"
          aria-invalid={dateError ? true : undefined}
          aria-describedby={dateError ? `${idPrefix}-dob-error` : undefined}
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
