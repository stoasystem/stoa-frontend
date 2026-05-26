import { type FormEvent, type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ContactSuccessMessage } from '@/components/contact/ContactSuccessMessage'
import { ContactTopicSelect } from '@/components/contact/ContactTopicSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSubmitContactRequestMutation } from '@/hooks/contact/useSubmitContactRequestMutation'
import { isSupportedLanguage, supportedLanguages, type SupportedLanguage } from '@/i18n/languages'
import { cn } from '@/lib/utils'
import type { ContactRequestPayload, ContactRole, ContactTopic } from '@/services/contact/contactApi'

type ContactFormState = {
  name: string
  email: string
  phone: string
  role: ContactRole
  topic: ContactTopic
  message: string
  preferredLanguage: SupportedLanguage
}

type ContactFormErrors = Partial<Record<keyof Pick<ContactFormState, 'name' | 'email' | 'message'>, string>>

const roleOptions: ContactRole[] = ['parent', 'student', 'teacher', 'school', 'other']

export function ContactForm() {
  const { t, i18n } = useTranslation(['contact', 'common'])
  const initialLanguage = isSupportedLanguage(i18n.language) ? i18n.language : 'en'
  const [form, setForm] = useState<ContactFormState>({
    name: '',
    email: '',
    phone: '',
    role: 'parent',
    topic: 'learning_platform',
    message: '',
    preferredLanguage: initialLanguage,
  })
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const mutation = useSubmitContactRequestMutation()

  const fieldIds = useMemo(() => ({
    name: 'contact-name',
    email: 'contact-email',
    phone: 'contact-phone',
    role: 'contact-role',
    topic: 'contact-topic',
    message: 'contact-message',
    preferredLanguage: 'contact-preferred-language',
  }), [])

  const isPending = mutation.isPending

  function validate() {
    const nextErrors: ContactFormErrors = {}
    if (!form.name.trim()) {
      nextErrors.name = t('contact:form.required')
    }
    if (!form.email.trim()) {
      nextErrors.email = t('contact:form.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = t('contact:form.invalidEmail')
    }
    if (!form.message.trim()) {
      nextErrors.message = t('contact:form.required')
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !validate()) {
      return
    }

    const payload: ContactRequestPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      topic: form.topic,
      message: form.message.trim(),
      preferredLanguage: form.preferredLanguage,
    }
    if (form.phone.trim()) {
      payload.phone = form.phone.trim()
    }

    try {
      await mutation.mutateAsync(payload)
    } catch {
      // React Query stores the error state for the visible form alert.
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {mutation.isSuccess && <ContactSuccessMessage requestId={mutation.data?.requestId} />}
      {mutation.isError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {t('contact:form.error')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('contact:form.name')} htmlFor={fieldIds.name} error={errors.name}>
          <Input
            id={fieldIds.name}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder={t('contact:form.placeholders.name')}
            disabled={isPending}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined}
          />
        </Field>
        <Field label={t('contact:form.email')} htmlFor={fieldIds.email} error={errors.email}>
          <Input
            id={fieldIds.email}
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder={t('contact:form.placeholders.email')}
            disabled={isPending}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${fieldIds.email}-error` : undefined}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('contact:form.phone')} htmlFor={fieldIds.phone}>
          <Input
            id={fieldIds.phone}
            type="tel"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder={t('contact:form.placeholders.phone')}
            disabled={isPending}
            autoComplete="tel"
          />
        </Field>
        <Field label={t('contact:form.preferredLanguage')} htmlFor={fieldIds.preferredLanguage}>
          <select
            id={fieldIds.preferredLanguage}
            value={form.preferredLanguage}
            onChange={(event) => setForm((current) => ({
              ...current,
              preferredLanguage: event.target.value as SupportedLanguage,
            }))}
            disabled={isPending}
            className={selectClassName}
          >
            {supportedLanguages.map((language) => (
              <option key={language} value={language}>
                {t(`common:language.${languageNameKeyByCode[language]}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('contact:form.role')} htmlFor={fieldIds.role}>
          <select
            id={fieldIds.role}
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as ContactRole }))}
            disabled={isPending}
            className={selectClassName}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {t(`contact:roles.${role}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('contact:form.topic')} htmlFor={fieldIds.topic}>
          <ContactTopicSelect
            id={fieldIds.topic}
            value={form.topic}
            onChange={(topic) => setForm((current) => ({ ...current, topic }))}
            disabled={isPending}
          />
        </Field>
      </div>

      <Field label={t('contact:form.message')} htmlFor={fieldIds.message} error={errors.message}>
        <Textarea
          id={fieldIds.message}
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder={t('contact:form.placeholders.message')}
          disabled={isPending}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${fieldIds.message}-error` : undefined}
        />
      </Field>

      <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? t('contact:form.submitting') : t('contact:form.submit')}
      </Button>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const languageNameKeyByCode: Record<SupportedLanguage, 'english' | 'german' | 'french' | 'italian'> = {
  en: 'english',
  de: 'german',
  fr: 'french',
  it: 'italian',
}

const selectClassName = cn(
  'flex h-10 w-full rounded-md border border-border/90 bg-card/75 px-3 py-2 text-sm ring-offset-background',
  'focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  'disabled:cursor-not-allowed disabled:opacity-50',
)
