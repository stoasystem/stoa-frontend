/*
 * Ask's first-time tour (#677): the first time Ask opens for a student new to
 * Ask, Murmi points at what else it can do, one control at a time, with one
 * line each -- the microphone (speak instead of type), the + (a photo or a
 * file of the problem, the camera on a phone), and, once the first answer is
 * there, "Ask a teacher" under it.
 *
 * - New to Ask is read from the server (ADR 0003, as `StageAskTip` does): no
 *   conversation before this open. One this open started -- the "Find my own
 *   star" example sent as Ask opens, a first question -- still counts as first.
 * - How far it got is kept in this tab only (`askGuide.ts`): the step it is on,
 *   or over. Skip, Escape or the last step ends it, and it does not come back
 *   in this tab.
 * - A step whose control is not there is passed over: no microphone on this
 *   device, no add menu, "Ask a teacher" greyed for this student. The teacher
 *   step waits for the control, which only exists under a finished answer.
 * - Not a modal: it takes no focus, and the composer stays usable. A step shows
 *   while the composer is empty; typing while the microphone or the + is
 *   pointed at ends those two (the teacher's step still comes with the first
 *   answer), typing while "Ask a teacher" is pointed at ends the tour, and
 *   sending a question offered on the empty list ends the composer's two too.
 * - Each step is read out once as it arrives (`role="status"`, always there).
 *   The bubble fades in; the control it points at is ringed once
 *   (`askGuide.css`); with reduced motion, only fades.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import {
  askTourProgress,
  setAskTourProgress,
  subscribeAskTour,
  type AskTourProgress,
  type AskTourStep,
} from '@/features/ask/askGuide'
import '@/features/ask/askGuide.css'

/** Where each step's control is, inside Ask's panel. */
export const ASK_TOUR_TARGETS: Record<AskTourStep, string> = {
  mic: '[data-ask-composer-area] [data-composer-mic]:not(:disabled)',
  add: '[data-ask-composer-area] [data-composer-add]:not(:disabled)',
  teacher: '[data-help-action]:not([data-help-blocked]) button',
}
const TEACHER_BLOCKED = '[data-help-action][data-help-blocked]'

/** The tour's progress in this tab, for this account, kept in step with every change. */
export function useAskTourProgress(ownerId: string | null): AskTourProgress {
  return useSyncExternalStore(
    subscribeAskTour,
    () => askTourProgress(ownerId),
    () => null,
  )
}

type Controls = { measured: boolean; mic: boolean; add: boolean; teacher: 'ready' | 'blocked' | 'none' }
const UNMEASURED: Controls = { measured: false, mic: false, add: false, teacher: 'none' }

function readControls(root: HTMLElement): Controls {
  return {
    measured: true,
    mic: root.querySelector(ASK_TOUR_TARGETS.mic) !== null,
    add: root.querySelector(ASK_TOUR_TARGETS.add) !== null,
    teacher: root.querySelector(ASK_TOUR_TARGETS.teacher)
      ? 'ready'
      : root.querySelector(TEACHER_BLOCKED)
        ? 'blocked'
        : 'none',
  }
}

/** Which of the tour's controls are in the panel now, read again as it changes. */
function useControls(root: RefObject<HTMLElement | null>, watching: boolean): Controls {
  const [controls, setControls] = useState<Controls>(UNMEASURED)
  useLayoutEffect(() => {
    const node = root.current
    if (!watching || !node) return
    const read = () =>
      setControls((before) => {
        const now = readControls(node)
        return before.measured === now.measured && before.mic === now.mic && before.add === now.add && before.teacher === now.teacher
          ? before
          : now
      })
    read()
    const observer = new MutationObserver(read)
    observer.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'data-help-blocked'] })
    return () => observer.disconnect()
  }, [root, watching])
  return controls
}

export type AskTour = {
  /** The step Murmi points at now, if any. */
  step: AskTourStep | null
  next: () => void
  skip: () => void
  /** A question went out without typing (one offered on the empty list): the composer's steps are over. */
  composerUsed: () => void
  /** A conversation this open started: it does not make the student "not new" to Ask. */
  started: (conversationId: string) => void
}

const ORDER: readonly AskTourStep[] = ['mic', 'add', 'teacher']

/**
 * Whether the tour is due, and where it is. `conversations` is the list the
 * server reads back (`undefined` until it has), `draft` the composer's text.
 */
