import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom'

/**
 * Where focus goes, and what a screen reader is told, when the page changes
 * (#406).
 *
 * Every page draws its own layout, so going from one page to the next
 * replaces the top bar and its navigation too: the link just pressed is gone,
 * focus falls to <body> and a screen reader says nothing (WCAG 2.4.3, 4.1.3).
 * After a change of path this puts focus on the new page's heading, or on its
 * <main> where it has none, and says the page's name in a polite live region
 * that is there for the whole visit.
 *
 * Left alone:
 * - the first load, with the redirects the app makes before the reader has
 *   done anything (`/` to a role's home, a guard to the sign-in page);
 * - focus a page put somewhere itself: a field it focused, Ask's composer, a
 *   dialog. Only focus that was lost (on <body>, or on an element no longer in
 *   the document) is moved, and only after the new page's own effects ran;
 * - the star map, /map/..., which moves focus and speaks for itself (#330).
 *
 * A page is settled once: when it reports its name (PageTitle, which renders
 * with the page), or, for a page with no name of its own (the sign-in page a
 * refused visitor sees at `/`), when it has a heading or <main>. A guard's
 * loading screen has neither, so its page is settled when it arrives; a
 * redirect is never settled, the page it leads to is.
 */

type ReportName = (pathname: string, name: string | null) => void

const ReportNameContext = createContext<ReportName>(() => {})

/** For PageTitle: the name of the page shown at `pathname`, or null if it has none to say. */
export function useReportPageName(): ReportName {
  return useContext(ReportNameContext)
}

/** The star map keeps one page mounted across its paths and handles focus there itself. */
function managesItsOwnFocus(pathname: string) {
  return pathname === '/map' || pathname.startsWith('/map/')
}

/** On the page itself, or on an element that was taken out of it. */
function focusLost() {
  const active = document.activeElement
  return !active || active === document.body || active === document.documentElement || !active.isConnected
}

/*
 * Focusable from code only (tabindex -1, never a Tab stop), and only while it
 * holds focus: the attributes go again when focus leaves, so a click on the
 * heading later does not take focus there. `data-route-focus` turns the
 * outline off (index.css), as for the other targets focused by code.
 */
function takeFocus(target: HTMLElement) {
  const addedTabIndex = !target.hasAttribute('tabindex')
  if (addedTabIndex) target.setAttribute('tabindex', '-1')
  target.setAttribute('data-route-focus', '')
  const release = () => {
    if (addedTabIndex) target.removeAttribute('tabindex')
    target.removeAttribute('data-route-focus')
  }
  // The scroll is left where it was: a back or forward move keeps the
  // position the browser gives it.
  target.focus({ preventScroll: true })
  if (document.activeElement === target) {
    target.addEventListener('blur', release, { once: true })
    return true
  }
  release()
  return false
}

function arrivalTargets(): HTMLElement[] {
  const main = document.querySelector('main')
  return [main?.querySelector('h1'), document.querySelector('h1'), main].filter(
    (target): target is HTMLElement => target instanceof HTMLElement,
  )
}

export function RouteArrival({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const shown = useRef(pathname)
  /** The path the reader went to, until its page is on screen. */
  const pending = useRef<string | null>(null)
  /** The last name a page reported, and where it was shown. */
  const named = useRef<{ pathname: string; name: string | null } | null>(null)
  const interacted = useRef(false)
  const spoken = useRef(0)
  const [said, setSaid] = useState<{ name: string; count: number } | null>(null)

  // A screen reader's browse mode activates a link with a click alone, no key
  // or pointer event, so a click counts too.
  useEffect(() => {
    const mark = () => {
      interacted.current = true
    }
    const events = ['keydown', 'pointerdown', 'click'] as const
    for (const event of events) window.addEventListener(event, mark, true)
    return () => {
      for (const event of events) window.removeEventListener(event, mark, true)
    }
  }, [])

  const settle = useCallback(() => {
    const path = pending.current
    if (path === null) return
    const report = named.current?.pathname === path ? named.current : null
    const targets = arrivalTargets()
    if (!report && targets.length === 0) return
    pending.current = null
    if (focusLost()) targets.some(takeFocus)
    const name = report?.name
    // A fresh node each time, so the same name twice in a row is said twice;
    // a page with no name of its own leaves the region empty.
    setSaid(name ? { name, count: ++spoken.current } : null)
  }, [])

  const reportName = useCallback<ReportName>(
    (path, name) => {
      named.current = { pathname: path, name }
      if (pending.current === path) settle()
    },
    [settle],
  )

  // Runs after the new page's own effects (they are its children's), so a
  // focus the page set is already in place, and its name already reported.
  useEffect(() => {
    if (shown.current === pathname) return
    shown.current = pathname
    // A link, a back or forward move, or anything after the reader acted; a
    // replace before then is the app still loading.
    const byReader = navigationType !== NavigationType.Replace || interacted.current
    pending.current = byReader && !managesItsOwnFocus(pathname) ? pathname : null
    // Left alone: the region holds no name of a page the reader has left.
    if (pending.current === null) setSaid(null)
    settle()
  }, [pathname, navigationType, settle])

  return (
    <ReportNameContext.Provider value={reportName}>
      {children}
      {/* Outside the pages' Suspense boundary, so it is in the document before anything is said into it. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-route-announcer="">
        {said && <span key={said.count}>{said.name}</span>}
      </div>
    </ReportNameContext.Provider>
  )
}
