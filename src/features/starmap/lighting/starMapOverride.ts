/*
 * A seam for the star map's data (#51): something that may change the
 * learning states the map draws, before it draws them.
 *
 * Production default: none (`identityStarMapOverride`) -- `useStarMap` keeps
 * the fixture path it has today. The design preview provides one that makes
 * the map follow the lessons completed on the page: the demo knowledge point
 * lights when its chapter is done, and what waited for it opens
 * (`src/dev/preview/lighting.tsx`). When the read model (stoa-backend#59) is
 * wired in (#3), the map reads the states from it and this seam goes.
 */
import { createContext, useContext } from 'react'
import type { FixtureSize } from '@/features/starmap/fixtures/demoSky'
import type { StarMap } from '@/features/starmap/model/starMap'

/** Returns the map to draw. Must be pure; a new function means the states changed. */
export type StarMapOverride = (map: StarMap, size: FixtureSize) => StarMap

export const identityStarMapOverride: StarMapOverride = (map) => map

export const StarMapOverrideContext = createContext<StarMapOverride>(identityStarMapOverride)

export function useStarMapOverride(): StarMapOverride {
  return useContext(StarMapOverrideContext)
}
