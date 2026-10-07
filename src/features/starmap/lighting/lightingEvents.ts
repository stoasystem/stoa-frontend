/*
 * The lighting moment's signal (#51): which knowledge points were lit for the
 * first time and the student has not yet seen celebrated, and the call that
 * says they have.
 *
 * Shaped after stoasystem/stoa-backend#71 (not built yet): the read model
 * gives each lit point `litAt` and `litAtSource` (`observed` | `backfilled`)
 * and lists the points lit but not yet acknowledged by this student; an
 * acknowledge call removes them from that list. The acknowledgement is kept
 * by the server, per student -- never in this browser -- so a reload does not
 * replay a celebration and another account on the same device does not
 * inherit one.
 *
 * This is a seam, not a service: production has no backend for it yet, so
 * its default (`emptyLightingEventSource`) never emits and makes no request.
 * The design preview provides a demo source (`src/dev/preview/lighting.tsx`).
 * When #71 lands, #3 provides a source over the real read model here.
 */
import { createContext, useContext } from 'react'

/** Where a lit fact came from (#9 point 3): seen happening, or written by the backfill. */
export type LitAtSource = 'observed' | 'backfilled'

/** One knowledge point lit and not yet acknowledged. One per unit: a point is lit once, for good. */
export type LitEvent = {
  unitId: string
  /** When it was first lit, ISO 8601. */
  litAt: string
  litAtSource: LitAtSource
  /**
   * It was its subject's recommendation when it was lit (#145, round three
   * of #114, C11). Optional, and not in stoa-backend#71's shape yet: with it
   * the map keeps the recommendation marker on the point until the flare's
   * brightest moment and moves it on together with the gold
   * (`useLightingStage.ts`); without it the marker is drawn where the map
   * says from the first frame, as before.
   */
  recommended?: boolean
}

export type LightingEventSource = {
  /** The lit points this student has not acknowledged. */
  unacknowledged(): Promise<LitEvent[]>
  /** The student has seen these celebrated; they are not to come back. */
  acknowledge(unitIds: string[]): Promise<void>
  /** Called when `unacknowledged` may have changed. Optional: a source may only be read on mount. */
  subscribe?: (onChange: () => void) => () => void
  /**
   * The same list, now, without asking: what the source already holds (#140).
   * Optional. With it the map draws a point not yet celebrated as it was
   * before -- in progress -- from its very first frame until the flare's
   * brightest moment, and a student coming back to its star lands on its
   * nebula seen whole (`useLightingStage.ts`). A source without it is
   * celebrated as before (#51): on a star already drawn lit, where it opens.
   */
  known?: () => readonly LitEvent[]
}

/** Production's source until stoa-backend#71: nothing is ever lit "just now", and nothing is asked. */
export const emptyLightingEventSource: LightingEventSource = {
  unacknowledged: async () => [],
  acknowledge: async () => {},
}

/** Only a point seen lit is celebrated; the backfill's never are (#51, stoa-backend#71). */
export function isCelebrated(event: LitEvent): boolean {
  return event.litAtSource === 'observed'
}

export const LightingEventSourceContext = createContext<LightingEventSource>(emptyLightingEventSource)

export function useLightingEventSource(): LightingEventSource {
  return useContext(LightingEventSourceContext)
}
