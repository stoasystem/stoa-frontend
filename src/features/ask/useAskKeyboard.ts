import { useCallback, type KeyboardEvent, type RefObject } from 'react'

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

/**
 * Keyboard handling for Ask: Esc closes it wherever the focus is inside, and,
 * when `trap` is set (the phone sheet, which is modal), Tab and Shift+Tab go
 * round the sheet instead of leaving it for the dimmed planet behind.
 */
export function useAskKeyboard(
  container: RefObject<HTMLElement | null>,
  { trap, onEscape }: { trap: boolean; onEscape: () => void },
) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
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
      const active = document.activeElement
      if (event.shiftKey && (active === first || !container.current.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [container, onEscape, trap],
  )
}
