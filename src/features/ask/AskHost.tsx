import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Composer } from '@/components/base'
import { AskPanel } from '@/features/ask/AskPanel'
import { ASK_PANEL, ASK_SHEET, DOCKED_COMPOSER, sheetHeightFor } from '@/features/ask/askLayout'
import { useAskController, type AskRoute } from '@/features/ask/useAskController'
import { useAskKeyboard } from '@/features/ask/useAskKeyboard'
import { useSheetDrag } from '@/features/ask/useSheetDrag'
import { WIDE_QUERY, useMediaQuery } from '@/hooks/layout/useMediaQuery'

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
 * The panel and the sheet are light surfaces, so they are siblings of the sky
 * rather than inside it: the sky tokens are scoped to `[data-surface="sky"]`
 * and must not reach them.
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
  const surface = useRef<HTMLDivElement>(null)
  const docked = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(open)
  const layout = wide ? 'panel' : 'sheet'
  const modal = open && !wide

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

  const onKeyDown = useAskKeyboard(surface, { trap: modal, onEscape: close })
  const drag = useSheetDrag(surface, close)
  const onDockedChange = useCallback(
    (value: string) => {
      if (value.trim().length > 0) controller.openWithDraft(value)
      else controller.setDraft(value)
    },
    [controller],
  )

  return (
    <div data-ask-host className="relative min-h-0 flex-1 overflow-hidden">
      <div
        data-surface="sky"
        data-ask-page
        inert={modal || undefined}
        className="absolute inset-y-0 left-0 bg-sky text-on-sky"
        style={{ right: open && wide ? ASK_PANEL.width : 0 }}
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
              <Composer
                value={controller.draft}
                onChange={onDockedChange}
                onSubmit={(value) => controller.openWithDraft(value)}
                label={t('ask.composerLabel')}
                placeholder={wide ? t('ask.dockedPlaceholder') : t('ask.dockedPlaceholderPhone')}
              />
            </div>
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
            className="absolute inset-y-0 right-0 border-l border-[color:var(--float-border)] bg-[color-mix(in_srgb,var(--ground)_94%,transparent)] text-ink backdrop-blur-[30px]"
            style={{ width: ASK_PANEL.width, boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.25)' }}
          >
            <AskPanel controller={controller} layout="panel" subjectId={subjectId} />
          </aside>
        ) : (
          <div
            ref={surface}
            role="dialog"
            aria-modal="true"
            aria-label={t('ask.title')}
            data-ask-surface="sheet"
            data-ask-entry={entry}
            data-ask-conversation={controller.conversationId ?? ''}
            data-ask-motion="sheet"
            onKeyDown={onKeyDown}
            className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden bg-[color-mix(in_srgb,var(--ground)_96%,transparent)] text-ink backdrop-blur-[30px]"
            style={{
              height: sheetHeightFor(entry),
              borderRadius: entry === 'direct' ? 0 : `${ASK_SHEET.radius}px ${ASK_SHEET.radius}px 0 0`,
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
              transform: drag.offset ? `translateY(${drag.offset}px)` : undefined,
              transition: drag.dragging ? 'none' : `transform var(--motion-sheet) var(--ease-standard)`,
            }}
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
          </div>
        ))}
    </div>
  )
}
