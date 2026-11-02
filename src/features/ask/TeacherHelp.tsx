import { GraduationCap } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Pill, type PillTone } from '@/components/base'
import { ICON, ROW } from '@/components/base/sizes'
import { cn } from '@/lib/utils'
import {
  isEndedHelpRequest,
  isWithdrawableHelpRequest,
  type TeacherHelpRequest,
  type TeacherHelpStatus,
  type TeacherSupportStanding,
} from '@/types/teacherHelp'

/*
 * Motion and states, "Status pills": Pending navy tint, Assigned gold,
 * In progress green, Resolved neutral.
 */
const PILL_TONE: Record<TeacherHelpStatus, PillTone> = {
  pending: 'accent',
  waiting_no_teacher: 'accent',
  assigned: 'gold',
  in_progress: 'green',
  resolved: 'neutral',
  cancelled: 'neutral',
  withdrawn: 'neutral',
  expired: 'neutral',
}

const TILE_TONE: Record<TeacherHelpStatus, string> = {
  pending: 'bg-accent-tint text-accent',
  waiting_no_teacher: 'bg-accent-tint text-accent',
  assigned: 'bg-gold-tint text-gold',
  in_progress: 'bg-green-tint text-green',
  resolved: 'bg-fill text-pill-neutral',
  cancelled: 'bg-fill text-pill-neutral',
  withdrawn: 'bg-fill text-pill-neutral',
  expired: 'bg-fill text-pill-neutral',
}

/** The statuses with words of their own: every one the type names. */
const KNOWN_STATUSES: ReadonlySet<string> = new Set(Object.keys(PILL_TONE))

/**
 * The card pinned under the Ask header once a teacher was asked (#12 point 2):
 * pending → assigned → in progress → resolved.
 *
 * It shows the request exactly as the server last reported it and takes no
 * other input: there is no local "the teacher has joined" state, and nothing
 * here to confirm it. Components board, "Status": a white card, a 32 tile, a
 * 14/600 title over a 13 caption, and the state as a pill.
 *
 * A status this app does not know yet is still waiting as far as Ask can tell
 * (it is read again every 15 s): the card says so in general words, never
 * with a key built from the status (#397).
 *
 * While no teacher has the request the student can take it back, after saying
 * so a second time (#543). Once it is over the card points to a new
 * conversation: this one has had its request (#544).
 */
export function TeacherHelpStatusCard({
  request,
  teachersOnline,
  withdraw,
  onNewConversation,
}: {
  request: TeacherHelpRequest
  /** `false` while no teacher is online: said plainly, with no time (#12 point 7). */
  teachersOnline: boolean | undefined
  /** Taking the request back; offered only while its status allows it. */
  withdraw?: { onWithdraw: () => void; withdrawing: boolean; error?: string | null }
  /** Back to the list, where a new conversation starts; offered once the request is over. */
  onNewConversation?: () => void
}) {
  const { t } = useTranslation('chat')
  const status = KNOWN_STATUSES.has(request.status) ? request.status : null
  const withdrawable = withdraw !== undefined && isWithdrawableHelpRequest(status ?? undefined)
  const ended = isEndedHelpRequest(status ?? undefined)
  const [confirming, setConfirming] = useState(false)
  const confirmId = useId()
  // The keyboard follows the question: onto it when asked, back when kept.
  const askButton = useRef<HTMLButtonElement>(null)
  const confirmButton = useRef<HTMLButtonElement>(null)
  const moved = useRef(false)
  useEffect(() => {
    if (!moved.current) return
    ;(confirming ? confirmButton : askButton).current?.focus()
  }, [confirming])
  const ask = (next: boolean) => {
    moved.current = true
    setConfirming(next)
  }
  const name = request.teacherName?.trim() || t('ask.thread.teacherFallback')
  const title = status ? t(`ask.help.title.${status}`, { name }) : t('ask.help.fallback.title')
  const pill = status ? t(`ask.help.status.${status}`) : t('ask.help.fallback.status')
  const body =
    status === 'pending' && teachersOnline === false
      ? t('ask.help.offline')
      : status
        ? t(`ask.help.body.${status}`)
        : t('ask.help.fallback.body')

  return (
    <section
      aria-label={t('ask.help.cardLabel')}
      aria-live="polite"
      data-help-status={request.status}
      className="flex flex-col gap-2.5 border border-[color:var(--card-border)] bg-surface"
      style={{ padding: '12px 14px', borderRadius: ROW.groupRadius }}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`inline-flex shrink-0 items-center justify-center ${TILE_TONE[status ?? 'pending']}`}
          style={{ width: ROW.tile, height: ROW.tile, borderRadius: ROW.tileRadius }}
        >
          <GraduationCap size={ICON.rowLeading} strokeWidth={ICON.stroke} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <p className="text-[14px] font-semibold leading-[1.3] text-ink">{title}</p>
          <p className="text-[13px] leading-[1.4] text-caption">{body}</p>
        </div>
        <Pill tone={PILL_TONE[status ?? 'pending']}>{pill}</Pill>
      </div>
      {withdrawable &&
        (confirming ? (
          <div role="group" aria-labelledby={confirmId} data-help-withdraw-confirm className="flex flex-col items-start gap-2">
            <p id={confirmId} className="text-[13px] leading-[1.4] text-ink">
              {t('ask.help.withdraw.confirm')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                ref={confirmButton}
                variant="tinted"
                size="small"
                onClick={withdraw.onWithdraw}
                disabled={withdraw.withdrawing}
                aria-busy={withdraw.withdrawing || undefined}
              >
                {withdraw.withdrawing ? t('ask.help.withdraw.withdrawing') : t('ask.help.withdraw.yes')}
              </Button>
              <Button variant="plain" size="small" onClick={() => ask(false)} disabled={withdraw.withdrawing}>
                {t('ask.help.withdraw.keep')}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button ref={askButton} variant="plain" size="small" onClick={() => ask(true)}>
              {t('ask.help.withdraw.action')}
            </Button>
          </div>
        ))}
      {withdraw?.error && (
        <p role="alert" className="text-[13px] leading-[1.4] text-red">
          {withdraw.error}
        </p>
      )}
      {ended && onNewConversation && (
        <div>
          <Button variant="plain" size="small" onClick={onNewConversation}>
            {t('ask.help.newConversation')}
          </Button>
        </div>
      )}
    </section>
  )
}

