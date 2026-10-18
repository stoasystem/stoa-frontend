import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAccountRead } from '@/hooks/auth/accountRead'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { addressContext } from '@/lib/addressForm'
import { readTabAccount } from '@/lib/tabAccount'

/**
 * What a screen shows while this tab has a session but not yet its account
 * (#250). Loading, also while the session cannot be renewed: that read keeps
 * retrying by itself. Any other failure (a 500, a 403, a malformed answer)
 * is not retried, so it is shown, with a retry and a sign-out; before #250
 * the loading line stayed up for good.
 *
 * Who the tab was is remembered (`readTabAccount`), so staff are addressed
 * formally even though their account could not be read.
 */
export function AccountLoadStatus() {
  const { t } = useTranslation('common')
  const read = useAccountRead()
  const { signOut, isSigningOut } = useSignOut()

  // A read the session could not be renewed for is retried, and stays pending.
  if (!read.isError || read.isFetching) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-ground text-sm text-caption">
        {t('status.loadingAccount')}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-4">
      <div role="alert" className="flex max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-sm text-ink">
          {t('status.loadFailedAccount', { context: addressContext(readTabAccount()?.role) })}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => void read.refetch()}>{t('actions.tryAgain')}</Button>
          <Button variant="plain" disabled={isSigningOut} onClick={() => void signOut()}>
            {t('actions.logOut')}
          </Button>
        </div>
      </div>
    </div>
  )
}
