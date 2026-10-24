import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Composer } from '@/components/base'
import { COMPOSER } from '@/components/base/sizes'
import { AskPanel } from '@/features/ask/AskPanel'
import { AskReopen } from '@/features/ask/AskReopen'
import {
  ASK_PANEL,
  ASK_SHEET,
  ASK_SURFACE_BACKGROUND,
  DOCKED_COMPOSER,
  sheetHeightFor,
} from '@/features/ask/askLayout'
import { useAskController, type AskRoute } from '@/features/ask/useAskController'
import { useAskKeyboard } from '@/features/ask/useAskKeyboard'
import { useSheetDrag } from '@/features/ask/useSheetDrag'
import { WIDE_QUERY, useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { useCoverShell } from '@/layouts/shellCover'
import { useFindStarSeam } from '@/features/starmap/findStarPrototypeSeam'

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
 * Closed, `AskReopen` on the right edge calls the same conversation back.
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
  // From the planet the phone sheet is a modal over it: the planet and the bar
  // are dimmed and inert, and the keyboard stays in the sheet. Opened at /ask
  // the full-screen sheet is the page itself, so the bar stays usable.
  const modal = sheet && entry === 'planet'
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const composing = useRef(false)
  useCoverShell(modal)
  // PROTOTYPE #476: a no-op outside the design preview's find-a-star prototype.
  const seam = useFindStarSeam()

  // Closed again: the focus goes back to where Ask was opened from.
  useEffect(() => {
    if (wasOpen.current && !open) docked.current?.querySelector<HTMLElement>('[data-composer-field]')?.focus()
    wasOpen.current = open
  }, [open])

  // Opened: the cursor is in Ask's own composer, after what was typed.
  useEffect(() => {
    if (!open) return
    const field = surface.current?.querySelector<HTMLTextAreaElement>('[data-composer-field]')
    if (!field || surface.current?.contains(document.activeElement)) return
    field.focus()
    const end = field.value.length
    field.setSelectionRange?.(end, end)
  }, [open, layout])

  const onKeyDown = useAskKeyboard(surface, { trap: modal, active: open, onEscape: close })
  const drag = useSheetDrag(surface, close)
  // An input method (Chinese, Japanese, a dead key for an accent) is still
  // composing while its first characters arrive; opening Ask then would move
  // the field from under it. Ask opens once the composition ends.
  const onDockedChange = useCallback(
    (value: string) => {
      if (seam.dockedChange?.(value)) controller.setDraft(value)
      else if (value.trim().length > 0 && !composing.current) controller.openWithDraft(value)
      else controller.setDraft(value)
    },
    [controller, seam],
  )
  const onDockedCompositionEnd = useCallback(
    (value: string) => {
      composing.current = false
      if (seam.dockedChange?.(value)) return
      if (value.trim().length > 0) controller.openWithDraft(value)
    },
    [controller, seam],
  )

  return (
    <div data-ask-host className="relative min-h-0 flex-1 overflow-hidden">
      <div
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
            className="absolute flex justify-center"
            style={
              wide
                ? { left: 24, right: 24, bottom: DOCKED_COMPOSER.desktop.bottom }
                : { left: DOCKED_COMPOSER.phone.inset, right: DOCKED_COMPOSER.phone.inset, bottom: DOCKED_COMPOSER.phone.bottom }
            }
          >
            <div className="w-full" style={{ maxWidth: wide ? DOCKED_COMPOSER.desktop.width : undefined }}>
              {seam.aboveDocked}
              <Composer
                value={controller.draft}
                onChange={onDockedChange}
                onCompositionStart={() => {
                  composing.current = true
                }}
                onCompositionEnd={onDockedCompositionEnd}
                onSubmit={(value) => {
                  if (!seam.dockedSubmit?.(value)) controller.openWithDraft(value)
                }}
                label={t('ask.composerLabel')}
                placeholder={wide ? t('ask.dockedPlaceholder') : t('ask.dockedPlaceholderPhone')}
              />
            </div>
          </div>
        )}
        {!open && <AskReopen onOpen={controller.reopen} resuming={controller.conversationId !== null} />}
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
