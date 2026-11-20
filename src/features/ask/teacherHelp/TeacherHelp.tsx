import { GraduationCap, Lock, MessageSquareText, Mic, MicOff, Presentation } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Pill, type PillTone } from '@/components/base'
import { ICON, ROW } from '@/components/base/sizes'
import { cn } from '@/lib/utils'
import type { HelpWithdraw } from '@/features/ask/teacherHelp/useTeacherHelp'
import { askForMicrophone, readMicPermission } from '@/features/classroom/micPermission'
import {
  helpModeOf,
  helpModeStanding,
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
 * once one has (`in_progress`) offers the way into the classroom, with a word
 * about the microphone first (`ClassroomEntry`). A text request never does:
 * its answer comes in this conversation. Asking never takes the student out
 * of the conversation.
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
      {classroomReady && onEnterClassroom && <ClassroomEntry onEnter={onEnterClassroom} />}
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
 * "Enter classroom" on the card, and the word about the microphone before it
 * (#705). The classroom is a voice call, so a student whose browser has not
 * said yes to the microphone is told first that it will ask, and asked only on
 * "Continue"; then in, whatever they answered: inside, a microphone refused
 * is said again (#696). A browser that refuses it already is shown where it
 * is turned on, and the student may go in without it, to the whiteboard and
 * the chat. Allowed before: straight in.
 */
function ClassroomEntry({ onEnter }: { onEnter: () => void }) {
  const { t } = useTranslation('chat')
  const [step, setStep] = useState<'idle' | 'checking' | 'prompt' | 'asking' | 'denied'>('idle')
  const explainId = useId()
  const firstButton = useRef<HTMLButtonElement>(null)
  const enterButton = useRef<HTMLButtonElement>(null)
  const explaining = step === 'prompt' || step === 'asking' || step === 'denied'
  const moved = useRef(false)
  useEffect(() => {
    if (!moved.current) return
    ;(explaining ? firstButton : enterButton).current?.focus()
  }, [explaining])
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => {
      live.current = false
    }
  }, [])

  const enter = async () => {
    setStep('checking')
    const permission = await readMicPermission()
    if (!live.current) return
    if (permission === 'granted') {
      onEnter()
      return
    }
    moved.current = true
    setStep(permission)
  }
  const askThenEnter = async () => {
    setStep('asking')
    await askForMicrophone()
    if (live.current) onEnter()
  }
  const putAway = () => {
    moved.current = true
    setStep('idle')
  }

  return (
    <div className="flex flex-col items-start gap-1 self-stretch">
      {explaining ? (
        <div
          role="group"
          aria-labelledby={explainId}
          data-classroom-mic={step === 'denied' ? 'denied' : 'prompt'}
          className="flex flex-col items-start gap-2 self-stretch bg-fill"
          style={{ padding: '10px 12px', borderRadius: ROW.tileRadius }}
        >
          <p id={explainId} className="flex items-start gap-2 text-[13px] font-semibold leading-[1.4] text-ink">
            {step === 'denied' ? (
              <MicOff aria-hidden="true" className="mt-px shrink-0" size={ICON.rowTrailing} strokeWidth={ICON.stroke} />
            ) : (
              <Mic aria-hidden="true" className="mt-px shrink-0" size={ICON.rowTrailing} strokeWidth={ICON.stroke} />
            )}
            {t(step === 'denied' ? 'ask.help.classroom.mic.deniedTitle' : 'ask.help.classroom.mic.title')}
          </p>
          <p className="text-[13px] leading-[1.4] text-caption">
            {t(step === 'denied' ? 'ask.help.classroom.mic.deniedBody' : 'ask.help.classroom.mic.body')}
          </p>
          <div className="flex flex-wrap gap-2">
            {step === 'denied' ? (
              <Button ref={firstButton} variant="tinted" size="small" onClick={onEnter} data-enter-without-mic>
                {t('ask.help.classroom.mic.withoutMic')}
              </Button>
            ) : (
              <Button
                ref={firstButton}
                variant="tinted"
                size="small"
                onClick={() => void askThenEnter()}
                disabled={step === 'asking'}
                aria-busy={step === 'asking' || undefined}
                data-classroom-mic-continue
              >
                {t('ask.help.classroom.mic.continue')}
              </Button>
            )}
            <Button variant="plain" size="small" onClick={putAway} disabled={step === 'asking'}>
              {t('ask.help.classroom.mic.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          ref={enterButton}
          variant="tinted"
          size="small"
          onClick={() => void enter()}
          disabled={step === 'checking'}
          aria-busy={step === 'checking' || undefined}
          data-enter-classroom
        >
          <Presentation aria-hidden="true" size={ICON.rowLeading} strokeWidth={ICON.stroke} />
          {t('ask.help.classroom.enter')}
        </Button>
      )}
      {/* The classroom is made for a computer or a tablet. */}
      <p className="text-[13px] leading-[1.4] text-caption sm:hidden">{t('ask.help.classroom.biggerScreen')}</p>
    </div>
  )
}

/** The two ways a teacher can help, in the order they are offered. */
const HELP_MODES: readonly HelpMode[] = ['text', 'classroom']

/**
 * One way as the choice offers it: whether it can be chosen, and the line
 * under it (`chat` key with its `count`), from this week's allowance
 * (stoa-backend#482). Not known (no allowance read, or an older server that
 * says nothing of the classroom), it is offered with no line and the server
 * has the last word.
 */
export function helpModeOption(
  support: TeacherSupportStanding | null | undefined,
  mode: HelpMode,
): { available: boolean; noteKey: string | null; count?: number } {
  const way = helpModeStanding(support, mode)
  if (!way) return { available: true, noteKey: null }
  if (way.canRequest !== false) {
    return way.weeklyCases > 0
      ? { available: true, noteKey: 'ask.help.mode.left', count: way.remainingCases }
      : { available: true, noteKey: null }
  }
  if (way.blockedReason === 'teacher_support_not_included') {
    return { available: false, noteKey: mode === 'classroom' ? 'ask.help.mode.classroomUpgrade' : 'ask.help.mode.notIncluded' }
  }
  return { available: false, noteKey: 'ask.help.mode.usedUp' }
}

/**
 * The week's allowance under a suggesting card, each way on its own (#705):
 * "This week: Text answer 2 left · Online classroom 1 left"; a way the plan
 * does not have says it comes with an upgrade. A server that says nothing of
 * the classroom keeps the one count it had.
 */
function remainingLine(
  t: (key: string, options?: Record<string, unknown>) => string,
  support: TeacherSupportStanding,
): string | null {
  const ways = HELP_MODES.map((mode) => ({ mode, way: helpModeStanding(support, mode) }))
  if (!ways.some(({ way }) => way && way.weeklyCases > 0)) return null
  if (!support.classroom) return t('ask.help.remaining', { count: support.remainingCases })
  const parts = ways.map(({ mode, way }) => {
    const name = t(`ask.help.mode.${mode}`)
    return way?.blockedReason === 'teacher_support_not_included'
      ? t('ask.help.remainingByMode.upgrade', { mode: name })
      : t('ask.help.remainingByMode.left', { mode: name, count: way?.remainingCases ?? 0 })
  })
  return t('ask.help.remainingByMode.line', { list: parts.join(' · ') })
}

const MODE_ICON = { text: MessageSquareText, classroom: Presentation } as const

/**
 * "Ask a teacher", under the latest answer (#12 point 2). It stays available
 * while no teacher is online, and then says so without promising a time: the
 * availability's `nextWindow` has never had a value (#12 point 7).
 *
 * Quiet, a plain button, unless the answer above it suggests a teacher (#506):
 * then it says so in a card of its own, with a tinted button, and tells how
 * many of the week's requests are left, each way on its own.
 *
 * Pressing it first asks how (#705): a text answer here, or the online
 * classroom. A way this week's allowance does not allow is shown, greyed,
 * with why: the classroom outside the online classroom plan says it comes
 * with that plan, a way used up says so. It stays reachable by keyboard
 * (`aria-disabled`), so the reason is read out with it. The button itself is
 * greyed only when neither way can be asked (`blockedKey`).
 */
export function TeacherHelpAction({
  onRequest,
  requesting,
  teachersOnline,
  support,
  suggested = false,
  blockedKey,
  errorKey,
}: {
  onRequest: (mode: HelpMode) => void
  requesting: boolean
  teachersOnline: boolean | undefined
  /**
   * This week's allowance (stoa-backend#144, #482), `null` when it could not
   * be read: then the button stays and says nothing of it, both ways are
   * offered, and a refusal is still answered in words below.
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
  const optionId = useId()
  const firstChoice = useRef<HTMLButtonElement>(null)
  const askButton = useRef<HTMLButtonElement>(null)
  const moved = useRef(false)
  // The keyboard follows the question: onto the first way that can be chosen,
  // back to the button when it is put away.
  useEffect(() => {
    if (!moved.current) return
    ;(choosing ? firstChoice : askButton).current?.focus()
  }, [choosing])
  const open = (next: boolean) => {
    moved.current = true
    setChoosing(next)
  }
  const options = HELP_MODES.map((mode) => ({ mode, ...helpModeOption(support, mode) }))
  const firstAvailable = options.find((option) => option.available)?.mode
  const choose = (mode: HelpMode) => {
    moved.current = false
    setChoosing(false)
    onRequest(mode)
  }
  const remaining = !blockedNote && suggested && support ? remainingLine(t, support) : null

  return (
    <div
      data-help-action
      data-help-suggested={suggested || undefined}
      data-help-blocked={blocked || undefined}
      className={cn(
        'flex flex-col items-start gap-1',
        suggested && 'gap-2 self-stretch border border-[color:var(--card-border)] bg-surface',
        choosing && 'self-stretch',
      )}
      style={suggested ? { padding: '10px 12px', borderRadius: ROW.groupRadius } : undefined}
    >
      {suggested && <p className="text-[14px] font-semibold leading-[1.35] text-ink">{t('ask.help.suggested')}</p>}
      {choosing ? (
        <div role="group" aria-labelledby={chooseId} data-help-mode-choice className="flex flex-col items-stretch gap-2 self-stretch">
          <p id={chooseId} className="text-[13px] font-semibold leading-[1.4] text-ink">
            {t('ask.help.mode.choose')}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {options.map(({ mode, available, noteKey, count }) => {
              const Icon = available ? MODE_ICON[mode] : Lock
              const descriptionId = `${optionId}-${mode}`
              return (
                <button
                  key={mode}
                  ref={mode === firstAvailable ? firstChoice : undefined}
                  type="button"
                  data-help-mode-option={mode}
                  data-help-mode-locked={available ? undefined : true}
                  aria-disabled={available ? undefined : true}
                  aria-labelledby={`${descriptionId}-label`}
                  aria-describedby={descriptionId}
                  onClick={() => {
                    if (available) choose(mode)
                  }}
                  className={cn(
                    'flex min-h-[44px] items-start gap-2.5 border border-[color:var(--card-border)] text-left transition-colors',
                    available ? 'bg-surface hover:bg-fill' : 'cursor-not-allowed bg-fill',
                  )}
                  style={{ padding: '10px 12px', borderRadius: ROW.tileRadius }}
                >
                  <span aria-hidden="true" className={cn('mt-px shrink-0', available ? 'text-accent' : 'text-caption')}>
                    <Icon size={ICON.rowLeading} strokeWidth={ICON.stroke} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-px">
                    <span
                      id={`${descriptionId}-label`}
                      className={cn('text-[14px] font-semibold leading-[1.3]', available ? 'text-ink' : 'text-caption')}
                    >
                      {t(`ask.help.mode.${mode}`)}
                    </span>
                    <span id={descriptionId} className="flex flex-col gap-px text-[13px] leading-[1.4] text-caption">
                      <span>{t(`ask.help.mode.about.${mode}`)}</span>
                      {noteKey && (
                        <span data-help-mode-note className={available ? undefined : 'font-semibold text-ink'}>
                          {t(noteKey, { count })}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <div>
            <Button variant="plain" size="small" onClick={() => open(false)}>
              {t('ask.help.mode.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          ref={askButton}
          variant={suggested ? 'tinted' : 'plain'}
          size="small"
          onClick={() => open(true)}
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
      ) : remaining ? (
        <p data-help-remaining className="text-[13px] leading-[1.4] text-caption">
          {remaining}
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
