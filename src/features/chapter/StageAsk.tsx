import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Composer } from '@/components/base'
import { AskPanel } from '@/features/ask/AskPanel'
import { ASK_PANEL, ASK_SHEET, sheetHeightFor } from '@/features/ask/askLayout'
import { useAskQuoteStore, type AskPractice } from '@/features/ask/practiceContext'
import { QuoteSelection } from '@/features/chapter/QuoteSelection'
import { useAskController, type AskController } from '@/features/ask/useAskController'
import { useAskKeyboard } from '@/features/ask/useAskKeyboard'
import { useSheetDrag } from '@/features/ask/useSheetDrag'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import { useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { useCoverShell } from '@/layouts/shellCover'
import { useAskStore } from '@/store/askStore'

/**
 * Wide enough for the exercise and the 420 panel side by side (Placement:
 * "Practice stage: question column 620, left offset 360"). Narrower screens
 * get the phone's arrangement: the composer under the stage and a sheet.
 */
export const STAGE_SIDE_QUERY = '(min-width: 1024px)'

/**
 * Ask beside the stage, driven like Ask anywhere else (`useAskController`):
 * the conversation and the draft are the student's one Ask, so a conversation
 * begun beside an exercise is the same one on the map afterwards. Only whether
 * it is open belongs to the stage -- open beside the exercise on a wide
 * screen, docked under it on a phone -- and opening a conversation here does
 * not leave Ask open over the map.
 */
export function useStageAskController(side: boolean, off = false): AskController {
  const base = useAskController()
  const storeClose = useAskStore((state) => state.close)
  const [open, setOpen] = useState(side && !off)
  const [was, setWas] = useState({ side, off })
  // Widening opens the panel beside the exercise; narrowing docks it again
  // rather than turning it into a sheet over the exercise. Ask switched off
  // (a quiz) closes it; switched on again, it is as on arrival.
  if (side !== was.side || off !== was.off) {
    setWas({ side, off })
    setOpen(side && !off)
  }
  const { setDraft, select: baseSelect, open: planetOpen } = base

  const openWithDraft = useCallback(
    (value: string) => {
      setDraft(value)
      if (!off) setOpen(true)
    },
    [off, setDraft],
  )
  const select = useCallback(
    (conversationId: string | null) => {
      baseSelect(conversationId)
      if (!planetOpen) storeClose()
    },
    [baseSelect, planetOpen, storeClose],
  )
  const close = useCallback(() => setOpen(false), [])

  return useMemo(
    () => ({ ...base, entry: 'stage' as const, open: open && !off, openWithDraft, select, close }),
    [base, open, off, openWithDraft, select, close],
  )
}

/**
 * The practice stage with Ask beside it (#12 points 4 and 6, #13 point 1).
 *
 * - wide: the stage and a 420 Ask panel side by side, open from the start;
 *   closing it docks the composer under the stage, typing opens it again.
 * - narrow: the composer is docked under the stage; typing raises a 72% sheet
 *   over the dimmed, inert stage (and the bar), which keeps the keyboard in
 *   it, closes on Esc, a tap on the dim or a drag down.
 *
 * Ask knows the exercise on screen through `practice`: its three ids go out
 * with every question (#56). The panel and the sheet are light surfaces,
 * siblings of the sky. 「问这段」 watches the whole of it -- the exercise and
 * the answers in Ask alike -- and hands what was chosen to the composer.
 *
 * `off` (the short quiz, `quiz.ts`): the panel and the sheet are closed and
 * the docked composer is disabled, with `off` as the one-line reason.
 */
export function StageWithAsk({
  children,
  practice,
  subjectId,
  off,
}: {
  children: ReactNode
  practice?: AskPractice
  subjectId?: string
  /** Why Ask is off right now, if it is. */
  off?: string
}) {
  const { t } = useTranslation('chat')
  const side = useMediaQuery(STAGE_SIDE_QUERY)
  const controller = useStageAskController(side, Boolean(off))
  const { open, close } = controller
  const sheet = open && !side
  const reducedMotion = usePrefersReducedMotion()
  const surface = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const docked = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(open)
  const wasOff = useRef(off)
  const composing = useRef(false)
  useCoverShell(sheet)

  useEffect(() => {
    const opened = !wasOpen.current && open
    const closed = wasOpen.current && !open
    wasOpen.current = open
    // Switched off or on again (a quiz begun or over): the keyboard stays
    // where the stage put it.
    const switched = wasOff.current !== off
    wasOff.current = off
    if (switched) return
    // Closed: back to the composer it was opened from.
    if (closed) docked.current?.querySelector<HTMLElement>('[data-composer-field]')?.focus()
    // Opened by the student (not on arrival): into Ask's own composer, after what was typed.
    if (opened) {
      const field = surface.current?.querySelector<HTMLTextAreaElement>('[data-composer-field]')
      if (!field) return
      field.focus()
      field.setSelectionRange?.(field.value.length, field.value.length)
    }
  }, [open, off])

  const setQuote = useAskQuoteStore((state) => state.setQuote)
  const onKeyDown = useAskKeyboard(surface, { trap: sheet, active: open, onEscape: close })
  const drag = useSheetDrag(surface, close)

  const onDockedChange = useCallback(
    (value: string) => {
      if (value.trim().length > 0 && !composing.current) controller.openWithDraft(value)
      else controller.setDraft(value)
    },
    [controller],
  )

  return (
    <div ref={host} data-stage-host className="relative flex min-h-0 flex-1 overflow-hidden">
      <div
        data-surface="sky"
        data-stage-page
        inert={sheet || undefined}
        className="flex min-w-0 flex-1 flex-col bg-sky text-on-sky"
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        {!open && (
          <div ref={docked} data-ask-docked className="flex shrink-0 justify-center px-3 pt-2 pb-[34px] sm:px-6 sm:pb-[22px]">
            <div className="flex w-full max-w-[640px] flex-col gap-1.5">
              {off && (
                <p data-ask-off id="stage-ask-off" className="m-0 text-center text-[13px] text-[color:var(--on-sky-text-body)]">
                  {off}
                </p>
              )}
              <Composer
                disabled={Boolean(off)}
                describedBy={off ? 'stage-ask-off' : undefined}
                value={controller.draft}
                onChange={onDockedChange}
                onCompositionStart={() => {
                  composing.current = true
                }}
                onCompositionEnd={(value) => {
                  composing.current = false
                  if (value.trim().length > 0) controller.openWithDraft(value)
                }}
                onSubmit={(value) => controller.openWithDraft(value)}
                label={t('ask.composerLabel')}
                placeholder={t('ask.practice.placeholder')}
              />
            </div>
          </div>
        )}
      </div>

      {sheet && (
        <div
          data-ask-backdrop
          data-ask-motion="dim"
          aria-hidden="true"
          onClick={close}
          className="absolute inset-0"
          style={{ background: `rgba(0, 0, 0, ${ASK_SHEET.dim})` }}
        />
      )}

      {open &&
        (side ? (
          <aside
            ref={surface}
            aria-label={t('ask.title')}
            data-ask-surface="panel"
            data-ask-entry="stage"
            data-ask-conversation={controller.conversationId ?? ''}
            data-ask-motion="panel"
            onKeyDown={onKeyDown}
            className="relative shrink-0 border-l border-[color:var(--float-border)] bg-[color-mix(in_srgb,var(--ground)_94%,transparent)] text-ink backdrop-blur-[30px]"
            style={{ width: ASK_PANEL.width }}
          >
            <AskPanel controller={controller} layout="panel" subjectId={subjectId} practice={practice} />
          </aside>
        ) : (
          <section
            ref={surface}
            role="dialog"
            aria-modal
            aria-label={t('ask.title')}
            data-ask-surface="sheet"
            data-ask-entry="stage"
            data-ask-conversation={controller.conversationId ?? ''}
            data-ask-motion="sheet"
            onKeyDown={onKeyDown}
            className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden bg-[color-mix(in_srgb,var(--ground)_96%,transparent)] text-ink backdrop-blur-[30px]"
            style={{
              height: sheetHeightFor('stage'),
              borderRadius: `${ASK_SHEET.radius}px ${ASK_SHEET.radius}px 0 0`,
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
              transform: drag.offset ? `translateY(${drag.offset}px)` : undefined,
              transition: drag.dragging || reducedMotion ? 'none' : 'transform var(--motion-sheet) var(--ease-standard)',
            }}
          >
            <div {...drag.handle} className="flex shrink-0 touch-none justify-center pt-2">
              <span
                aria-hidden="true"
                title={t('ask.grabber')}
                className="rounded-[3px] bg-tertiary"
                style={{ width: ASK_SHEET.grabber.width, height: ASK_SHEET.grabber.height }}
              />
            </div>
            <div className="min-h-0 flex-1">
              <AskPanel
                controller={controller}
                layout="sheet"
                subjectId={subjectId}
                practice={practice}
                headerHandle={drag.handle}
              />
            </div>
          </section>
        ))}

      {/* A quoted passage opens Ask with it waiting above the composer (#56). */}
      {!off && (
        <QuoteSelection
          scope={host}
          onQuote={(quote) => {
            setQuote(quote)
            controller.openWithDraft(controller.draft)
          }}
        />
      )}
    </div>
  )
}
