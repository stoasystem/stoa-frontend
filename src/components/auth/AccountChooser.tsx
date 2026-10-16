import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Avatar } from '@/components/base/Avatar'
import { Button } from '@/components/base/Button'
import { useHeldAccounts } from '@/hooks/auth/useHeldAccounts'
import { getPostLoginPath } from '@/lib/authRoutes'
import { normalizeUserRole } from '@/store/authStore'

/*
 * A new tab with several saved accounts asks which one it is before it loads
 * anything (#216, docs/adr/0002). Nothing is bound until one is chosen, so no
 * account's data is requested before then. Choosing is the same switch the
 * account menu makes, and lands on the page the tab was opened on when that
 * account may see it.
 */
export function AccountChooser({ onSignInOther }: { onSignInOther: () => void }) {
  const { t } = useTranslation(['auth', 'common'])
  const location = useLocation()
  const held = useHeldAccounts()

  // An expired account drops out of the list; with none left there is only
  // signing in.
  const none = held.sessions.length === 0
  useEffect(() => {
    if (none) onSignInOther()
  }, [none, onSignInOther])

  return (
    <div className="space-y-5">
      {held.problem !== null && (
        <p role="alert" className="m-0 text-[13px] leading-[1.35] text-[color:var(--on-sky-text)]">
          {t(held.problem === 'expired' ? 'common:accountMenu.switchExpired' : 'common:accountMenu.switchUnreachable')}
        </p>
      )}
      <ul className="m-0 list-none space-y-2 p-0" aria-label={t('auth:chooser.listLabel')}>
        {held.sessions.map((session) => (
          <li key={session.email}>
            <button
              type="button"
              disabled={held.busy}
              data-account-choice
              onClick={() =>
                void held.switchTo(
                  session,
                  getPostLoginPath({ role: normalizeUserRole(session.role) }, location),
                )
              }
              className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-[12px] border border-[color:var(--sky-glass-border)] bg-transparent px-3 py-2 text-left text-[color:var(--on-sky-text)] hover:bg-[color:var(--sky-glass-border)] disabled:cursor-default disabled:opacity-60"
            >
              <Avatar name={session.name} size={30} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold">{session.name}</span>
                <span className="truncate text-[13px] text-[color:var(--on-sky-text-caption)]">
                  {session.email} · {t(`common:roles.${session.role}`)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="onSkyPlain" fullWidth onClick={onSignInOther}>
        {t('auth:chooser.signInOther')}
      </Button>
    </div>
  )
}
