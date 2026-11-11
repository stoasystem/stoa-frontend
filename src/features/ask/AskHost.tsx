import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Composer } from '@/components/base'
import { COMPOSER } from '@/components/base/sizes'
import { UsagePeriodPausedNotice } from '@/components/usagePeriod/UsagePeriodRenewal'
import { AskPanel } from '@/features/ask/AskPanel'
import { AskRecent, recentFieldKeys } from '@/features/ask/AskRecent'
import { AskReopen } from '@/features/ask/AskReopen'
import { useClearOfControls } from '@/features/ask/clearOfControls'
import {
  ASK_PANEL,
  ASK_REOPEN,
  ASK_SHEET,
  ASK_SURFACE_BACKGROUND,
  DOCKED_COMPOSER,
  sheetHeightFor,
} from '@/features/ask/askLayout'
import { useAskController, type AskRoute } from '@/features/ask/useAskController'
import { useAskKeyboard } from '@/features/ask/useAskKeyboard'
import { useAskUsagePeriod } from '@/features/ask/useAskUsagePeriod'
import { useSheetDrag } from '@/features/ask/useSheetDrag'
import { WIDE_QUERY, useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { useCoverShell } from '@/layouts/shellCover'
import { askFor, useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'
import '@/features/ask/askGuide.css'

/**
 * The planet with Ask on it (#12 points 1 and 6; #13 point 1).
 *
 * `children` is the planet (or its placeholder), drawn on the sky. Below it
 * sits the docked composer; typing in it opens Ask:
 *
 * - desktop: a 420 panel slides in from the right, over the sky; the page area
 *   narrows to what is left, so the planet re-centres and stays usable.
 * - phone: a sheet rises to 72%; the planet behind it dims and is inert; drag
 *   the sheet down, tap the dim or press Esc to close it.
 *
 * With `route` (the pages `/ask` and `/ask/:id`) Ask is open from the start:
 * the same panel on a desktop, a full-screen sheet on a phone, and closing it
 * goes to `/`.
 *
 * The panel and the sheet are dark surfaces of their own (#125): each carries
 * `data-surface="sky"` and `data-ask-surface`, which brand-tokens.css turns
 * into the sky's colours, so they hold inside them and Ask no longer reads as a white card from another product.
 *
 * Closed, the docked composer is the one way back in. A press on its field
 * offers the three latest conversations and the way to all of them
 * (`AskRecent`); its + opens Ask with the add menu open, where the camera, a
 * file or the phone is chosen. `AskReopen` stood at the end of its row (#125,
 * #645) and went: the button and the composer were two ways into the same
 * thread (typing opened the last conversation, and so did the button). It
 * stays only while the usage period is paused (#615), when the field is shut
 * and the button is the one way to read the old conversations.
 *
 * After "Find my own star" on the first landing (#586) the docked composer
 * takes the focus, is highlighted once, and offers two or three things the
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
  const reopenRoom = ASK_REOPEN.size + ASK_REOPEN.gap
  // From the planet the phone sheet is a modal over it: the planet and the bar
  // are dimmed and inert, and the keyboard stays in the sheet. Opened at /ask
  // the full-screen sheet is the page itself, so the bar stays usable.
  const modal = sheet && entry === 'planet'
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

  // Opened: the cursor is in Ask's own composer, after what was typed -- unless
  // it opened from the docked +, where the add menu takes it (moving it to the
  // field would put the menu away).
  const openingToAdd = useRef(false)
  useEffect(() => {
    if (!open) return
    if (openingToAdd.current) {
      openingToAdd.current = false
      return
    }
    const field = surface.current?.querySelector<HTMLTextAreaElement>('[data-composer-field]')
    if (!field || surface.current?.contains(document.activeElement)) return
    field.focus()
    const end = field.value.length
    field.setSelectionRange?.(end, end)
  }, [open, layout])

  const onKeyDown = useAskKeyboard(surface, { trap: modal, active: open, onEscape: close })
  const drag = useSheetDrag(surface, close)
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
  // The docked +: a file chooser opens only from the student's own press, and
  // the files are the panel's, so Ask opens with its add menu already open and
  // the camera, a file or the phone is chosen there.
  const wantAddMenu = useAskStore((state) => state.wantAddMenu)
  const { reopen } = controller
  const openToAdd = useCallback(() => {
    if (!ownerId) return
    setRecentOpen(false)
    openingToAdd.current = true
    wantAddMenu(ownerId)
    reopen()
  }, [ownerId, wantAddMenu, reopen])
  const onDockedCompositionEnd = useCallback(
    (value: string) => {
      composing.current = false
      if (value.trim().length > 0) controller.openWithDraft(value)
    },
    [controller],
  )

  return (
    <div data-ask-host className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={page}
        data-surface="sky"
        data-ask-page
        inert={sheet || undefined}
        className="absolute inset-y-0 left-0 bg-sky text-on-sky"
        // Reserve the dock's space for the page's own controls, including while
        // the panel is open, so closing it never covers a control.
        style={{
          right: open && wide ? ASK_PANEL.width : 0,
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
                  <p id={examplesLabel} role="status" className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">
                    {t('ask.examples.label')}
                  </p>
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
                onAdd={openToAdd}
                dictation
                label={t('ask.composerLabel')}
                placeholder={wide ? t('ask.dockedPlaceholder') : t('ask.dockedPlaceholderPhone')}
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
          style={{ background: `rgba(0, 0, 0, ${ASK_SHEET.dim})` }}
        />
      )}

      {open &&
        (wide ? (
          <aside
            ref={surface}
            aria-label={t('ask.title')}
            data-ask-surface="panel"
            data-ask-entry={entry}
            data-ask-conversation={controller.conversationId ?? ''}
            data-ask-motion="panel"
            onKeyDown={onKeyDown}
            data-surface="sky"
            className="absolute inset-y-0 right-0 border-l border-[color:var(--float-border)] text-ink backdrop-blur-[var(--sky-glass-blur)]"
            style={{
              width: ASK_PANEL.width,
              background: ASK_SURFACE_BACKGROUND.panel,
              boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)',
            } as CSSProperties}
          >
            <AskPanel controller={controller} layout="panel" subjectId={subjectId} />
          </aside>
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
            onKeyDown={onKeyDown}
            data-surface="sky"
            className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden text-ink backdrop-blur-[var(--sky-glass-blur)]"
            style={{
              background: ASK_SURFACE_BACKGROUND.sheet,
              height: sheetHeightFor(entry),
              borderRadius: entry === 'direct' ? 0 : `${ASK_SHEET.radius}px ${ASK_SHEET.radius}px 0 0`,
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
              transform: drag.offset ? `translateY(${drag.offset}px)` : undefined,
              transition:
                drag.dragging || reducedMotion ? 'none' : `transform var(--motion-sheet) var(--ease-standard)`,
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
              />
            </div>
          </section>
        ))}
    </div>
  )
}
