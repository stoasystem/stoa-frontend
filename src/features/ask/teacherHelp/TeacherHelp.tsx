import { GraduationCap, MessageSquareText, Presentation } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Pill, type PillTone } from '@/components/base'
import { ICON, ROW } from '@/components/base/sizes'
import { cn } from '@/lib/utils'
import type { HelpWithdraw } from '@/features/ask/teacherHelp/useTeacherHelp'
import {
  helpModeOf,
  isEndedHelpRequest,
  type HelpMode,
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
 *
 * A classroom request (#705) says it waits for a teacher to accept it, and
 * once one has (`in_progress`) offers the way into the classroom. A text
 * request never does: its answer comes in this conversation.
 */
export function TeacherHelpStatusCard({
  request,
  teachersOnline,
  withdraw,
  onNewConversation,
  onEnterClassroom,
}: {
  request: TeacherHelpRequest
  /** `false` while no teacher is online: said plainly, with no time (#12 point 7). */
  teachersOnline: boolean | undefined
  /** Taking the request back (`useTeacherHelp`); offered only while it is withdrawable. */
  withdraw?: HelpWithdraw & { onWithdraw: () => void }
  /** Back to the list, where a new conversation starts; offered once the request is over. */
  onNewConversation?: () => void
  /** Into this request's classroom; offered only for a classroom request a teacher has accepted. */
  onEnterClassroom?: () => void
}) {
  const { t } = useTranslation('chat')
  const status = KNOWN_STATUSES.has(request.status) ? request.status : null
  const withdrawable = withdraw?.withdrawable === true
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
  const classroom = helpModeOf(request) === 'classroom'
  const classroomReady = classroom && status === 'in_progress'
  const body =
    status === 'pending' && teachersOnline === false
      ? t('ask.help.offline')
      : classroomReady
        ? t('ask.help.classroom.ready')
        : classroom && !ended && status
          ? t('ask.help.classroom.waiting')
          : status
            ? t(`ask.help.body.${status}`)
            : t('ask.help.fallback.body')

  return (
    <section
      aria-label={t('ask.help.cardLabel')}
      aria-live="polite"
      data-help-status={request.status}
      data-help-mode={helpModeOf(request)}
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
      {classroomReady && onEnterClassroom && (
        <div className="flex flex-col items-start gap-1">
          <Button variant="tinted" size="small" onClick={onEnterClassroom} data-enter-classroom>
            <Presentation aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} />
            {t('ask.help.classroom.enter')}
          </Button>
          {/* The classroom is made for a computer or a tablet. */}
          <p className="text-[13px] leading-[1.4] text-caption sm:hidden">{t('ask.help.classroom.biggerScreen')}</p>
        </div>
      )}
      {withdraw?.errorKey && (
        <p role="alert" className="text-[13px] leading-[1.4] text-red">
          {t(withdraw.errorKey)}
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
 *
 * Where the classroom is offered (#705, `classroomHelpOffered`), pressing it
 * first asks how: a text answer here, or the online classroom. Otherwise it
 * asks for a text answer at once, as before.
 */
export function TeacherHelpAction({
  onRequest,
  classroomOffered = false,
  requesting,
  teachersOnline,
  support,
  suggested = false,
  blockedKey,
  errorKey,
}: {
  onRequest: (mode: HelpMode) => void
  /** Ask how first: a text answer or the online classroom. */
  classroomOffered?: boolean
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
  /** Why it cannot be pressed (`chat` key), in the words a refusal would have used. */
  blockedKey?: string | null
  /** Why the last request was refused (`chat` key). */
  errorKey?: string | null
}) {
  const { t } = useTranslation('chat')
  const blocked = Boolean(blockedKey)
  const noteId = useId()
  const blockedNote = blockedKey ? t(blockedKey) : null
  const [choosing, setChoosing] = useState(false)
  const chooseId = useId()
  const firstChoice = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (choosing) firstChoice.current?.focus()
  }, [choosing])
  const choose = (mode: HelpMode) => {
    setChoosing(false)
    onRequest(mode)
  }

  return (
    <div
      data-help-action
      data-help-suggested={suggested || undefined}
      data-help-blocked={blocked || undefined}
      className={cn('flex flex-col items-start gap-1', suggested && 'gap-2 self-stretch border border-[color:var(--card-border)] bg-surface')}
      style={suggested ? { padding: '10px 12px', borderRadius: ROW.groupRadius } : undefined}
    >
      {suggested && <p className="text-[14px] font-semibold leading-[1.35] text-ink">{t('ask.help.suggested')}</p>}
      {choosing ? (
        <div role="group" aria-labelledby={chooseId} data-help-mode-choice className="flex flex-col items-start gap-2">
          <p id={chooseId} className="text-[13px] font-semibold leading-[1.4] text-ink">
            {t('ask.help.mode.choose')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button ref={firstChoice} variant="tinted" size="small" onClick={() => choose('text')} data-help-mode-option="text">
              <MessageSquareText aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} />
              {t('ask.help.mode.text')}
            </Button>
            <Button variant="tinted" size="small" onClick={() => choose('classroom')} data-help-mode-option="classroom">
              <Presentation aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} />
              {t('ask.help.mode.classroom')}
            </Button>
            <Button variant="plain" size="small" onClick={() => setChoosing(false)}>
              {t('ask.help.mode.cancel')}
            </Button>
          </div>
          <p className="text-[13px] leading-[1.4] text-caption">{t('ask.help.mode.hint')}</p>
        </div>
      ) : (
        <Button
          variant={suggested ? 'tinted' : 'plain'}
          size="small"
          onClick={() => (classroomOffered ? setChoosing(true) : onRequest('text'))}
          disabled={requesting || blocked}
          aria-busy={requesting || undefined}
          aria-describedby={blockedNote ? noteId : undefined}
        >
          <GraduationCap aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} />
          {requesting ? t('ask.help.requesting') : t('ask.help.request')}
        </Button>
      )}
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
      {errorKey && (
        <p role="alert" className="text-[13px] leading-[1.4] text-red">
          {t(errorKey)}
        </p>
      )}
    </div>
  )
}
