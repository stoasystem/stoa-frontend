import { History } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ICON } from '@/components/base/sizes'
import { conversationDisplayTitle } from '@/components/chat/conversationTitle'
import { when } from '@/features/ask/AskConversationList'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'

/** How many of the latest conversations the docked composer offers. */
export const ASK_RECENT_COUNT = 3

/**
 * What a press on the docked composer's field offers (#645 follow-up): the
 * three latest conversations, newest first, and under them a way to the whole
 * list. One tap opens Ask on what was chosen.
 *
 * It replaced the round button at the end of the composer's row: that button
 * and the composer were two ways into the same thread (the button opened the
 * last one, typing opened it too). Now the composer is the one way in, and a
 * press on it says where it can go.
 *
 * A menu: the field says it has one (`aria-haspopup`, `aria-expanded`); the
 * arrows, Tab and Shift+Tab move through it; Escape puts it away and the
 * keyboard back in the field. Over the composer, its width, as the "Find my
 * own star" examples stand (#586); it is gone again as soon as the student
 * types, chooses, or presses anywhere else.
 */
export function AskRecent({
  id,
  field,
  onSelect,
  onClose,
}: {
  id: string
  /** The field it belongs to: a press there is not a press outside. */
  field: () => HTMLElement | null
  /** A conversation, or `null` for the list. */
  onSelect: (conversationId: string | null) => void
  /** Put away; `refocus` when the keyboard goes back to the field. */
  onClose: (refocus: boolean) => void
}) {
  const { t } = useTranslation('chat')
  const own = useRef<HTMLDivElement>(null)
  const conversations = useConversationsQuery().data?.items ?? []
  const recent = [...conversations]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, ASK_RECENT_COUNT)

  useEffect(() => {
    function onPress(event: PointerEvent) {
      const target = event.target as Node
      if (own.current?.contains(target) || field()?.contains(target)) return
      onClose(false)
    }
    document.addEventListener('pointerdown', onPress)
    return () => document.removeEventListener('pointerdown', onPress)
  }, [field, onClose])

  const items = () => Array.from(own.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const all = items()
    const at = all.indexOf(document.activeElement as HTMLElement)
    const move = (to: number) => {
      event.preventDefault()
      all[(to + all.length) % all.length]?.focus()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose(true)
    } else if (event.key === 'ArrowDown') move(at + 1)
    else if (event.key === 'ArrowUp') move(at - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(all.length - 1)
    else if (event.key === 'Tab') {
      // Out of either end, back to the field rather than across the page.
      if ((event.shiftKey && at === 0) || (!event.shiftKey && at === all.length - 1)) {
        event.preventDefault()
        onClose(true)
      } else move(at + (event.shiftKey ? -1 : 1))
    }
  }

  const item =
    'flex w-full min-h-11 cursor-pointer items-center gap-2 border-0 bg-transparent text-left hover:bg-fill focus-visible:bg-fill'

  return (
    <div
      ref={own}
      id={id}
      role="menu"
      aria-label={t('ask.list.label')}
      data-ask-recent
      onKeyDown={onKeyDown}
      className="absolute inset-x-0 bottom-full z-10 mb-2 flex flex-col items-stretch gap-2"
    >
      {recent.length > 0 && (
        <div
          className="flex flex-col rounded-[14px] border border-solid border-[color:var(--float-border)] [background:linear-gradient(var(--surface),var(--surface)),var(--ground)] p-1.5 text-ink shadow-[var(--shadow-float)]"
        >
          {recent.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              data-ask-recent-conversation={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={item}
              style={{ padding: '8px 10px', borderRadius: 10 }}
            >
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                {conversationDisplayTitle(conversation, t) || t('ask.list.untitled')}
              </span>
              <span className="shrink-0 text-[12px] text-caption">{when(conversation.updatedAt)}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        role="menuitem"
        tabIndex={-1}
        data-ask-recent-all
        onClick={() => onSelect(null)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-center rounded-full border border-solid border-[color:var(--sky-glass-border)] bg-[color:var(--sky-glass)] px-4 text-[14px] text-[color:var(--on-sky-text)] shadow-[var(--shadow-glass)] backdrop-blur-[var(--sky-glass-blur)] hover:bg-[color:var(--on-sky-selected)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <History size={ICON.button} strokeWidth={ICON.stroke} aria-hidden="true" />
        {t('ask.back')}
      </button>
    </div>
  )
}

/** The field's own keys while the menu is open: into it, or put it away. */
export function recentFieldKeys(event: KeyboardEvent<HTMLTextAreaElement>, menu: string, onClose: () => void) {
  const items = Array.from(document.getElementById(menu)?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])
  if (items.length === 0) return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    onClose()
  } else if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
    event.preventDefault()
    items[0].focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    items[items.length - 1].focus()
  }
}
