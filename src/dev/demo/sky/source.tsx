/*
 * The demo sky as a star map source (#131): what the bench and the tests
 * inject through `StarMapSourceContext` (`starMapSource.ts`) instead of the
 * application's empty sky. The design preview wraps the same map in its
 * lighting override (`src/dev/preview/lighting.tsx`).
 *
 * Importing this module adds the demo-only words (`strings.ts`) to the
 * `starmap` namespace, so whoever can draw the demo sky can also say so.
 */
import type { ReactNode } from 'react'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { addDemoSkyStrings } from '@/dev/demo/sky/strings'
import { StarMapSourceContext, type StarMapRequest, type StarMapSource } from '@/features/starmap/starMapSource'

addDemoSkyStrings()

export function readDemoStarMap({ subjectId, size, t, language, relations, longNames }: StarMapRequest) {
  return demoStarMap(subjectId, size, t, { language, relations, longNames })
}

export const demoStarMapSource: StarMapSource = { read: readDemoStarMap, demo: true }

export function DemoStarMapSource({ children }: { children: ReactNode }) {
  return <StarMapSourceContext.Provider value={demoStarMapSource}>{children}</StarMapSourceContext.Provider>
}
