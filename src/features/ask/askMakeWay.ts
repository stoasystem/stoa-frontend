import { createContext, useContext } from 'react'

/**
 * A star followed from Ask on a wide screen (#660): Ask, open over the map,
 * makes way for it -- it moves into the 420 panel beside the map, on the same
 * conversation, while the map flies to the star. `AskHost` provides this only
 * on a wide screen; without it (a phone, the practice stage) a link to a star
 * does what it did before.
 */
export const AskMakeWayContext = createContext<(() => void) | null>(null)

export function useAskMakeWay() {
  return useContext(AskMakeWayContext)
}
