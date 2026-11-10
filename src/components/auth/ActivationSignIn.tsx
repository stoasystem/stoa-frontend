/*
 * What an activation page offers once the invitation is claimed, and what it
 * says before, when the browser is already signed in (#626).
 *
 * The sign-in page goes straight into any account the browser is signed in
 * as (EntryPage), so a plain link to it from an activation page took whoever
 * had just activated an account into the account that was there before: an
 * administrator activating a student in their own browser landed back in the
 * administrator's account, and a child activating on a parent's computer would
 * land in the parent's. Here the page names both accounts and offers to sign
 * the first one out, then opens the sign-in form on the new one's address.
 * Signed in as nobody, or as the very account just activated, it is the plain
 * link it always was, with the address carried along when the page has one.
 */
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { loginEmailState } from '@/lib/loginEmailState'
import { browserSignInSnapshot, parseBrowserSignIn } from '@/lib/tabAccount'
import { useAuthStore } from '@/store/authStore'

/** The account an invitation activated, as far as the claim's answer names it. */
export type ActivatedAccount = {
  /** Its id, to tell whether the browser is signed in as this very account. */
  userId?: string
  /** Its sign-in address; the sign-in form opens on it. */
  email?: string
  /** What else names it to a reader, such as the account number. */
  label?: string
}

/**
 * Whether this tab is signed in, and the name of the account it is signed in
 * as. The account is read a moment after the page opens; until then the name
 * comes from the browser's sign-in, which carries the account it was made for.
 */
export function useSignedInAccount(): { signedIn: boolean; userId?: string; name?: string } {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  if (!isAuthenticated) return { signedIn: false }
  const browser = user ? undefined : parseBrowserSignIn(browserSignInSnapshot())?.account
  const name = user?.name?.trim() || user?.email || browser?.name?.trim() || browser?.email || undefined
  return { signedIn: true, userId: user?.id ?? browser?.id, name }
}

export function ActivationSignIn({ activated, signInLabel }: { activated: ActivatedAccount; signInLabel: string }) {
  const { t } = useTranslation(['auth'])
  const current = useSignedInAccount()
  const { signOut, isSigningOut } = useSignOut()
  const state = loginEmailState(activated.email)
  const sameAccount = Boolean(current.userId && activated.userId && current.userId === activated.userId)

  if (!current.signedIn || sameAccount) {
    return (
      <Button asChild className="rounded-full">
        <Link to="/login" state={state}>{signInLabel}</Link>
      </Button>
    )
  }

  const name = activated.email || activated.label
  const values = { current: current.name, activated: name }
  const switchKey = current.name
    ? name ? 'auth:activationHandoff.switch' : 'auth:activationHandoff.switchToNew'
    : name ? 'auth:activationHandoff.switchUnnamed' : 'auth:activationHandoff.switchUnnamedToNew'

  return (
    <div className="space-y-4" data-testid="activation-switch">
      <p className="rounded-md bg-[color:var(--accent-tint)] px-3 py-2 text-sm text-foreground">
        {t(current.name ? 'auth:activationHandoff.signedInAs' : 'auth:activationHandoff.signedInUnnamed', values)}{' '}
        {t(name ? 'auth:activationHandoff.activated' : 'auth:activationHandoff.activatedUnnamed', values)}{' '}
        {t('auth:activationHandoff.everyTab')}
      </p>
      <Button
        type="button"
        className="rounded-full"
        disabled={isSigningOut}
        onClick={() => void signOut({ loginEmail: activated.email })}
      >
        {t(switchKey, values)}
      </Button>
    </div>
  )
}

/**
 * Said before the claim on an activation link opened while signed in: the
 * link is for another account than the one this browser is on, and claiming
 * it leaves that one as it is. Nothing when signed in as nobody.
 */
export function ActivationSignedInNotice() {
  const { t } = useTranslation(['auth'])
  const current = useSignedInAccount()
  if (!current.signedIn) return null
  return (
    <p className="mt-6 rounded-md bg-[color:var(--accent-tint)] px-3 py-2 text-sm text-foreground" role="status">
      {current.name
        ? t('auth:activationHandoff.beforeClaim', { current: current.name })
        : t('auth:activationHandoff.beforeClaimUnnamed')}
    </p>
  )
}
