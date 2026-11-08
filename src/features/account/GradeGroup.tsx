import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/base/Button'
import { ChoiceSelect } from '@/components/base/ChoiceSelect'
import { ROW } from '@/components/base/sizes'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { PROFILE_CHOICE_UNKNOWN, readableGrade } from '@/lib/profileChoices'
import { ApiError } from '@/services/api/httpClient'
import { updateStudentProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'
import type { StudentProfile } from '@/types/student'

/** Where Ask's blank-grade hint lands (#154). */
export const GRADE_SECTION_ID = 'me-grade'

/*
 * A student's year group: it decides how deep an answer goes
 * (stoasystem/stoa-backend#19), and where a newcomer's star map starts
 * (stoa-backend#310); a blank one leaves the backend to guess (`UNKNOWN_GRADE`,
 * #50). Chosen from the backend's own list (`choices.grade`, #591), and stored
 * as its code: `PATCH /students/me/profile` with `grade` only. Old free text
 * the backend cannot read shows as nothing chosen.
 */
export function GradeGroup() {
  const { t } = useTranslation('common')
  const profile = useStudentProfileQuery()
  const queryClient = useQueryClient()
  const location = useLocation()
  const field = useRef<HTMLSelectElement>(null)
  const choices = profile.data?.choices?.grade ?? []
  const stored = profile.data ? readableGrade(profile.data) : ''
  const [value, setValue] = useState<string | null>(null)
  const draft = value ?? stored

  const save = useMutation({
    mutationFn: (grade: string) => updateStudentProfile({ grade }),
    onSuccess: async (_profile, grade) => {
      // The saved grade first: if the read after it fails, the field would
      // otherwise go back to the one from before, beside "Saved" (#457).
      queryClient.setQueryData<StudentProfile>(studentQueryKeys.profile(), (held) => held && { ...held, grade })
      await queryClient.invalidateQueries({ queryKey: studentQueryKeys.profile() })
      setValue(null)
    },
    onError: (error) => {
      // The list changed under the page: read it again, so the field offers what the backend takes now.
      if (error instanceof ApiError && error.code === PROFILE_CHOICE_UNKNOWN) void queryClient.invalidateQueries({ queryKey: studentQueryKeys.profile() })
    },
  })
  const unknownChoice = save.error instanceof ApiError && save.error.code === PROFILE_CHOICE_UNKNOWN

  // Ask's hint lands here, with the field ready to choose from.
  useEffect(() => {
    if (location.hash !== `#${GRADE_SECTION_ID}` || !profile.data) return
    field.current?.scrollIntoView?.({ block: 'center' })
    field.current?.focus({ preventScroll: true })
  }, [location.hash, profile.data])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (draft === stored || save.isPending) return
    save.mutate(draft)
  }

  const unchanged = draft === stored
  // Only a profile never read takes the form's place: one on hand stays when
  // it cannot be read again (#457). A backend with no list has nothing to choose from.
  const unavailable = (profile.isError && !profile.data) || (profile.data !== undefined && choices.length === 0)

  return (
    <section id={GRADE_SECTION_ID} aria-labelledby="me-grade-heading" className="flex scroll-mt-20 flex-col">
      <h2
        id="me-grade-heading"
        className="m-0 text-caption uppercase"
        style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)', padding: '0 16px 8px' }}
      >
        {t('me.grade.heading')}
      </h2>
      <div
        className="flex flex-col gap-4 border border-[color:var(--card-border)] bg-surface"
        style={{ borderRadius: ROW.groupRadius, padding: ROW.paddingX }}
      >
        {unavailable ? (
          <p className="m-0 text-[15px] leading-[1.45] text-caption">{t('me.grade.unavailable')}</p>
        ) : (
          <form className="grid max-w-md gap-4" onSubmit={submit} noValidate>
            <ChoiceSelect
              ref={field}
              id="me-grade-field"
              label={t('me.grade.label')}
              hint={t('me.grade.hint')}
              placeholder={t('me.grade.none')}
              choices={choices}
              value={draft}
              disabled={!profile.data}
              error={save.isError ? (unknownChoice ? t('me.grade.unknownChoice') : t('me.grade.saveFailed')) : undefined}
              onChange={(code) => {
                setValue(code)
                if (save.isSuccess || save.isError) save.reset()
              }}
            />
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={!profile.data || unchanged || save.isPending}>
                {save.isPending ? t('actions.saving') : t('me.grade.save')}
              </Button>
              {/* Always mounted, only its text changes: a live region added
                  together with its words is not announced (#410). */}
              <p className="m-0 text-[13px] leading-[1.35] text-caption" role="status">
                {save.isSuccess ? t('me.grade.saved') : null}
              </p>
            </div>
            {/* The field names its error too (`aria-describedby`); this says it as it happens. */}
            {save.isError && (
              <p className="sr-only" role="alert">
                {unknownChoice ? t('me.grade.unknownChoice') : t('me.grade.saveFailed')}
              </p>
            )}
            {profile.isError && (
              <p className="m-0 text-[13px] leading-[1.35] text-red" role="alert">
                {t('me.grade.refreshFailed')}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
