/*
 * When "About you" (#591) comes before the star map: a student, on the
 * galaxy (where the first landing is decided), whose profile holds no year
 * group from the backend's list. Read from the server's profile only, with
 * nothing stored about having seen it (as the first landing, ADR 0003); a
 * student who answered has a year group, and is not asked again.
 *
 * Decided once, on arrival, as soon as both the profile and the sky are here,
 * and before the map is mounted: the first landing decides on the map's
 * first render with the sky, and must decide on the sky as it is after the
 * answer. So "Done" saves the profile, reads the sky again -- the backend now
 * counts the ticked subjects as taken (stoa-backend#321) and recommends the
 * first star of the year (stoa-backend#310) -- and only then shows the map.
 *
 * "Later", and going on past a failed save, are kept for this tab
 * (sessionStorage, one key per account), as the first landing's "Look around
 * first" is: a reload or a way back to the map in this tab does not ask again.
 * A profile that cannot be read asks nothing: the map does not wait on it.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { AboutYou, type AboutYouAnswer, type AboutYouFailure } from '@/features/starmap/onboarding/AboutYou'
import { StarMapLoading } from '@/features/starmap/StarMapRoute'
import { useStarMapSource } from '@/features/starmap/starMapSource'
import { DEFAULT_SUBJECT_ID, DEMO_STAR_COUNT, fixtureSizeFrom, useStarMap } from '@/features/starmap/useStarMap'
import { KNOWLEDGE_MAP_KEY } from '@/hooks/practice/useKnowledgeMapQuery'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { markLoginFirstScreenReady } from '@/lib/loginTiming'
import { asksGrade, PROFILE_CHOICE_UNKNOWN } from '@/lib/profileChoices'
import { ApiError } from '@/services/api/httpClient'
import { updateStudentProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'
import { useAuthStore } from '@/store/authStore'
import type { StudentProfile } from '@/types/student'

/** This tab's record that `ownerId` went on past "About you" (sessionStorage). */
export function aboutYouPassedKey(ownerId: string) {
  return `stoa.starmap.aboutYou.passed.${ownerId}`
}

function readTab(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeTab(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Storage refused: the card simply comes back next time.
  }
}

type Phase = 'deciding' | 'asking' | 'passed'

/** "About you" in the map's place while it is asked; the map (`children`) once it is not. `enabled: false` never asks. */
export function AboutYouGate({ enabled = true, children }: { enabled?: boolean; children: ReactNode }) {
  const student = useAuthStore((state) => state.user?.role === 'student')
  const ownerId = useAuthStore((state) => state.user?.id) ?? 'demo'
  const { topicId, unitId } = useParams()
  const onGalaxy = !topicId && !unitId
  const passedKey = aboutYouPassedKey(ownerId)
  const wanted = enabled && student && onGalaxy && readTab(passedKey) !== '1'
  const profile = useStudentProfileQuery({ enabled: student })
  const { status: skyStatus = 'success' } = useStarMapSource()

  const [phase, setPhase] = useState<Phase>(wanted ? 'deciding' : 'passed')
  if (phase === 'deciding') {
    if (!wanted || profile.isError || skyStatus === 'error') setPhase('passed')
    else if (profile.data && skyStatus === 'success') setPhase(asksGrade(profile.data) ? 'asking' : 'passed')
  }

  const pass = () => {
    writeTab(passedKey, '1')
    setPhase('passed')
  }

  if (phase === 'deciding') return <StarMapLoading />
  if (phase === 'asking' && profile.data) return <AboutYouScreen profile={profile.data} onPass={pass} onEmptySky={() => setPhase('passed')} />
  return <>{children}</>
}

function AboutYouScreen({ profile, onPass, onEmptySky }: { profile: StudentProfile; onPass: () => void; onEmptySky: () => void }) {
  const [search] = useSearchParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const sky = useStarMap(DEFAULT_SUBJECT_ID, fixtureSizeFrom(search, DEMO_STAR_COUNT))
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<AboutYouFailure | null>(null)
  const alive = useRef(true)
  useEffect(() => {
    // Set again on every mount: StrictMode mounts twice in development.
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // A sky with nothing in it yet has no landing to prepare: its empty state says so (#329).
  const empty = sky.subjects.length === 0
  useEffect(() => {
    if (empty) onEmptySky()
  }, [empty, onEmptySky])

  // The first screen a student signing in waits for is this card now, not the map's first frame (#45).
  const landedAt = useRef(location.pathname)
  useEffect(() => {
    if (!empty) markLoginFirstScreenReady(landedAt.current)
  }, [empty])

  async function done(answer: AboutYouAnswer) {
    setSaving(true)
    setFailure(null)
    try {
      const saved = await updateStudentProfile({ ...(answer.grade ? { grade: answer.grade } : {}), primarySubjects: answer.primarySubjects })
      queryClient.setQueryData<StudentProfile>(studentQueryKeys.profile(), saved)
      // The sky as the answer makes it: the ticked subjects taken, the year's first star recommended.
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_MAP_KEY })
      if (alive.current) onPass()
    } catch (error) {
      if (!alive.current) return
      const unknownGrade = error instanceof ApiError && error.code === PROFILE_CHOICE_UNKNOWN
      // The list changed under the card: read it again, so the field offers what the backend takes now.
      if (unknownGrade) void queryClient.invalidateQueries({ queryKey: studentQueryKeys.profile() })
      setFailure(unknownGrade ? 'unknownGrade' : 'failed')
      setSaving(false)
    }
  }

  if (empty) return <StarMapLoading />
  return (
    <AboutYou
      grades={profile.choices?.grade ?? []}
      subjects={sky.subjects}
      primarySubjects={profile.primarySubjects ?? []}
      saving={saving}
      failure={failure}
      onDone={(answer) => void done(answer)}
      onLater={onPass}
    />
  )
}