export function useAskTour({
  root,
  ownerId,
  conversations,
  draft,
  off,
}: {
  root: RefObject<HTMLElement | null>
  ownerId: string | null
  conversations: readonly { id: string }[] | undefined
  draft: string
  /** Nothing can be asked now (the usage period has ended): no tour. */
  off: boolean
}): AskTour {
  const progress = useAskTourProgress(ownerId)

  // Begun the first time the list is read during this open, if the student had
  // no conversation before it. Before the page is painted, so the practice
  // stage's tip, which gives way to it, never shows for a frame.
  const startedHere = useRef(new Set<string>())
  const decided = useRef(false)
  useLayoutEffect(() => {
    if (decided.current || !ownerId || conversations === undefined || off) return
    decided.current = true
    if (progress !== null) return
    if (conversations.every((item) => startedHere.current.has(item.id))) setAskTourProgress(ownerId, 'mic')
  }, [conversations, off, ownerId, progress])

  const running = progress !== null && progress !== 'done' && !off && ownerId !== null
  const controls = useControls(root, running)

  // A control that is not there: its step is passed over.
  useEffect(() => {
    if (!running || !ownerId || !controls.measured) return
    if (progress === 'mic' && !controls.mic) setAskTourProgress(ownerId, 'add')
    else if (progress === 'add' && !controls.add) setAskTourProgress(ownerId, 'teacher')
    else if (progress === 'teacher' && controls.teacher === 'blocked') setAskTourProgress(ownerId, 'done')
  }, [controls, ownerId, progress, running])

  const empty = draft.trim().length === 0
  let step: AskTourStep | null = null
  if (running && empty && controls.measured) {
    if (progress === 'mic' && controls.mic) step = 'mic'
    else if (progress === 'add' && controls.add) step = 'add'
    else if (progress === 'teacher' && controls.teacher === 'ready') step = 'teacher'
  }

  // Typing while a step is shown: the composer's steps are over, or, on the
  // teacher's, the tour. Opened with something already typed, nothing was shown.
  const shown = useRef<AskTourStep | null>(null)
  useEffect(() => {
    const was = shown.current
    if (!ownerId || empty || !was) return
    setAskTourProgress(ownerId, was === 'teacher' ? 'done' : 'teacher')
  }, [draft, empty, ownerId])
  useEffect(() => {
    shown.current = step
  })

  const next = useCallback(() => {
    if (!ownerId || !progress || progress === 'done') return
    const index = ORDER.indexOf(progress)
    setAskTourProgress(ownerId, ORDER[index + 1] ?? 'done')
  }, [ownerId, progress])
  const skip = useCallback(() => {
    if (ownerId) setAskTourProgress(ownerId, 'done')
  }, [ownerId])
  const composerUsed = useCallback(() => {
    if (!ownerId) return
    const now = askTourProgress(ownerId)
    if (now === 'mic' || now === 'add') setAskTourProgress(ownerId, 'teacher')
  }, [ownerId])
  const started = useCallback((conversationId: string) => {
    startedHere.current.add(conversationId)
  }, [])

  return { step, next, skip, composerUsed, started }
}

/** What Murmi says at each step, in the page's language. */
function useLine(step: AskTourStep | null, camera: boolean): string {
  const { t } = useTranslation('chat')
  if (step === 'mic') return t('ask.tour.mic')
  if (step === 'add') return camera ? t('ask.tour.addCamera') : t('ask.tour.add')
  if (step === 'teacher') return t('ask.tour.teacher', { action: t('ask.help.request') })
  return ''
}

/**
 * What Murmi says, read out once as it arrives: a live region that is always
 * there, so the words arriving in it are announced.
 */
export function AskTourStatus({ step, camera }: { step: AskTourStep | null; camera: boolean }) {
  const line = useLine(step, camera)
  return (
    <p role="status" data-ask-tour-status className="sr-only">
      {line}
    </p>
  )
}

/** Room kept between the bubble and the control, and between it and the panel's edges. */
const GAP = 10
const EDGE = 8
/** How far the bubble's pointer reaches out of it. */
const POINTER = 6

type Place = { left: number; top: number; pointer: number; side: 'above' | 'below' }

/**
 * Where the bubble stands in the panel: over the control (under it, for "Ask a
 * teacher" with room below it), within the panel and the part of the screen
 * the phone's keyboard leaves.
 */
function placeFor(root: HTMLElement, target: HTMLElement, bubble: HTMLElement, preferBelow: boolean): Place {
  const box = root.getBoundingClientRect()
  const spot = target.getBoundingClientRect()
  const width = bubble.offsetWidth
  const height = bubble.offsetHeight
  const viewport = window.visualViewport
  const screenBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight
  const bottomLimit = Math.min(box.height, screenBottom - box.top) - EDGE
  const composer = root.querySelector('[data-ask-composer-area]')?.getBoundingClientRect()
  const belowLimit = Math.min(bottomLimit, composer ? composer.top - box.top - EDGE : bottomLimit)

  const above = spot.top - box.top - GAP - POINTER - height
  const below = spot.bottom - box.top + GAP + POINTER
  const side = preferBelow && below + height <= belowLimit ? 'below' : above >= EDGE ? 'above' : below + height <= bottomLimit ? 'below' : 'above'
  const rawTop = side === 'above' ? above : below
  const top = Math.max(EDGE, Math.min(rawTop, bottomLimit - height))
  const centre = spot.left + spot.width / 2 - box.left
  const left = Math.max(EDGE, Math.min(centre - width / 2, box.width - width - EDGE))
  const pointer = Math.max(16, Math.min(centre - left, width - 16))
  return { left, top, pointer, side }
}

