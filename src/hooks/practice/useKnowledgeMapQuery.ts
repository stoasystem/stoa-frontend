import { useQuery } from '@tanstack/react-query'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { useAuthStore } from '@/store/authStore'

/** How long a sky stays fresh. Learning states move when a lesson is finished,
 *  not between two glances at the map, so this is minutes rather than seconds. */
export const KNOWLEDGE_MAP_STALE_MS = 2 * 60 * 1000

/** The sky's one cache entry: the star map, the chapter, the lighting moment and an answer all name it so. */
export const KNOWLEDGE_MAP_KEY = practiceQueryKeys.knowledgeMap('')

/**
 * Whether this account has a sky to read: a signed-in student, and not while
 * an administrator's reset stands (#412). The skeleton and the stars around
 * one (#503) ask the same question.
 */
export function useHasSky() {
  return useAuthStore(
    (state) => Boolean(state.isAuthenticated) && state.user?.role === 'student' && !state.user.mustChangePassword,
  )
}

/**
 * `GET /practice/knowledge-map`, the whole sky: the one definition of the
 * query the star map (`readModelSource.tsx`) and the chapter read, so they
 * share one cache and one set of options (#368). Only a student has a sky.
 *
 * Not while an administrator's reset stands: the backend refuses everything
 * but the password change, and the refusal, kept, met the student as "Your
 * star map didn't load" on the first page after the change (#412). The read
 * starts once the change goes through and clears the flag.
 *
 * Not keyed by subject: the galaxy in focus is a projection of the whole
 * sky, and a key per subject would make every switch of galaxy a fetch.
 */
export function useKnowledgeMapQuery() {
  const hasSky = useHasSky()
  return useQuery({
    queryKey: KNOWLEDGE_MAP_KEY,
    queryFn: () => getKnowledgeMap(),
    enabled: hasSky,
    staleTime: KNOWLEDGE_MAP_STALE_MS,
    // A sky that could not be read is not worth hammering the API for: the
    // star map offers the student a retry, and the chapter goes on without it.
    retry: 1,
  })
}
