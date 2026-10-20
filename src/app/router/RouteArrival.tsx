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
 * - the first load, with the redirects the app makes before any page was
 *   shown (`/` to a role's home, a guard to the sign-in page);
 * - a page that stays on screen while its path changes (its <main> is the
 *   same element): the star map across its layers (#330), Ask across its
 *   conversations. It moves focus and speaks for itself;
 * - focus a page put somewhere itself: a field it focused, Ask's composer, a
 *   dialog. Only focus that was lost (on <body>, or on an element no longer in
 *   the document) is moved, and only after the new page's own effects ran.
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

/** On the page itself, or on an element that was taken out of it. */
function focusLost() {
  const active = document.activeElement
  return !active || active === document.body || active === document.documentElement || !active.isConnected
}

/*
 * Focusable from code only (tabindex -1, never a Tab stop), and only while it
 * holds focus: the attributes go again when focus moves on, so a click on the
 * heading later does not take focus there. A blur that leaves it focused (the
 * window went to the background) keeps them, or the heading would lose focus
 * on the way back. `data-route-focus` turns the outline off (index.css), as for
 * the other targets focused by code.
 */
function takeFocus(target: HTMLElement) {
  const addedTabIndex = !target.hasAttribute('tabindex')
  if (addedTabIndex) target.setAttribute('tabindex', '-1')
  target.setAttribute('data-route-focus', '')
  const release = () => {
    if (addedTabIndex) target.removeAttribute('tabindex')
    target.removeAttribute('data-route-focus')
  }
  const onBlur = () => {
    // A move clears focus before the blur; a window going to the back does not.
    if (document.activeElement === target) target.addEventListener('blur', onBlur, { once: true })
    else release()
  }
  // The scroll is left where it was: a back or forward move keeps the
  // position the browser gives it.
  target.focus({ preventScroll: true })
  if (document.activeElement === target) {
    target.addEventListener('blur', onBlur, { once: true })
    return true
  }
  release()
  return false
}

/** The page's heading, any heading, or its <main>: inside the pages, never a portal or a dev panel. */
function arrivalTargets(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  const main = root.querySelector('main')
  return [main?.querySelector('h1'), root.querySelector('h1'), main].filter(
    (target): target is HTMLElement => target instanceof HTMLElement,
  )
}

export function RouteArrival({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const pages = useRef<HTMLDivElement>(null)
  const shown = useRef(pathname)
  /** The path the reader went to, until its page is on screen. */
  const pending = useRef<string | null>(null)
  /** A name reported since the last change of path, and where. */
  const named = useRef<{ pathname: string; name: string | null } | null>(null)
  /** The <main> of the page the reader was on, to tell a page that stayed from a new one. */
  const lastMain = useRef<Element | null>(null)
  /** A page has been on screen: a replace after this is a move, not loading. */
  const pageShown = useRef(false)
  const spoken = useRef(0)
  const [said, setSaid] = useState<{ name: string; count: number } | null>(null)

  const currentMain = () => pages.current?.querySelector('main') ?? null

  // Acting on a page also ends the first load: the sign-in page a refused
  // visitor sees has no name to report. A key on a loading screen does not.
  // A screen reader's browse mode activates a link with a click alone, no key
  // or pointer event, so a click counts too.
  useEffect(() => {
    lastMain.current = currentMain()
    const mark = () => {
      lastMain.current = currentMain()
      if (!pageShown.current && arrivalTargets(pages.current).length > 0) pageShown.current = true
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
    const targets = arrivalTargets(pages.current)
    if (!report && targets.length === 0) return
    pending.current = null
    pageShown.current = true
    lastMain.current = currentMain()
    if (focusLost()) targets.some(takeFocus)
    const name = report?.name
    // A fresh node each time, so the same name twice in a row is said twice;
    // a page with no name of its own leaves the region empty.
    setSaid(name ? { name, count: ++spoken.current } : null)
  }, [])

  const reportName = useCallback<ReportName>(
    (path, name) => {
      named.current = { pathname: path, name }
      if (path === shown.current) pageShown.current = true
      // The page behind a loading screen has just arrived. Its name is
      // reported from PageTitle's effect, before the page's own effects run:
      // settle once they have, so a focus the page sets is in place.
      if (pending.current === path) queueMicrotask(settle)
    },
    [settle],
  )

  // Runs after the new page's own effects (they are its children's), so a
  // focus the page set is already in place, and its name already reported.
  useEffect(() => {
    if (shown.current === pathname) return
    shown.current = pathname
    const main = currentMain()
    const stayed = main !== null && main === lastMain.current
    // A link, a back or forward move, or a replace once a page was shown; a
    // replace before then is the app still loading.
    const byReader = navigationType !== NavigationType.Replace || pageShown.current
    pending.current = byReader && !stayed ? pathname : null
    // Left alone: the region holds no name of a page the reader has left.
    if (pending.current === null) setSaid(null)
    settle()
    lastMain.current = main
    // The page a first load's redirects end on is shown now, if it is here.
    if (named.current?.pathname === pathname || arrivalTargets(pages.current).length > 0) pageShown.current = true
    // A later arrival waits for a report of its own, never this one's.
    named.current = null
  }, [pathname, navigationType, settle])

  return (
    <ReportNameContext.Provider value={reportName}>
      {/* No box of its own: it only marks where the pages are. */}
      <div ref={pages} className="contents" data-route-pages="">
        {children}
      </div>
      {/* Outside the pages' Suspense boundary, so it is in the document before anything is said into it. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-route-announcer="">
        {said && <span key={said.count}>{said.name}</span>}
      </div>
    </ReportNameContext.Provider>
  )
}