/**
 * "Ask a teacher", under the latest answer (#12 point 2). It stays available
 * while no teacher is online, and then says so without promising a time: the
 * availability's `nextWindow` has never had a value (#12 point 7).
 *
 * Quiet, a plain button, unless the answer above it suggests a teacher (#506):
 * then it says so in a card of its own, with a tinted button, and tells how many of
 * the week's requests are left.
 */
export function TeacherHelpAction({
  onRequest,
  requesting,
  teachersOnline,
  support,
  suggested = false,
  error,
}: {
  onRequest: () => void
  requesting: boolean
  teachersOnline: boolean | undefined
  /**
   * This week's allowance (stoa-backend#144), `null` when it could not be
   * read: then the button stays and says nothing of it, and a refusal is
   * still answered in words below.
   */
  support?: TeacherSupportStanding | null
  /** The answer above suggests a teacher (`structured.suggestTeacher`). */
  suggested?: boolean
  error?: string | null
}) {
  const { t } = useTranslation('chat')
  const blocked = support?.canRequest === false
  const noteId = useId()
  // Why it cannot be pressed, in the words a refusal would have used.
  const blockedNote = !blocked
    ? null
    : support.blockedReason === 'teacher_support_not_included'
      ? t('teacher.errors.planDenied')
      : t('teacher.errors.allowanceExhausted')

  return (
    <div
      data-help-action
      data-help-suggested={suggested || undefined}
      data-help-blocked={blocked || undefined}
      className={cn('flex flex-col items-start gap-1', suggested && 'gap-2 self-stretch border border-[color:var(--card-border)] bg-surface')}
      style={suggested ? { padding: '10px 12px', borderRadius: ROW.groupRadius } : undefined}
    >
      {suggested && <p className="text-[14px] font-semibold leading-[1.35] text-ink">{t('ask.help.suggested')}</p>}
      <Button
        variant={suggested ? 'tinted' : 'plain'}
        size="small"
        onClick={onRequest}
        disabled={requesting || blocked}
        aria-busy={requesting || undefined}
        aria-describedby={blockedNote ? noteId : undefined}
      >
        <GraduationCap aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} />
        {requesting ? t('ask.help.requesting') : t('ask.help.request')}
      </Button>
      {blockedNote ? (
        <p id={noteId} className="text-[13px] leading-[1.4] text-caption">
          {blockedNote}
        </p>
      ) : suggested && support && support.weeklyCases > 0 ? (
        <p data-help-remaining className="text-[13px] leading-[1.4] text-caption">
          {t('ask.help.remaining', { count: support.remainingCases })}
        </p>
      ) : null}
      {!blocked && teachersOnline === false && (
        <p className="text-[13px] leading-[1.4] text-caption">{t('ask.help.offline')}</p>
      )}
      {error && (
        <p role="alert" className="text-[13px] leading-[1.4] text-red">
          {error}
        </p>
      )}
    </div>
  )
}
