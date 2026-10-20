/*
 * The star map for the current route (#47, #72): reads the subject, nebula
 * and star from the path, gets the map's data, and mounts the renderer. It
 * paints nothing around itself -- the page supplies the sky surface (today
 * `AppLayout surface="sky"`, and `AskHost` once Ask lands, #49) and the map
 * fills whatever box it is given, following that box's size.
 *
 * The data comes from the star map source (`starMapSource.ts`, #131; the
 * read model since #48). Until the sky is here the route shows a skeleton,
 * if it could not be read an error with a retry, and for a sky that came back
 * empty an empty state, each instead of the renderer (#329); the Demo notice
 * shows only when the source says its map is demo content (the design
 * preview, the bench).
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { LightingOverlay } from '@/features/starmap/lighting/LightingOverlay'
import { useLightingStage } from '@/features/starmap/lighting/useLightingStage'
import { DEFAULT_SUBJECT_ID, DEMO_STAR_COUNT, fixtureSizeFrom, foveationFrom, useStarMap } from '@/features/starmap/useStarMap'
import { pathForTarget, resolveTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { markLoginFirstScreenReady } from '@/lib/loginTiming'
import { subjectOfNebula } from '@/features/starmap/model/starMap'
import { defaultSubject, useStarMapSource } from '@/features/starmap/starMapSource'
import { useAuthStore } from '@/store/authStore'
import { useStarMapStore } from '@/store/starMapStore'

export function StarMapRoute({ relations = false, longNames = false }: { relations?: boolean; longNames?: boolean } = {}) {
  const params = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const ownerId = useAuthStore((state) => state.user?.id) ?? 'demo'
  const lastSubject = useStarMapStore((state) => state.lastSubjects[ownerId])
  const remember = useStarMapStore((state) => state.remember)
  const defaults = useStarMap(DEFAULT_SUBJECT_ID, fixtureSizeFrom(search, DEMO_STAR_COUNT))
  const subjectId = params.subjectId ?? defaultSubject(lastSubject, defaults.subjects)
  const map = useStarMap(subjectId, fixtureSizeFrom(search, DEMO_STAR_COUNT),
    relations, longNames)
  const { demo, status = 'success', retry } = useStarMapSource()
  useEffect(() => {
    if (map.subjects.some((s) => s.subjectId === map.subject.subjectId) && lastSubject !== map.subject.subjectId) {
      remember(ownerId, map.subject.subjectId)
    }
  }, [map, lastSubject, ownerId, remember])
  const { topicId, unitId } = params
  const routeTarget = useMemo(() => resolveTarget(map, topicId, unitId), [map, topicId, unitId])
  // A point waiting for its lighting moment is drawn in progress until it, and its star's route
  // (or a tap on it) opens on its nebula (#140, #145).
  const stage = useLightingStage(map, routeTarget)

  // Sign-in timing, handed over from ChatPage / LearnPage (#45): a student
  // lands on the map now, so its first drawn frame ends the wait. The mark is
  // a no-op unless a sign-in started the clock, and clears it once made.
  const landedAt = useRef(location.pathname)
  const onFirstFrame = useCallback(() => markLoginFirstScreenReady(landedAt.current), [])

  // A nebula or star lives under its own galaxy's route: one sky, so it may be another subject's.
  const onNavigate = useCallback(
    (next: LayerTarget) =>
      navigate({ pathname: pathForTarget(next.layer === 'map' ? map.subject.subjectId : subjectOfNebula(map, next.nebulaId), next), search: location.search }),
    [navigate, map, location.search],
  )
  // Panned to another galaxy: the route (and with it the header and the switcher) follows, in place.
  const onCentreGalaxy = useCallback(
    (id: string) => {
      if (id !== map.subject.subjectId) navigate({ pathname: pathForTarget(id, { layer: 'map' }), search: location.search }, { replace: true })
    },
    [navigate, map.subject.subjectId, location.search],
  )

  // Neither a skeleton nor an error is the first screen a student signing in waits for: the clock runs on.
  if (status === 'pending') return <StarMapLoading />
  if (status === 'error') return <StarMapError onRetry={retry} />
  if (map.subjects.length === 0) return <EmptyStarMap onShown={onFirstFrame} />

  return (
    <StarMapView demo={demo} map={stage.map} target={stage.target} onNavigate={onNavigate} land={stage.land} onFirstFrame={onFirstFrame} onCentreGalaxy={onCentreGalaxy} foveate={search.has('foveation') ? foveationFrom(search) : false}
      overlay={(locate) => <LightingOverlay map={map} locate={locate} onReveal={stage.reveal} />} />
  )
}

/** The sky is still on the wire (#329): the dark it will be drawn on, and a word for a screen reader. */
function StarMapLoading() {
  const { t } = useTranslation('starmap')
  return (
    <section data-starmap-loading aria-busy="true" className="flex h-full min-h-0 w-full flex-1 items-center justify-center p-6">
      <span aria-hidden="true" className="block size-3 rounded-full bg-[color:var(--on-sky-text-caption)] opacity-60 motion-safe:animate-pulse" />
      <p role="status" className="sr-only">{t('loadingSky')}</p>
    </section>
  )
}

/** The sky could not be read (#329): say so, and let the student ask again. */
function StarMapError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation('starmap')
  return (
    <section data-starmap-error role="alert" aria-labelledby="starmap-error-title" className="flex h-full min-h-0 w-full flex-1 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <h1 id="starmap-error-title" className="m-0 text-[17px] font-semibold text-[color:var(--on-sky-text)]">{t('skyError.title')}</h1>
        <p className="mt-2 mb-0 text-[14px] text-[color:var(--on-sky-text-body)]">{t('skyError.body')}</p>
        {onRetry && (
          <Button variant="onSky" size="regular" className="mt-4" onClick={onRetry}>
            {t('skyError.retry')}
          </Button>
        )}
      </div>
    </section>
  )
}

/** The sky came back with nothing in it (#131, #329): no subject has knowledge points yet. */
function EmptyStarMap({ onShown }: { onShown: () => void }) {
  const { t } = useTranslation('starmap')
  // Nothing will be drawn, so this is the first screen a student signing in waits for.
  useEffect(() => {
    onShown()
  }, [onShown])
  return (
    <section data-starmap-empty aria-labelledby="starmap-empty-title" className="flex h-full min-h-0 w-full flex-1 items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <h1 id="starmap-empty-title" className="m-0 text-[17px] font-semibold text-[color:var(--on-sky-text)]">{t('emptySky.title')}</h1>
        <p className="mt-2 mb-0 text-[14px] text-[color:var(--on-sky-text-body)]">{t('emptySky.body')}</p>
      </div>
    </section>
  )
}
