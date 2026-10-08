import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/base/Button'
import { ROW } from '@/components/base/sizes'
import { TextField } from '@/components/base/TextField'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { updateStudentProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'

/** Where Ask's blank-grade hint lands (#154). */
export const GRADE_SECTION_ID = 'me-grade'

/*
 * A student's year group, the one profile field a student sets: it decides
 * how deep an answer goes (stoasystem/stoa-backend#19), and a blank one leaves
 * the backend to guess (`UNKNOWN_GRADE`, #50). Free text, as the profile has
 * always taken it; `PATCH /students/me/profile` with `grade` only.
 */
export function GradeGroup() {
  const { t } = useTranslation('common')
  const profile = useStudentProfileQuery()
  const queryClient = useQueryClient()
  const location = useLocation()
  const field = useRef<HTMLInputElement>(null)
  const stored = profile.data?.grade ?? ''
  const [value, setValue] = useState<string | null>(null)
  const draft = value ?? stored

  const save = useMutation({
    mutationFn: (grade: string) => updateStudentProfile({ grade }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentQueryKeys.profile() })
      setValue(null)
    },
  })

  // Ask's hint lands here, with the field ready to type in.
  useEffect(() => {
    if (location.hash !== `#${GRADE_SECTION_ID}` || !profile.data) return
    field.current?.scrollIntoView?.({ block: 'center' })
    field.current?.focus({ preventScroll: true })
  }, [location.hash, profile.data])

  function submit(event: FormEvent) {
    event.preventDefault()
    const grade = draft.trim()
    if (grade === stored.trim() || save.isPending) return
    save.mutate(grade)
  }

  const unchanged = draft.trim() === stored.trim()

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
        {profile.isError ? (
          <p className="m-0 text-[15px] leading-[1.45] text-caption">{t('me.grade.unavailable')}</p>
        ) : (
          <form className="grid max-w-md gap-4" onSubmit={submit} noValidate>
            <TextField
              ref={field}
              id="me-grade-field"
              label={t('me.grade.label')}
              hint={t('me.grade.hint')}
              value={draft}
              maxLength={40}
              disabled={!profile.data}
              onChange={(event) => {
                setValue(event.target.value)
                if (save.isSuccess || save.isError) save.reset()
              }}
            />
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={!profile.data || unchanged || save.isPending}>
                {save.isPending ? t('actions.saving') : t('me.grade.save')}
              </Button>
              {save.isSuccess && (
                <p className="m-0 text-[13px] leading-[1.35] text-caption" role="status">
                  {t('me.grade.saved')}
                </p>
              )}
            </div>
            {save.isError && (
              <p className="m-0 text-[13px] leading-[1.35] text-red" role="alert">
                {t('me.grade.saveFailed')}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
