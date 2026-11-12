import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Composer } from '@/components/base'
import { Murmi } from '@/components/brand/Murmi'
import { COMPOSER } from '@/components/base/sizes'
import { UsagePeriodPausedNotice } from '@/components/usagePeriod/UsagePeriodRenewal'
import { AskPanel } from '@/features/ask/AskPanel'
import { AskRecent, recentFieldKeys } from '@/features/ask/AskRecent'
import { AskReopen } from '@/features/ask/AskReopen'
import { useClearOfControls } from '@/features/ask/clearOfControls'
import { AskMakeWayContext } from '@/features/ask/askMakeWay'
import {
  ASK_FULL_SCREEN,
  ASK_PANEL,
  ASK_REOPEN,
  ASK_RISE,
  ASK_SHEET,
  ASK_SURFACE_BACKGROUND,
  DOCKED_COMPOSER,
  sheetHeightFor,
} from '@/features/ask/askLayout'
import { useAskController, type AskRoute } from '@/features/ask/useAskController'
import { useAskFullScreen } from '@/features/ask/useAskFullScreen'
import { useAskKeyboard } from '@/features/ask/useAskKeyboard'
import { useAskUsagePeriod } from '@/features/ask/useAskUsagePeriod'
import { useSheetDrag } from '@/features/ask/useSheetDrag'
import { WIDE_QUERY, useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { useCoverShell } from '@/layouts/shellCover'
import { ChooserInputs } from '@/features/uploads/Attachments'
import { useOfferedSources } from '@/features/uploads/useAttachments'
import { askFor, useAskStore, type AddedFromDock } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'
import '@/features/ask/askGuide.css'

/**
 * The planet with Ask on it (#12 points 1 and 6; #13 point 1).
 *
 * `children` is the planet (or its placeholder), drawn on the sky. Below it
 * sits the docked composer; typing in it opens Ask:
 *
 * - desktop: the conversation rises from the composer (#660), as wide as it
 *   and centred, up to near the top of the page (`ASK_RISE`); the planet
 *   behind it dims and is inert; tap the dim or press Esc to close it, and
 *   the focus is back in the docked composer.
 * - phone: a sheet rises to 72%; the planet behind it dims and is inert; drag
 *   the sheet down, tap the dim or press Esc to close it.
 *
 * On a desktop, a star followed from Ask (`AskMakeWayContext`) moves Ask into
 * a 420 panel on the right instead (#660): the map flies to the star in what
 * is left beside it, and the conversation goes on there -- asking on keeps it
 * there. Its expand button raises it over the map again; closing Ask ends it,
 * so the next question from the dock rises again.
 *
 * With `route` (the pages `/ask` and `/ask/:id`) Ask is open from the start:
 * risen over the planet on a desktop, a full-screen sheet on a phone, and
 * closing it goes to `/`.
 *
 * Risen, and as the sheet from the planet, Ask's header has a full-screen
 * button (#676, `useAskFullScreen`): wide, Ask fills the whole window, the
 * top bar too, and what is read keeps to a centred column
 * (`ASK_FULL_SCREEN.column`); on a phone the sheet goes to 100%, as at `/ask`, and dragged
 * down from there goes back to 72% before a second drag closes it. Pressed
 * again it goes back. Esc still closes Ask, and closing it ends full screen,
 * so the next open rises at the normal size. Beside the map there is none
 * (its expand button raises it), nor on the phone at `/ask`, already full.
 *
 * The panel and the sheet are dark surfaces of their own (#125): each carries
 * `data-surface="sky"` and `data-ask-surface`, which brand-tokens.css turns
 * into the sky's colours, so they hold inside them and Ask no longer reads as a white card from another product.
 *
 * Closed, the docked composer is the one way back in. A press on its field
 * offers the three latest conversations and the way to all of them
 * (`AskRecent`). Its + opens the same add menu as Ask's own composer, right
 * there on the dock: a photo or a file, the camera on a phone or tablet, the
 * phone's code on a computer. Ask opens only once something is chosen, with
 * the picture in its composer waiting for the question; the + itself opens
 * nothing more, so a student who meant to add a picture is not taken into a
 * conversation first. `AskReopen` stood at the end of its row (#125,
 * #645) and went: the button and the composer were two ways into the same
 * thread (typing opened the last conversation, and so did the button). It
 * stays only while the usage period is paused (#615), when the field is shut
 * and the button is the one way to read the old conversations.
 *
 * After "Find my own star" on the first landing (#586) the docked composer
 * takes the focus, is highlighted once, and says what it is for: Murmi
 * (`guiding`, a paw pointing down at it, the other at the chin) beside a line
 * over it ("Tell me here what you want to practise"), a sentence that it takes any
 * other question about their learning too, and its placeholder asks what they
 * want to practise. Under that sentence come two or three things the
 * student could say: one tap sends it, in a conversation of its own, and the
 * answer finds the star as any other does (#489). They are offered for that
 * moment only: opening Ask, Escape, or leaving the map ends it. They stand
 * over the composer without taking the page's own controls from under it:
 * narrowed to the room between the map's "?" and zoom pair, wrapping, and
 * only the examples themselves take a tap (#598).
 */
export function AskHost({
  children,
  route,
  subjectId,
}: {
  children?: ReactNode
  route?: AskRoute
  /** The planet's subject, for a conversation started from it. */
  subjectId?: string
}) {
  const { t } = useTranslation('chat')
  const wide = useMediaQuery(WIDE_QUERY)
  const controller = useAskController(route)
  const { open, entry, close } = controller
  const surface = useRef<HTMLElement>(null)
  const docked = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(open)
  const layout = wide ? 'panel' : 'sheet'
  const sheet = open && !wide
  // Wide, Ask rises over the map unless a star followed from it put it beside (#660).
  const beside = open && wide && controller.beside
  const rise = open && wide && !beside
  const reopenRoom = ASK_REOPEN.size + ASK_REOPEN.gap
  // From the planet the phone sheet is a modal over it: the planet and the bar
  // are dimmed and inert, and the keyboard stays in the sheet. Opened at /ask
  // the full-screen sheet is the page itself, so the bar stays usable. Risen
  // over the map on a desktop, Ask is a modal however it was opened (#660).
  const modal = (sheet && entry === 'planet') || rise
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const composing = useRef(false)
  useCoverShell(modal)

  // "Find my own star" (#586): the examples, while Ask is closed.
  const ownerId = useAuthStore((state) => state.user?.id ?? null)
  const examples = useAskStore((state) => askFor(state, ownerId).examples)
  const askNow = useAskStore((state) => state.askNow)
  const endExamples = useAskStore((state) => state.endExamples)
  // The usage period has ended (#615): the docked composer is greyed and says
  // why; Ask still opens on its conversations, from the reopen button, which
  // is drawn only then.
  const usagePeriod = useAskUsagePeriod()
  const paused = usagePeriod.paused
  const pausedNoticeId = useId()
  const offering = !open && !paused && examples !== null && examples.length > 0
  const examplesLabel = useId()
  const page = useRef<HTMLDivElement>(null)
  const examplesArea = useRef<HTMLDivElement>(null)
  useClearOfControls(examplesArea, page, offering)
  useEffect(() => {
    if (open) endExamples()
  }, [open, endExamples])
  useEffect(() => () => useAskStore.getState().endExamples(), [])
  useEffect(() => {
    if (offering) docked.current?.querySelector<HTMLElement>('[data-composer-field]')?.focus({ preventScroll: true })
  }, [offering])
  const onDockedKeyDown = (event: KeyboardEvent) => {
    if (offering && event.key === 'Escape') endExamples()
  }

  // Closed again: the focus goes back to where Ask was opened from -- unless
  // closing it sent the student somewhere that took the focus itself (a star's
  // card, from a card in Ask, #487).
  useEffect(() => {
    const lost = !document.activeElement || document.activeElement === document.body
    if (wasOpen.current && !open && lost) docked.current?.querySelector<HTMLElement>('[data-composer-field]')?.focus()
    wasOpen.current = open
  }, [open])

  // Opened: the cursor is in Ask's own composer, after what was typed -- and
  // after a picture chosen from the docked +, where the question comes next.
  // Raised again from beside the map (#660), the same: the expand button is
  // gone. Moved beside the map, it is the star's card that takes the focus.
  useEffect(() => {
    if (!open || beside) return
    const field = surface.current?.querySelector<HTMLTextAreaElement>('[data-composer-field]')
    if (!field || surface.current?.contains(document.activeElement)) return
    field.focus()
    const end = field.value.length
    field.setSelectionRange?.(end, end)
  }, [open, layout, beside])

  // Full screen (#676): risen, or the sheet from the planet; ended by closing
  // Ask, and by a move beside the map, so it comes back at the normal size.
  const fullScreenOffered = rise || (sheet && entry === 'planet')
  const fullScreenState = useAskFullScreen({ surface, reset: !open || beside, wide, reducedMotion })
  const fullScreen = fullScreenOffered && fullScreenState.full
  const fullScreenToggle = fullScreenOffered
    ? { on: fullScreen, onToggle: fullScreenState.toggle }
    : undefined

  const onKeyDown = useAskKeyboard(surface, { trap: modal, active: open, onEscape: close })
  // Dragged down from full screen, the sheet goes back to 72% first.
  const drag = useSheetDrag(surface, fullScreen ? fullScreenState.leave : close)
  // A press on the docked field: the latest conversations, and the way to all
  // of them (`AskRecent`). Not on focus alone: the examples (#586) put the
  // cursor there by script, and Tab passes through.
  const [recentOpen, setRecentOpen] = useState(false)
  const recentId = useId()
  const dockedField = useCallback(() => docked.current?.querySelector<HTMLElement>('[data-composer-field]') ?? null, [])
  const { select } = controller
  const openRecent = useCallback(
    (conversationId: string | null) => {
      setRecentOpen(false)
      select(conversationId)
    },
    [select],
  )
  const closeRecent = useCallback(
    (refocus: boolean) => {
      setRecentOpen(false)
      if (refocus) dockedField()?.focus()
    },
    [dockedField],
  )
  // Gone with Ask open, or with the period paused (the field is shut then).
  const recentShown = recentOpen && !open && !paused

  // An input method (Chinese, Japanese, a dead key for an accent) is still
  // composing while its first characters arrive; opening Ask then would move
  // the field from under it. Ask opens once the composition ends.
  const onDockedChange = useCallback(
    (value: string) => {
      setRecentOpen(false)
      if (value.trim().length > 0 && !composing.current) controller.openWithDraft(value)
      else controller.setDraft(value)
    },
    [controller],
  )
  // The docked +: its menu opens right on the dock, the same as Ask's own
  // composer offers, and Ask opens only once something is chosen. The chooser
  // and the camera open from the menu press itself (a browser opens them only
  // from a press of the student's own); the files picked are handed to Ask's
  // composer (`addFromDock`), whose one pipeline checks, uploads and shows
  // them. A chooser put away with nothing picked opens nothing. The phone's
  // code has no file to wait for: Ask opens and starts it there.
  const addFromDock = useAskStore((state) => state.addFromDock)
  const { reopen } = controller
  const dockPicker = useRef<HTMLInputElement>(null)
  const dockCamera = useRef<HTMLInputElement>(null)
  const offered = useOfferedSources({ camera: true, phone: true })
  const handOver = useCallback(
    (added: AddedFromDock) => {
      if (!ownerId) return
      setRecentOpen(false)
      addFromDock(ownerId, added)
      reopen()
    },
    [ownerId, addFromDock, reopen],
  )
  const dockChosen = useCallback((files: File[]) => handOver({ kind: 'files', files }), [handOver])
  // A star followed from Ask (#660): on a desktop, Ask moves beside the map.
  const { moveBeside, expand } = controller
  const makeWay = wide ? moveBeside : null
  const onDockedCompositionEnd = useCallback(
    (value: string) => {
      composing.current = false
      if (value.trim().length > 0) controller.openWithDraft(value)
    },
    [controller],
  )

  return (
    <AskMakeWayContext.Provider value={makeWay}>
      <div data-ask-host className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={page}
          data-surface="sky"
          data-ask-page
          inert={sheet || rise || undefined}
          // Its own stacking context: what the page lifts over itself (the
          // map's galaxy switch) stays under the dim and Ask risen over it (#660).
          className="absolute inset-y-0 left-0 isolate bg-sky text-on-sky"
          // Reserve the dock's space for the page's own controls, including while
          // Ask is open, so closing it never covers a control. Only the panel
          // beside the map narrows it (#660); risen, Ask stands over it.
          style={{
            right: beside ? ASK_PANEL.width : 0,
            '--page-bottom-inset': `${(wide ? DOCKED_COMPOSER.desktop.bottom : DOCKED_COMPOSER.phone.bottom) + COMPOSER.docked.height}px`,
          } as CSSProperties}
        >
          {children}
          {!open && (
            <div
              ref={docked}
              data-ask-docked
              // The composer, centred and 640 at most (wide) or the full row (phone).
              // Only while the period is paused does Ask's way back stand at the end
              // of its row; wide, the row then keeps the button's room on both sides
              // so the composer stays centred.
              className={wide ? 'absolute grid items-center' : 'absolute flex items-center'}
              style={
                wide
                  ? {
                      left: 24,
                      right: 24,
                      bottom: DOCKED_COMPOSER.desktop.bottom,
                      gridTemplateColumns: paused
                        ? `minmax(${reopenRoom}px, 1fr) minmax(0, ${DOCKED_COMPOSER.desktop.width}px) minmax(${reopenRoom}px, 1fr)`
                        : `1fr minmax(0, ${DOCKED_COMPOSER.desktop.width}px) 1fr`,
                    }
                  : {
                      left: DOCKED_COMPOSER.phone.inset,
                      right: DOCKED_COMPOSER.phone.inset,
                      bottom: DOCKED_COMPOSER.phone.bottom,
                      gap: paused ? ASK_REOPEN.gap : undefined,
                    }
              }
            >
              <div
                className={wide ? 'relative col-start-2 min-w-0' : 'relative min-w-0 flex-1'}
                data-ask-guide={offering || undefined}
                onKeyDown={onDockedKeyDown}
              >
                {offering && (
                  // Out of the flow, so the dock's box stays the composer's; the
                  // band itself lets taps through to the map, its examples take them.
                  <div
                    ref={examplesArea}
                    data-ask-examples
                    data-ask-guide-in
                    className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex flex-col items-center gap-1.5"
                  >
                    {/*
                      Murmi beside what the box is for, its paw down at the composer; then the examples.
                      On the sky's glass (as Murmi's bubbles are), so the constellation lines do not
                      run through the words; the pointing paw hangs over the glass's edge.
                    */}
                    <div
                      data-ask-guide-card
                      className="flex max-w-full items-end gap-2 rounded-[var(--corner-card)] border border-solid border-[color:var(--sky-glass-border)] py-2 pl-1 pr-3"
                      style={{ background: 'var(--sky-glass)', backdropFilter: 'blur(var(--sky-glass-blur))', WebkitBackdropFilter: 'blur(var(--sky-glass-blur))' }}
                    >
                      <Murmi mood="guiding" size={wide ? 64 : 48} entrance className="-mb-3" />
                      {/* Said aloud as it appears. */}
                      <div role="status" className="flex min-w-0 flex-col gap-0.5 text-left">
                        <p data-ask-guide-title className="m-0 text-[15px] font-semibold leading-snug text-[color:var(--on-sky-text)]">
                          {t('ask.examples.title')}
                        </p>
                        <p id={examplesLabel} className="m-0 text-[13px] leading-snug text-[color:var(--on-sky-text-body)]">
                          {t('ask.examples.body')}
                        </p>
                      </div>
                    </div>
                    <ul aria-labelledby={examplesLabel} className="m-0 flex max-w-full list-none flex-wrap justify-center gap-2 p-0">
                      {examples.map((example) => (
                        <li key={example} className="pointer-events-auto max-w-full">
                          <Button
                            variant="onSky"
                            size="small"
                            // Narrowed between the map's controls, an example wraps rather than lose its end.
                            className="max-w-full whitespace-normal text-center leading-snug"
                            style={{ height: 'auto', minHeight: 32, paddingBlock: 7 }}
                            onClick={() => ownerId && askNow(ownerId, example)}
                          >
                            <span className="min-w-0">{example}</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recentShown && (
                  <AskRecent id={recentId} field={dockedField} onSelect={openRecent} onClose={closeRecent} />
                )}
                {paused && usagePeriod.entitlement && (
                  // Out of the flow, as the examples are, so the dock's box stays the composer's.
                  <UsagePeriodPausedNotice
                    id={pausedNoticeId}
                    entitlement={usagePeriod.entitlement}
                    className="absolute inset-x-0 bottom-full m-0 mb-2 text-center text-[13px] text-[color:var(--on-sky-text-body)] [&_a]:text-[color:var(--on-sky-plain)]"
                  />
                )}
                <Composer
                  disabled={paused}
                  describedBy={paused ? pausedNoticeId : undefined}
                  value={controller.draft}
                  onChange={onDockedChange}
                  onCompositionStart={() => {
                    composing.current = true
                  }}
                  onCompositionEnd={onDockedCompositionEnd}
                  onSubmit={(value) => controller.openWithDraft(value)}
                  onFieldClick={() => {
                    if (!offering) setRecentOpen(true)
                  }}
                  onFieldKeyDown={(event) => {
                    if (recentShown) recentFieldKeys(event, recentId, () => setRecentOpen(false))
                  }}
                  fieldPopup={{ id: recentId, expanded: recentShown }}
                  onAttach={() => dockPicker.current?.click()}
                  onCapture={offered.camera ? () => dockCamera.current?.click() : undefined}
                  onPhone={offered.phone ? () => handOver({ kind: 'phone' }) : undefined}
                  dictation
                  label={t('ask.composerLabel')}
                  placeholder={
                    offering
                      ? wide
                        ? t('ask.examples.placeholder')
                        : t('ask.examples.placeholderPhone')
                      : wide
                        ? t('ask.dockedPlaceholder')
                        : t('ask.dockedPlaceholderPhone')
                  }
                />
                <ChooserInputs
                  picker={dockPicker}
                  cameraInput={offered.camera ? dockCamera : undefined}
                  onChosen={dockChosen}
                />
              </div>
              {paused && (
                <div className="flex" style={wide ? { paddingLeft: ASK_REOPEN.gap } : undefined}>
                  <AskReopen onOpen={controller.reopen} resuming={controller.conversationId !== null} />
                </div>
              )}
            </div>
          )}
        </div>

        {modal && (
          <div
            data-ask-backdrop
            data-ask-motion="dim"
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0"
            style={{ background: `rgba(0, 0, 0, ${rise ? ASK_RISE.dim : ASK_SHEET.dim})` }}
          />
        )}

        {open &&
          (wide ? (
            // One element whether risen or beside the map (#660), so moving
            // between them keeps the conversation as it is: what is being
            // typed, a picture still going up, where it was scrolled to.
            <section
              ref={surface}
              role={rise ? 'dialog' : 'complementary'}
              aria-modal={rise || undefined}
              aria-label={t('ask.title')}
              data-ask-surface={rise ? 'rise' : 'panel'}
              data-ask-entry={entry}
              data-ask-conversation={controller.conversationId ?? ''}
              data-ask-motion={rise ? 'rise' : 'panel'}
              data-ask-full-screen={fullScreen || undefined}
              onKeyDown={onKeyDown}
              data-surface="sky"
              className={
                fullScreen
                  ? 'fixed overflow-hidden text-ink backdrop-blur-[var(--sky-glass-blur)]'
                  : rise
                    ? 'absolute overflow-hidden border border-[color:var(--float-border)] text-ink backdrop-blur-[var(--sky-glass-blur)]'
                    : 'absolute inset-y-0 right-0 border-l border-[color:var(--float-border)] text-ink backdrop-blur-[var(--sky-glass-blur)]'
              }
              style={
                fullScreen
                  ? ({
                      // The whole window, over the top bar: the map is fully covered.
                      inset: 0,
                      zIndex: ASK_FULL_SCREEN.zIndex,
                      background: ASK_SURFACE_BACKGROUND.panel,
                    } as CSSProperties)
                  : rise
                  ? ({
                      // Centred, the composer's width at most: left and right
                      // hold the least room, and auto margins centre what is left.
                      top: ASK_RISE.top,
                      bottom: ASK_RISE.bottom,
                      left: ASK_RISE.inset,
                      right: ASK_RISE.inset,
                      maxWidth: ASK_RISE.width,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      borderRadius: ASK_RISE.radius,
                      background: ASK_SURFACE_BACKGROUND.panel,
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.35)',
                    } as CSSProperties)
                  : ({
                      width: ASK_PANEL.width,
                      background: ASK_SURFACE_BACKGROUND.panel,
                      boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
                    } as CSSProperties)
              }
            >
              <AskPanel
                controller={controller}
                layout="panel"
                subjectId={subjectId}
                onExpand={beside ? expand : undefined}
                fullScreen={fullScreenToggle}
                column={fullScreen ? ASK_FULL_SCREEN.column : undefined}
              />
            </section>
          ) : (
            <section
              ref={surface}
              role={modal ? 'dialog' : undefined}
              aria-modal={modal || undefined}
              aria-label={t('ask.title')}
              data-ask-surface="sheet"
              data-ask-entry={entry}
              data-ask-conversation={controller.conversationId ?? ''}
              data-ask-motion="sheet"
              data-ask-full-screen={fullScreen || undefined}
              onKeyDown={onKeyDown}
              data-surface="sky"
              className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden text-ink backdrop-blur-[var(--sky-glass-blur)]"
              style={{
                background: ASK_SURFACE_BACKGROUND.sheet,
                height: sheetHeightFor(entry, fullScreen),
                borderRadius: entry === 'direct' || fullScreen ? 0 : `${ASK_SHEET.radius}px ${ASK_SHEET.radius}px 0 0`,
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
                transform: drag.offset ? `translateY(${drag.offset}px)` : undefined,
                // It springs back from a drag, and eases between 72% and full screen (#676).
                transition:
                  drag.dragging || reducedMotion
                    ? 'none'
                    : 'transform var(--motion-sheet) var(--ease-standard), height var(--motion-sheet) var(--ease-standard), border-radius var(--motion-sheet) var(--ease-standard)',
              } as CSSProperties}
            >
              {entry === 'planet' && (
                <div {...drag.handle} className="flex shrink-0 touch-none justify-center pt-2">
                  <span
                    aria-hidden="true"
                    title={t('ask.grabber')}
                    className="rounded-[3px] bg-tertiary"
                    style={{ width: ASK_SHEET.grabber.width, height: ASK_SHEET.grabber.height }}
                  />
                </div>
              )}
              <div className="min-h-0 flex-1">
                <AskPanel
                  controller={controller}
                  layout="sheet"
                  subjectId={subjectId}
                  headerHandle={entry === 'planet' ? drag.handle : undefined}
                  fullScreen={fullScreenToggle}
                />
              </div>
            </section>
          ))}
      </div>
    </AskMakeWayContext.Provider>
  )
}
