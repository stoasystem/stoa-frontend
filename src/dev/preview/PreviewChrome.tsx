/*
 * What the design preview adds around the app (#115): the route, sign-in and
 * language written back into the page address (so a reload opens the same
 * place), the click a surface needs to show its state, a
 * banner for a surface that is not built yet, and `data-preview-ready` on
 * <html> once the page has settled, for the screenshot script.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import type { Surface } from '@/dev/preview/surfaces'
import { useAuthStore } from '@/store/authStore'

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
  focus,
  pending,
  readyWhen,
}: {
  initialPath: string
  open?: Surface['open']
  focus?: string
  pending?: string
  readyWhen?: string
}) {
  const location = useLocation()
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const [openedIn] = useState(language)
  const signedIn = useAuthStore((state) => state.isAuthenticated)

  // The address says where the page is, so a reload opens the same place: the route
  // (`path`, also once back on the surface's own), signed in or out, and the language.
  useEffect(() => {
    const route = `${location.pathname}${location.search}`
    const url = new URL(window.location.href)
    const params = url.searchParams
    if (route !== initialPath || params.has('path')) {
      params.set('path', route)
      params.delete('surface')
    }
    // Without a surface the preview opens signed in, unless told otherwise.
    if (params.has('path')) {
      if (signedIn) params.delete('signedIn')
      else params.set('signedIn', '0')
    }
    if (params.has('lang') || language !== openedIn) params.set('lang', language)
    if (url.href !== window.location.href) window.history.replaceState(null, '', url)
  }, [initialPath, location.pathname, location.search, signedIn, language, openedIn])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (open === 'account-menu') {
        const trigger = await waitFor('[data-account-trigger]')
        if (trigger && !cancelled) press(trigger)
        await waitFor('[role="menu"]')
      }
      if (focus) {
        const element = await waitFor(focus, 10_000)
        if (element instanceof HTMLElement && !cancelled) element.focus()
        // A focused nebula pans into the focus region first.
        await new Promise((resolve) => window.setTimeout(resolve, 900))
      }
      if (readyWhen) await waitFor(readyWhen, 15_000)
      // Two frames after the last change, so the star map has drawn once.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      if (!cancelled) document.documentElement.dataset.previewReady = '1'
    })()
    return () => {
      cancelled = true
    }
  }, [open, focus, readyWhen])

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
