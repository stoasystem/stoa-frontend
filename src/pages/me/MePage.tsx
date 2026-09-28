/*
 * `/me`, the account page (#13 point 4, built in #46): profile, language,
 * notification preferences and the password change. A student's, and the
 * profile page for administrators and the organisation roles, who have no
 * other; teachers and parents keep their own (/tutor/profile,
 * /parent/account-operations).
 */
import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Avatar } from '@/components/base/Avatar'
import { Group, Row } from '@/components/base/Group'
import { ICON, ROW } from '@/components/base/sizes'
import { PASSWORD_SECTION_ID } from '@/components/shell/accountMenuTargets'
import { NotificationPreferencesGroup } from '@/features/account/NotificationPreferencesGroup'
import { PasswordChangeFields, passwordChangeStatusKey } from '@/features/account/PasswordChangeFields'
import { usePasswordChange } from '@/features/account/usePasswordChange'
import { languageNameKeys, useChangeLanguage } from '@/hooks/i18n/useChangeLanguage'
import { supportedLanguages } from '@/i18n/languages'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuthStore } from '@/store/authStore'

function LanguageGroup() {
  const { t } = useTranslation('common')
  const { current, changeLanguage } = useChangeLanguage()

  return (
    <Group title={<span id="me-language-heading">{t('me.language.heading')}</span>}>
      <div
        role="radiogroup"
        aria-labelledby="me-language-heading"
        className="flex flex-col [&>*+*]:border-t [&>*+*]:border-hairline"
      >
        {supportedLanguages.map((code) => (
          <label
            key={code}
            lang={code}
            className="flex cursor-pointer items-center hover:bg-ground [&:has(input:focus-visible)]:outline-2 [&:has(input:focus-visible)]:-outline-offset-2 [&:has(input:focus-visible)]:outline-ring"
            style={{ minHeight: ROW.settings, paddingInline: ROW.paddingX, gap: ROW.gap }}
          >
            <input
              type="radio"
              name="me-language"
              value={code}
              checked={current === code}
              onChange={() => changeLanguage(code)}
              className="sr-only"
            />
            <span className="flex-1 text-[15px] leading-[1.35] font-medium text-ink">{t(languageNameKeys[code])}</span>
            {current === code && (
              <Check aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} className="shrink-0 text-accent" />
            )}
          </label>
        ))}
      </div>
    </Group>
  )
}

function PasswordGroup() {
  const { t } = useTranslation(['auth', 'common'])
  const flow = usePasswordChange()
  const location = useLocation()
  const heading = useRef<HTMLHeadingElement>(null)

  // The account menu's "Change password" lands here.
  useEffect(() => {
    if (location.hash !== `#${PASSWORD_SECTION_ID}`) return
    heading.current?.scrollIntoView?.({ block: 'start' })
    heading.current?.focus({ preventScroll: true })
  }, [location.hash])

  return (
    <section id={PASSWORD_SECTION_ID} aria-labelledby="me-password-heading" className="flex scroll-mt-20 flex-col">
      <h2
        id="me-password-heading"
        ref={heading}
        tabIndex={-1}
        className="m-0 text-caption uppercase"
        style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)', padding: '0 16px 8px' }}
      >
        {flow.step === 'done' ? t('auth:changePassword.successTitle') : t('common:me.password.heading')}
      </h2>
      <div
        className="flex flex-col gap-4 border border-[color:var(--card-border)] bg-surface"
        style={{ borderRadius: ROW.groupRadius, padding: ROW.paddingX }}
      >
        <p className="m-0 text-[15px] leading-[1.45] text-caption" role="status">
          {t(passwordChangeStatusKey(flow), { email: flow.maskedRecipient })}
        </p>
        <PasswordChangeFields flow={flow} idPrefix="me-password" />
      </div>
    </section>
  )
}

/** `/me`. */
export function MePage({ titleKey = 'studentRoutes.me.title' }: { titleKey?: string }) {
  const { t } = useTranslation('common')
  const user = useAuthStore((state) => state.user)

  if (!user) return null

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[18px]">
        <h1 className="m-0 text-ink" style={{ font: 'var(--t-large)', letterSpacing: 'var(--t-large-tracking)' }}>
          {t(titleKey)}
        </h1>

        <div className="flex items-center gap-3.5 px-5 pb-1">
          <Avatar name={user.name} size={60} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="m-0 truncate text-[20px] leading-[1.3] font-semibold text-ink">{user.name}</p>
            <p className="m-0 truncate text-[14px] leading-[1.3] text-caption">{t(`roles.${user.role}`)}</p>
          </div>
        </div>

        {/* Read-only: no endpoint edits a name or an address; an administrator issues the account. */}
        <div className="flex flex-col gap-2">
          <Group title={t('me.profile.heading')}>
            <Row compact title={t('me.profile.name')} trailing={<span className="truncate">{user.name}</span>} />
            <Row compact title={t('me.profile.email')} trailing={<span className="truncate">{user.email}</span>} />
          </Group>
          <p className="m-0 px-4 text-[13px] leading-[1.35] text-caption">{t('me.profile.managed')}</p>
        </div>

        <LanguageGroup />

        {user.role === 'student' && <NotificationPreferencesGroup />}

        <PasswordGroup />
      </div>
    </AppLayout>
  )
}
