/*
 * The lighting moment's source on production (#51, stoa-backend#71): the
 * points this student lit and has not yet seen celebrated, and the call that
 * says they have.
 *
 * `lightingEvents.ts` left the application on `emptyLightingEventSource`,
 * which never emits, so until now only the design preview ever celebrated
 * anything. This fills that seam from the read model.
 *
 * It makes no request of its own. `GET /practice/knowledge-map` already
 * carries `unacknowledgedLit` beside the sky, and `readModelSource.tsx` keeps
 * that response in the query cache; this reads the same entry and follows it.
 * So the map a celebration plays on and the list of what to celebrate always
 * come from one response, in one tick.
 *
 * The design preview keeps its own source (`src/dev/preview/lighting.tsx`):
 * this provider yields to any source supplied above it.
 */
import { hashKey, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import {
  LightingEventSourceContext,
  emptyLightingEventSource,
  useLightingEventSource,
  type LightingEventSource,
  type LitEvent,
} from '@/features/starmap/lighting/lightingEvents'
import { logger } from '@/services/logging'
import { acknowledgeLitUnits } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import type { KnowledgeMapResponse } from '@/types/practice'

/** The most unit ids one acknowledgement may carry; over this the backend answers 422. */
export const ACKNOWLEDGE_LIMIT = 50

/** The sky's query: the whole sky under one key, as `readModelSource.tsx` asks for it. */
const SKY_KEY = practiceQueryKeys.knowledgeMap('')

/**
 * The moments waiting in a sky response: the points it lists as
 * unacknowledged, in the order it listed them.
 *
 * The backend lists only observed lightings; this keeps to observed ones
 * again, so the backfill's can never be celebrated whatever reaches the
 * browser. A listed id with no star in the response, or no `litAt`, is
 * dropped: there is nothing to celebrate and nowhere to celebrate it.
 *
 * `recommended` is left out. stoa-backend#71 does not say whether a point was
 * its subject's recommendation when it was lit, and the field is optional:
 * without it the marker is drawn where the map says from the first frame.
 */
export function litEventsOf(sky: KnowledgeMapResponse | undefined): LitEvent[] {
  if (!sky?.unacknowledgedLit?.length) return []
  const stars = new Map(sky.stars.map((star) => [star.unitId, star]))
  return sky.unacknowledgedLit.flatMap((unitId) => {
    const star = stars.get(unitId)
    if (!star?.litAt || star.litAtSource !== 'observed') return []
    return [{ unitId, litAt: star.litAt, litAtSource: star.litAtSource }]
  })
}

export function createReadModelLightingSource(client: QueryClient): LightingEventSource {
  const sky = () => client.getQueryData<KnowledgeMapResponse>(SKY_KEY)

  /**
   * What is waiting, now, without asking (#140). Empty until the sky lands,
   * and that is the honest answer: the sky and this list arrive in the same
   * response, so while there is nothing here there are no stars either. The
   * first frame a point exists is the first frame it is known to be waiting,
   * which is what the map needs to draw it in progress until its flare peaks.
   */
  const known = () => litEventsOf(sky())

  /** Drop what the server has taken, so a cached sky does not replay the celebration. */
  const forget = (unitIds: readonly string[]) => {
    if (unitIds.length === 0) return
    const taken = new Set(unitIds)
    client.setQueryData<KnowledgeMapResponse>(SKY_KEY, (before) =>
      before
        ? { ...before, unacknowledgedLit: (before.unacknowledgedLit ?? []).filter((id) => !taken.has(id)) }
        : before,
    )
  }

  return {
    unacknowledged: async () => known(),
    known,
    subscribe: (onChange) => {
      const key = hashKey(SKY_KEY)
      return client.getQueryCache().subscribe((event) => {
        if (event.query.queryHash === key) onChange()
      })
    },
    acknowledge: async (unitIds) => {
      const ids = [...new Set(unitIds)]
      const confirmed: string[] = []
      try {
        for (let from = 0; from < ids.length; from += ACKNOWLEDGE_LIMIT) {
          confirmed.push(...(await acknowledgeLitUnits(ids.slice(from, from + ACKNOWLEDGE_LIMIT))))
        }
      } catch (error) {
        // The moment has already been shown; only the record of it did not get
        // through. Left unacknowledged it may be celebrated again next time,
        // which is the better of the two failures -- the other one is never.
        logger.warn('lighting.acknowledge.failed', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
          waiting: ids.length - confirmed.length,
        })
      }
      forget(confirmed)
    },
  }
}

/**
 * Put the read model behind the lighting moment for everything under it.
 *
 * Mounted once, around the signed-in application, beside the star map's own
 * source: both read the one sky query, so neither asks for a sky twice.
 */
export function LightingEventsProvider({ children }: { children: ReactNode }) {
  // Somebody above may already have supplied a source - the design preview, a
  // test. Without yielding, the read model's would silently replace theirs.
  const provided = useLightingEventSource()
  const client = useQueryClient()
  const source = useMemo(() => createReadModelLightingSource(client), [client])
  if (provided !== emptyLightingEventSource) return <>{children}</>
  return <LightingEventSourceContext.Provider value={source}>{children}</LightingEventSourceContext.Provider>
}
