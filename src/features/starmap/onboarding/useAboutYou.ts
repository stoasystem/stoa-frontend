/*
 * "About you" (#591): before a student's first landing, the year group and the
 * subjects school is on, so the backend can recommend where to start by year
 * (stoa-backend#310) in the subjects ticked (stoa-backend#321).
 *
 * Asked of a student whose profile has no year group the backend can read:
 * none said, or old text that is in no list (`choices.grade`). Only the
 * server's profile decides, as the first landing reads only the server's sky
 * (ADR 0003): nothing records that it was seen. "Later" (or Escape) is kept
 * for this tab only, per account, in sessionStorage, like the first landing's
 * own "Look around first"; a new tab asks again until a year group is saved.
 *
 * The first landing waits for it (`hold`): while the profile is still being
 * read (its ticked subjects steer the landing too), while the question is up, and, once answered, until the save is done
 * and the sky has been read again, so the camera lands on the star the
 * backend now recommends for that year. A save that fails says so in place;
 * "Later" still lets the student on to the map.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { readableChoice } from '@/components/base/ChoiceSelect'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { KNOWLEDGE_MAP_KEY } from '@/hooks/practice/useKnowledgeMapQuery'
import { updateStudentProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'
import type { ProfileChoice, StudentProfile } from '@/types/student'

const LATER_KEY = 'stoa.starmap.aboutYou.later'

export type AboutYouAnswer = { grade: string; subjects: readonly string[] }

export type AboutYou = {
  /** The question is up: the year groups to choose from. Null when it is not. */
  grades: readonly ProfileChoice[] | null
  /** The subjects the profile already ticks, to tick again; null when it says none or could not be read. */
  subjects: readonly string[] | null
  /** The first landing waits (see above). */
  hold: boolean
  /** Saving the answer, and reading the sky again after it. */
  saving: boolean
  /** The last save failed. */
  failed: boolean
  save: (answer: AboutYouAnswer) => void
  /** "Later", or Escape: not asked again in this tab. */
  later: () => void
}

/** "Later" for `ownerId`, as the button leaves it: for this tab. */
export function putAboutYouOff(ownerId: string) {
  writeTab(`${LATER_KEY}.${ownerId}`, '1')
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
    // Storage refused: the question simply comes back next time.
  }
}

/** Whether `profile` has a year group the backend can read: one of its own codes. */
export function hasReadableGrade(profile: Pick<StudentProfile, 'grade' | 'choices'>): boolean {
  return readableChoice(profile.choices?.grade, profile.grade) !== ''
}

/**
 * Whether "About you" asks this profile: a list to choose from (a backend
 * from stoa-backend#310 on) and no year group in it.
 */
export function asksAboutYou(profile: Pick<StudentProfile, 'grade' | 'choices'>): boolean {
  return (profile.choices?.grade.length ?? 0) > 0 && !hasReadableGrade(profile)
}

export function useAboutYou(student: boolean, ownerId: string): AboutYou {
  const laterKey = `${LATER_KEY}.${ownerId}`
  const [laterSaid, setLaterSaid] = useState(() => readTab(laterKey) === '1')
  const [answered, setAnswered] = useState(false)
  const asking = student && !laterSaid && !answered
  // Read for every student: the subjects it ticks steer the first landing too (`useFirstLanding`).
  const profile = useStudentProfileQuery({ enabled: student })
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ grade, subjects }: AboutYouAnswer) => updateStudentProfile({ grade, primarySubjects: [...subjects] }),
    onSuccess: async (saved) => {
      queryClient.setQueryData<StudentProfile>(studentQueryKeys.profile(), (held) => (held ? { ...held, ...saved } : saved))
      // The recommendation follows the year and the subjects: the sky is read again before the landing.
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_MAP_KEY })
      setAnswered(true)
    },
  })

  const later = useCallback(() => {
    writeTab(laterKey, '1')
    setLaterSaid(true)
  }, [laterKey])
  const { mutate } = mutation
  const save = useCallback((answer: AboutYouAnswer) => mutate(answer), [mutate])

  const data = profile.data
  // Once asked, the question stays up while its answer is saved: the saved profile has a year group.
  const open = asking && data !== undefined && (mutation.isPending || asksAboutYou(data))
  // A profile that cannot be read asks nothing and holds nothing up.
  const reading = student && profile.isPending
  return {
    grades: open ? (data?.choices?.grade ?? []) : null,
    subjects: data?.primarySubjects?.length ? data.primarySubjects : null,
    hold: reading || open,
    saving: mutation.isPending,
    failed: mutation.isError,
    save,
    later,
  }
}
