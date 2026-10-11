import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ICON } from '@/components/base/sizes'
import { ASK_REOPEN } from '@/features/ask/askLayout'

/**
 * Ask, called back after it was closed (#125).
 *
 * Closing the panel left the conversation with no way back: the docked composer
 * stayed, so a new question could be asked, but the thread just read was gone
 * from the page -- the student's words were "I closed it and I cannot find it
 * again". This is the way back, and it goes back to the conversation that was
 * open, not to an empty new one: the id lives in the Ask store and closing
 * never cleared it, so re-opening lands on the same thread.
 *
 * It sits on the right edge, halfway down, which is the one band the star map's
 * zoom pair, its legend, its "?" and the docked composer all leave alone --
 * `ASK_REOPEN` has the measurements.
 */
export function AskReopen({
  onOpen,
  /** A conversation is waiting; without one this opens the list. */
  resuming,
}: {
  onOpen: () => void
  resuming: boolean
}) {
  const { t } = useTranslation('chat')
  const label = resuming ? t('ask.reopen.resume') : t('ask.reopen.open')

  return (
    <button
      type="button"
      data-ask-reopen={resuming ? 'conversation' : 'list'}
      aria-label={label}
      title={label}
      onClick={onOpen}
      className="absolute top-1/2 z-10 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-solid border-[color:var(--sky-glass-border)] bg-[color:var(--sky-glass)] p-0 text-[color:var(--on-sky-text)] backdrop-blur-[var(--sky-glass-blur)] hover:bg-[color:var(--on-sky-selected)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      style={{
        right: ASK_REOPEN.inset,
        width: ASK_REOPEN.size,
        height: ASK_REOPEN.size,
        boxShadow: 'var(--shadow-glass)',
      }}
    >
      <MessageCircle size={ICON.button} strokeWidth={ICON.stroke} aria-hidden="true" />
    </button>
  )
}