/**
 * Murmi's line beside the control it points at, with "Next" and "Skip" (on the
 * last step, "Got it" alone). Stands in Ask's panel (`root`, positioned), over what
 * is there, and follows the control as the panel scrolls or changes size.
 */
export function AskTourBubble({
  root,
  step,
  camera,
  onNext,
  onSkip,
}: {
  root: RefObject<HTMLElement | null>
  step: AskTourStep
  camera: boolean
  onNext: () => void
  onSkip: () => void
}) {
  const { t } = useTranslation('chat')
  const line = useLine(step, camera)
  const lineId = useId()
  const own = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<Place | null>(null)

  useLayoutEffect(() => {
    const panel = root.current
    const bubble = own.current
    const target = panel?.querySelector<HTMLElement>(ASK_TOUR_TARGETS[step])
    if (!panel || !bubble || !target) return
    // Under an answer the control may be out of the thread's view: brought into it, without the focus.
    if (step === 'teacher') target.scrollIntoView?.({ block: 'nearest' })
    const measure = () => {
      const now = panel.querySelector<HTMLElement>(ASK_TOUR_TARGETS[step])
      if (now) setPlace(placeFor(panel, now, bubble, step === 'teacher'))
    }
    measure()
    const size = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    size?.observe(panel)
    size?.observe(bubble)
    const area = panel.querySelector('[data-ask-composer-area]')
    if (area) size?.observe(area)
    panel.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)
    return () => {
      size?.disconnect()
      panel.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('scroll', measure)
    }
  }, [root, step])

  // Escape ends the tour wherever focus is -- the bubble does not take it --
  // and only the tour: Ask's own Escape waits for the next press. Not while
  // the add menu or the way to dictate is open, which Escape puts away first.
  const skipRef = useRef(onSkip)
  useEffect(() => {
    skipRef.current = onSkip
  })
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return
      if (document.querySelector('[data-composer-menu], [data-composer-dictation]')) return
      event.preventDefault()
      event.stopPropagation()
      skipRef.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // Pressed "Next" on the last step shown for now: the button goes with the
  // bubble, so the keyboard goes back to the composer rather than the page.
  useEffect(() => {
    const bubble = own.current
    const panel = root.current
    return () => {
      if (bubble && bubble.contains(document.activeElement)) {
        panel?.querySelector<HTMLElement>('[data-ask-composer-area] [data-composer-field]')?.focus({ preventScroll: true })
      }
    }
  }, [root])

  const last = step === 'teacher'
  return (
    <div
      ref={own}
      role="group"
      aria-label={t('ask.tour.label')}
      aria-describedby={lineId}
      data-ask-tour-bubble={step}
      data-ask-tour-side={place?.side}
      data-ask-guide-in
      // Solid, as the add menu is: over the thread, what is under it must not show through.
      className="absolute z-20 flex w-[min(320px,calc(100%-16px))] flex-col gap-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--float-border)] px-3 py-2.5 text-on-sky [background:linear-gradient(var(--surface),var(--surface)),var(--ground)]"
      style={{
        left: place?.left ?? EDGE,
        top: place?.top ?? EDGE,
        // Measured before it is seen, so it never shows where it does not belong.
        visibility: place ? undefined : 'hidden',
        boxShadow: 'var(--shadow-float)',
      }}
    >
      {place && (
        <span
          aria-hidden="true"
          data-ask-tour-pointer
          className="absolute size-3 rotate-45 border-solid border-[color:var(--float-border)] [background:linear-gradient(var(--surface),var(--surface)),var(--ground)]"
          style={{
            left: place.pointer - 6,
            ...(place.side === 'above'
              ? { bottom: -POINTER - 1, borderWidth: '0 1px 1px 0' }
              : { top: -POINTER - 1, borderWidth: '1px 0 0 1px' }),
          }}
        />
      )}
      <div className="flex items-center gap-2">
        <Murmi mood="guiding" size={32} facing={place && place.pointer < 80 ? 'left' : 'right'} />
        <p id={lineId} className="m-0 min-w-0 flex-1 text-[14px] leading-5 text-[color:var(--on-sky-text)]">
          {line}
        </p>
      </div>
      <div className="flex justify-end gap-1">
        {/* On the last step "Got it" ends it already. */}
        {!last && (
          <Button variant="onSkyPlain" size="small" onClick={onSkip} data-ask-tour-skip>
            {t('ask.tour.skip')}
          </Button>
        )}
        <Button variant="onSky" size="small" onClick={onNext} data-ask-tour-next>
          {last ? t('ask.tour.done') : t('ask.tour.next')}
        </Button>
      </div>
    </div>
  )
}
