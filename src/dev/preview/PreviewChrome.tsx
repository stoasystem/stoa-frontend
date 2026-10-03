/*
 * What the design preview adds around the app (#115): the route written back
 * into the page address, the click a surface needs to show its state, a
 * banner for a surface that is not built yet, and `data-preview-ready` on
 * <html> once the page has settled, for the screenshot script.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { Surface } from '@/dev/preview/surfaces'

/** Radix menus open on pointer down, not on click. */
function press(element: Element) {
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse' }))
}

async function waitFor(selector: string, timeoutMs = 5000) {
  const until = performance.now() + timeoutMs
  while (performance.now() < until) {
    const found = document.querySelector(selector)
    if (found) return found
    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }
  return null
}

export function PreviewChrome({
  initialPath,
  open,
  pending,
  readyWhen,
}: {
  initialPath: string
  open?: Surface['open']
  pending?: string
  readyWhen?: string
}) {
  const location = useLocation()

  useEffect(() => {
    const route = `${location.pathname}${location.search}`
    if (route === initialPath) return
    // Once the page is somewhere its surface did not put it, the address says where.
    const url = new URL(window.location.href)
    url.searchParams.set('path', route)
    url.searchParams.delete('surface')
    window.history.replaceState(null, '', url)
  }, [initialPath, location.pathname, location.search])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (open === 'account-menu') {
        const trigger = await waitFor('[data-account-trigger]')
        if (trigger && !cancelled) press(trigger)
        await waitFor('[role="menu"]')
      }
      if (readyWhen) await waitFor(readyWhen, 15_000)
      // Two frames after the last change, so the star map has drawn once.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      if (!cancelled) document.documentElement.dataset.previewReady = '1'
    })()
    return () => {
      cancelled = true
    }
  }, [open, readyWhen])

  if (!pending) return null
  return (
    <div
      role="status"
      style={{
        position: 'fixed', zIndex: 2147483647, left: 12, bottom: 12, maxWidth: 360, padding: '8px 12px',
        borderRadius: 8, background: '#1d1d1f', color: '#fff', font: '13px/1.4 system-ui, sans-serif',
      }}
    >
      Design preview: {pending}
    </div>
  )
}
