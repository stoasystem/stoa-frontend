/*
 * PROTOTYPE #476 -- throwaway, lives only on branch claude/find-star-prototype-476.
 *
 * "I want to keep practising derivatives" typed into Ask finds that star on
 * the map. The prototype itself is in `src/dev/preview/findStar/`; this is
 * the one seam it reaches the real map and Ask through. The default does
 * nothing, so every screen behaves as on main unless the design preview
 * provides one (`preview.html?surface=find-star`).
 */
import { createContext, useContext, type ReactNode } from 'react'
import type { StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import type { StarMap } from '@/features/starmap/model/starMap'
import type { LayerTarget } from '@/features/starmap/view/layers'

export type FindStarSeam = {
  /** Typing in the docked composer: true keeps it docked (Ask does not open). */
  dockedChange?: (value: string) => boolean
  /** Enter in the docked composer: true when the prototype took it. */
  dockedSubmit?: (value: string) => boolean
  /** Drawn just above the docked composer. */
  aboveDocked?: ReactNode
  /** A question sent from Ask's composer: true when the prototype took it (it is not sent). */
  askSubmit?: (value: string) => boolean
  /** Drawn at the end of Ask's thread. */
  threadEnd?: ReactNode
  /** The map now on screen, for the prototype to find stars in. */
  onMap?: (map: StarMap) => void
  /** Where the camera goes instead of the route's target, while set. */
  target?: LayerTarget | null
  /** The student moved the map themself: the prototype lets go of `target`. */
  release?: () => void
  overlay?: (locate: (unitId: string) => StarOnScreen | null, watch: (listener: () => void) => () => void) => ReactNode
}

export const FindStarSeamContext = createContext<FindStarSeam>({})

export function useFindStarSeam(): FindStarSeam {
  return useContext(FindStarSeamContext)
}
