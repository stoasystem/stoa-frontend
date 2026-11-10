import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ApiError } from '@/services/api/httpClient'
import { resubscribeToEmail, unsubscribeFromEmail } from '@/services/notifications/notificationApi'
import type { EmailKind, EmailSubscription } from '@/types/notification'

/*
 * The page the unsubscribe link in a notification email opens (#621,
 * stoa-backend#363): `/unsubscribe?token=…`. Public: the signed token names
 * one person and one kind of email, and is the only credential, so whoever
 * opens it need not be signed in, and nothing here says whose it is.
 *
 * Opening it unsubscribes at once, as the email promised, and says which
 * kind of email stopped; one button undoes it, and then redoes it.
 *
 * Every link the backend will not act on (broken, altered, a key since
 * retired, an account since deleted, no token at all) reads the same one
 * sentence: the page never says why, as the backend never does. A backend
 * that cannot be reached is not a bad link, and says so, with a retry.
 */

const KINDS: ReadonlySet<string> = new Set<EmailKind>(['weekly_report', 'dispatch_reminder', 'notification_digest'])

/** The kind the page has sentences for; a kind added to the backend later reads as "these emails". */
function kindKey(kind: string): EmailKind | 'other' {
  return KINDS.has(kind) ? (kind as EmailKind) : 'other'
}

/**
 * The link itself refused. 422 is FastAPI's own refusal of a token the
 * query will not take (over 2048 characters), the same bad link.
 */
function isInvalidLink(error: unknown) {
  return error instanceof ApiError && (error.code === 'email_unsubscribe_link_invalid' || error.status === 422)
}

export function UnsubscribePage() {
  const { t } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const token = (searchParams.get('token') || '').trim()
  // What the backend last said; kept while an undo is in flight or fails.
  const [subscription, setSubscription] = useState<EmailSubscription | null>(null)
  // The last call's refusal, boxed: a thrown value is not a state updater.
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)
  // Busy from the start when there is a link to follow: the first call is on its way.
  const [busy, setBusy] = useState(Boolean(token))
  const started = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)

  /*
   * Plain state, not a query mutation: in development React mounts the page
   * twice, and the first call, made on the first mount, then never reported
   * back to the mutation's state on the second; the page said "One moment"
   * for good. Here the answer lands in the page's own state either way.
   */
  function change(subscribe: boolean) {
    setBusy(true)
    setFailure(null)
    const call = subscribe ? resubscribeToEmail(token) : unsubscribeFromEmail(token)
    call
      .then(setSubscription, (error: unknown) => setFailure({ error }))
      .finally(() => setBusy(false))
  }

  // Once per visit. Both calls are idempotent, so a second one would do no
  // harm, but there is nothing for it to do.
  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    unsubscribeFromEmail(token)
      .then(setSubscription, (error: unknown) => setFailure({ error }))
      .finally(() => setBusy(false))
  }, [token])

  const invalid = !token || isInvalidLink(failure?.error)
  const state = invalid
    ? 'invalid'
    : subscription
      ? subscription.subscribed
        ? 'resubscribed'
        : 'unsubscribed'
      : failure
        ? 'unreachable'
        : 'working'

  // The sentence that changed is the heading; focus follows it, so the
  // button just pressed (and gone, or renamed) does not leave focus on the
  // page (WCAG 2.4.3, as on the activation page, #409).
  useEffect(() => {
    if (state !== 'working') heading.current?.focus()
  }, [state, subscription?.subscribed])

  const kind = kindKey(subscription?.kind ?? '')

  return (
    <AuthLayout>
      <section className="brand-rule mx-auto max-w-xl rounded-lg border border-border/70 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)] sm:p-8">
        <p className="brand-section-kicker">{t('unsubscribe.eyebrow')}</p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="editorial-heading mt-4 break-words text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
        >
          {t(`unsubscribe.heading.${state}`)}
        </h1>

        <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground" role="status">
          {state === 'working' && <p>{t('unsubscribe.working')}</p>}
          {state === 'invalid' && <p>{t('unsubscribe.invalid')}</p>}
          {state === 'unreachable' && <p>{t('unsubscribe.unreachable')}</p>}
          {state === 'unsubscribed' && <p>{t(`unsubscribe.stopped.${kind}`)}</p>}
          {state === 'unsubscribed' && kind === 'weekly_report' && <p>{t('unsubscribe.weeklyReportStillInApp')}</p>}
          {state === 'resubscribed' && <p>{t(`unsubscribe.restored.${kind}`)}</p>}
        </div>

        {failure && subscription && !invalid && (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {t('unsubscribe.changeFailed')}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {state === 'unsubscribed' && (
            <Button type="button" className="rounded-full" disabled={busy} onClick={() => change(true)}>
              {t('unsubscribe.undo')}
            </Button>
          )}
          {state === 'resubscribed' && (
            <Button type="button" variant="outline" className="rounded-full" disabled={busy} onClick={() => change(false)}>
              {t('unsubscribe.unsubscribeAgain')}
            </Button>
          )}
          {state === 'unreachable' && (
            <Button type="button" className="rounded-full" disabled={busy} onClick={() => change(false)}>
              {t('unsubscribe.retry')}
            </Button>
          )}
          <Button asChild variant={state === 'invalid' ? 'default' : 'plain'} className="rounded-full">
            <Link to="/">{t('unsubscribe.openStoa')}</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs leading-5 text-muted-foreground">{t('unsubscribe.settingsHint')}</p>
      </section>
    </AuthLayout>
  )
}
