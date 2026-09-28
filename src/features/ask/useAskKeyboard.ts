import { useCallback, useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusables(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !element.closest('[inert]') && element.getAttribute('aria-hidden') !== 'true',
  )
}

type KeyEvent = Pick<KeyboardEvent, 'key' | 'keyCode' | 'shiftKey' | 'preventDefault' | 'stopPropagation'> & {
  isComposing?: boolean
  nativeEvent?: { isComposing?: boolean }
}

/**
 * An input method is still composing: its Esc cancels the composition, not
 * Ask. keyCode 229 is how Safari reports a key that belongs to one.
 */
function composing(event: KeyEvent) {
  return Boolean(event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229)
}

/**
 * Keyboard handling for Ask: Esc closes it, and, when `trap` is set (the phone
 * sheet opened from the planet, which is modal), Tab and Shift+Tab go round the
 * sheet instead of leaving it -- from wherever the focus is, even outside it.
 *
 * The modal sheet listens on the document, so Esc and Tab work while nothing
 * inside it has the focus; the desktop panel and the full-screen sheet answer
 * only keys pressed inside them (the returned `onKeyDown`).
 */
export function useAskKeyboard(
  container: RefObject<HTMLElement | null>,
  { trap, active, onEscape }: { trap: boolean; active: boolean; onEscape: () => void },
) {
  const handle = useCallback(
    (event: KeyEvent) => {
      if (composing(event)) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onEscape()
        return
      }
      if (!trap || event.key !== 'Tab' || !container.current) return
      const items = focusables(container.current)
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const focused = document.activeElement
      const inside = container.current.contains(focused)
      if (event.shiftKey && (!inside || focused === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || focused === last)) {
        event.preventDefault()
        first.focus()
      }
    },
    [container, onEscape, trap],
  )

  useEffect(() => {
    if (!trap || !active) return
    const listener = (event: KeyboardEvent) => handle(event)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [active, handle, trap])

  // With the document listening, the element's own handler stands down.
  return trap ? undefined : handle
}
