import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base/Button'
import { PasswordChangeFields, passwordChangeStatusKey } from '@/features/account/PasswordChangeFields'
import { usePasswordChange } from '@/features/account/usePasswordChange'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { getHomePathForUserRole } from '@/lib/navigation'
import { useAuthStore } from '@/store/authStore'

/*
 * `/settings/password`: the password change for teachers and parents, and for
 * any account under a forced change (an administrator reset), students
 * included. Everyone else changes theirs on /me, with the same flow (#46).
 */
export function ChangePasswordPage() {
  const { t } = useTranslation(['auth', 'common', 'errors'])
  const user = useAuthStore((state) => state.user)
  const flow = usePasswordChange()
  const { step, mustChangePassword } = flow
  // The route sits inside ProtectedRoute, so whoever reaches this page is
  // signed in, and Cognito's change_password does not revoke their tokens.
  // Both exits therefore lead back into the app, never to the login screen.
  const homePath = user ? getHomePathForUserRole(user.role) : '/'

  return (
    <DashboardLayout>
      <section
        className="flex max-w-2xl flex-col gap-4 border border-[color:var(--card-border)] bg-surface p-6 md:p-8"
        style={{ borderRadius: 'var(--corner-list)' }}
      >
        <p className="m-0 text-caption uppercase" style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)' }}>
          {t('auth:changePassword.eyebrow')}
        </p>
        <h1 className="m-0 text-ink" style={{ font: 'var(--t-large)', letterSpacing: 'var(--t-large-tracking)' }}>
          {step === 'done' ? t('auth:changePassword.successTitle') : t('auth:changePassword.title')}
        </h1>
        <p className="m-0 max-w-xl text-[15px] leading-[1.45] text-caption" role="status">
          {t(passwordChangeStatusKey(flow), { email: flow.maskedRecipient })}
        </p>

        {mustChangePassword && step !== 'done' && (
          <div className="max-w-xl bg-ground px-4 py-3" style={{ borderRadius: 'var(--corner-button)' }} role="note">
            <p className="m-0 text-[15px] font-semibold text-ink">{t('auth:changePassword.forcedTitle')}</p>
            <p className="m-0 mt-1 text-[15px] leading-[1.45] text-caption">{t('auth:changePassword.forcedBody')}</p>
          </div>
        )}

        {step === 'done' ? (
          <div>
            <Button asChild>
              <Link to={homePath}>{t('common:actions.continue')}</Link>
            </Button>
          </div>
        ) : (
          <PasswordChangeFields
            flow={flow}
            secondary={
              !mustChangePassword && (
                <Button asChild variant="plain">
                  <Link to={homePath}>{t('common:actions.back')}</Link>
                </Button>
              )
            }
          />
        )}
      </section>
    </DashboardLayout>
  )
}
