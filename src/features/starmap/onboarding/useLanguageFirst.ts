/*
 * The language first (#627): before "About you", a student whose account has
 * never stored a language picks the one the app speaks to them in.
 *
 * Only the server decides, as for "About you" (ADR 0003): the student profile's
 * `preferredAnswerLanguage` is the stored `preferred_locale` as it is, null
 * when nothing was ever stored. Opening an account stores none; only the
 * student's own choice does (`PATCH /auth/me/preferences/locale`). `/auth/me`
 * cannot tell, as it fills an empty one with the backend's default.
 *
 * The browser's language is chosen to begin with (else the one on screen), and
 * the screen switches to it at once, as it does to every language picked: the
 * student reads the card in the language they are choosing. "Continue" stores
 * it, also when it is the one on screen already, or the question would come
 * back. There is no "Later". A store that fails goes on all the same, in the
 * language chosen, and says so (`useUpdateLocalePreferenceMutation`'s toast);
 * it is not asked again in this tab, and asked again in the next.
 *
 * "About you" and the first landing wait for it (`hold`): while the profile is
 * read, while the question is up, and while the choice is stored.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateLocalePreferenceMutation } from '@/hooks/auth/useUpdateLocalePreferenceMutation'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { activeLanguage, browserLanguage, isSupportedLanguage, type SupportedLanguage } from '@/i18n/languages'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'
import type { StudentProfile } from '@/types/student'

const DONE_KEY = 'stoa.starmap.languageFirst.done'

export type LanguageFirst = {
  /** The question is up. */
  open: boolean
  /** The language chosen on the card. */
  chosen: SupportedLanguage
  /** "About you" and the first landing wait (see above). */
  hold: boolean
  /** The choice is being stored. */
  saving: boolean
  /** Another language picked: the screen switches to it. */
  pick: (language: SupportedLanguage) => void
  /** "Continue": the language chosen is stored on the account. */
  confirm: () => void
}

/**
 * Whether the account behind `profile` has never stored a language of its own:
 * the backend sends the field, null then. A profile without the field at all
 * (a backend or a stand-in that does not say) is not asked.
 */
export function asksLanguage(profile: Pick<StudentProfile, 'preferredAnswerLanguage'>): boolean {
  const stored: string | null | undefined = profile.preferredAnswerLanguage
  return stored !== undefined && !isSupportedLanguage(stored)
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

export function useLanguageFirst(student: boolean, ownerId: string): LanguageFirst {
  const doneKey = `${DONE_KEY}.${ownerId}`
  const [doneHere, setDoneHere] = useState(() => readTab(doneKey) === '1')
  const profile = useStudentProfileQuery({ enabled: student })
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()
  const store = useUpdateLocalePreferenceMutation()
  const [first] = useState<SupportedLanguage>(() => browserLanguage() ?? activeLanguage())
  const [picked, setPicked] = useState<SupportedLanguage | null>(null)
  const chosen = picked ?? first

  const data = profile.data
  const open = student && !doneHere && data !== undefined && asksLanguage(data)

  // The card opens in the language chosen to begin with.
  const shownFirst = useRef(false)
  useEffect(() => {
    if (!open || shownFirst.current) return
    shownFirst.current = true
    if (i18n.language !== first) void i18n.changeLanguage(first)
  }, [open, first, i18n])

  const pick = useCallback(
    (language: SupportedLanguage) => {
      setPicked(language)
      if (i18n.language !== language) void i18n.changeLanguage(language)
    },
    [i18n],
  )

  const { mutate } = store
  const confirm = useCallback(() => {
    if (i18n.language !== chosen) void i18n.changeLanguage(chosen)
    mutate(chosen, {
      onSuccess: () => {
        queryClient.setQueryData<StudentProfile>(studentQueryKeys.profile(), (held) => (held ? { ...held, preferredAnswerLanguage: chosen } : held))
      },
      onError: () => {
        writeTab(doneKey, '1')
        setDoneHere(true)
      },
    })
  }, [chosen, doneKey, i18n, mutate, queryClient])

  // A profile that cannot be read asks nothing and holds nothing up.
  const reading = student && profile.isPending
  return { open, chosen, hold: reading || open, saving: store.isPending, pick, confirm }
}
