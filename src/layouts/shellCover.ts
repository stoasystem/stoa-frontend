import { createContext, useContext, useEffect } from 'react'

/**
 * A modal over the whole page -- the phone Ask sheet opened from the planet --
 * covers the top bar too: dimmed like the page, and inert, so neither a tap nor
 * the keyboard reaches the bell or the avatar behind the sheet (#49).
 * `AppLayout` provides the setter; a page's modal calls `useCoverShell`.
 */
export const ShellCoverContext = createContext<((covered: boolean) => void) | null>(null)

export function useCoverShell(covered: boolean) {
  const setCovered = useContext(ShellCoverContext)
  useEffect(() => {
    if (!setCovered || !covered) return
    setCovered(true)
    return () => setCovered(false)
  }, [covered, setCovered])
}
