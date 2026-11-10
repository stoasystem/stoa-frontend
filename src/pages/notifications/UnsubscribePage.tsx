import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/base'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ApiError } from '@/services/api/httpClient'
import { resubscribeToEmail, unsubscribeFromEmail } from '@/services/notifications/notificationApi'
import { notificationQueryKeys } from '@/services/notifications/notificationQueryKeys'
import type { EmailSubscription, EmailSubscriptionKind } from '@/types/notification'

const KNOWN_KINDS: ReadonlySet<string> = new Set<EmailSubscriptionKind>([
  'weekly_report',
  'dispatch_reminder',
  'notification_digest',
])

type Action = 'unsubscribe' | 'resubscribe'
type Problem = 'invalid' | 'failed'

/*
 * Every refusal of the link is the one `email_unsubscribe_link_invalid`
 * (400): altered, for someone else, for another kind, signed by a key no
 * longer held, or an account deleted since. A token too long for the route is
 * the framework's 422. Neither is helped by trying again, and the page says
 * them as one, as the backend does. Anything else -- no connection, a 5xx --
 * may pass, and is said apart, with a way to try again.
 */
function problemOf(error: unknown): Problem {
  if (error instanceof ApiError && (error.code === 'email_unsubscribe_link_invalid' || error.status === 400 || error.status === 422)) {
    return 'invalid'
  }
  return 'failed'
}

/**
 * `/unsubscribe?token=…`, the link at the foot of a notification email (#621,
 * stoa-backend#363). Public: the token is the credential, and opening the
 * link is the request, so the page unsubscribes at once and offers to undo
 * it with the same token. It never needs a sign-in, and a tab signed in as
 * someone else sends no session (`isPublicAuthPath`).
 *
 * The token stays in the address: it can only switch one kind of email for
 * one person, and a reload then repeats what the link asked for.
 */
export function UnsubscribePage() {
  const { t } = useTranslation('common')
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''

  const queryClient = useQueryClient()
  const [result, setResult] = useState<EmailSubscription | null>(null)
  const [pending, setPending] = useState<Action | null>(null)
  const [problem, setProblem] = useState<Problem | null>(token ? null : 'invalid')

  const run = useCallback(
    async (action: Action) => {
      setPending(action)
      setProblem(null)
      try {
        const answer = action === 'unsubscribe' ? await unsubscribeFromEmail(token) : await resubscribeToEmail(token)
        setResult(answer)
        // A signed-in tab's settings switch reads this again, not its cached copy.
        void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.preferences() })
      } catch (error) {
        setProblem(problemOf(error))
      } finally {
        setPending(null)
      }
    },
    [queryClient, token],
  )

  // Once per page: StrictMode's second run of the effect keeps the ref.
  const started = useRef(false)
  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    void run('unsubscribe')
  }, [run, token])

  const kindKey = result && KNOWN_KINDS.has(result.kind) ? result.kind : 'other'
  // What the button does next: undo the state the page shows, or, before any
  // answer, the unsubscribe that failed.
  const next: Action = result && !result.subscribed ? 'resubscribe' : 'unsubscribe'

  return (
    <AuthLayout>
      <section
        aria-labelledby="unsubscribe-title"
        aria-busy={pending !== null}
        className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-[20px] border border-[color:var(--card-border)] bg-surface p-6"
      >
        <h1 id="unsubscribe-title" className="m-0 text-[22px] font-semibold leading-tight text-ink">
          {t('emailUnsubscribe.title')}
        </h1>

        {/* One live region, always there, so the outcome is read out: first the
          * wait, then what the link did, then what Undo did. */}
        <div role="status" className="flex flex-col gap-1" data-email-subscription={result ? (result.subscribed ? 'subscribed' : 'unsubscribed') : undefined}>
          {pending && !result && <p className="m-0 text-[15px] text-caption">{t('emailUnsubscribe.working')}</p>}
          {result && !result.subscribed && (
            <>
              <p className="m-0 text-[17px] font-semibold text-ink">{t('emailUnsubscribe.unsubscribed.title')}</p>
              <p className="m-0 text-[15px] text-ink">{t(`emailUnsubscribe.unsubscribed.kinds.${kindKey}`)}</p>
            </>
          )}
          {result?.subscribed && (
            <>
              <p className="m-0 text-[17px] font-semibold text-ink">{t('emailUnsubscribe.resubscribed.title')}</p>
              <p className="m-0 text-[15px] text-ink">{t('emailUnsubscribe.resubscribed.body')}</p>
            </>
          )}
        </div>

        {problem && (
          <p role="alert" className="m-0 text-[15px] text-red">
            {t(problem === 'invalid' ? 'emailUnsubscribe.invalid' : 'emailUnsubscribe.failed')}
          </p>
        )}

        {/* No button for a refused link: nothing it could do would help. */}
        {problem !== 'invalid' && (result || problem === 'failed') && (
          <Button
            fullWidth
            variant={result ? 'tinted' : undefined}
            disabled={pending !== null}
            onClick={() => void run(next)}
          >
            {!result ? t('emailUnsubscribe.retry') : next === 'resubscribe' ? t('emailUnsubscribe.undo') : t('emailUnsubscribe.again')}
          </Button>
        )}
      </section>
    </AuthLayout>
  )
}
