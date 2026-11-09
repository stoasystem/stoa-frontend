import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base/Button'
import { ChoiceSelect, readableChoice } from '@/components/base/ChoiceSelect'
import { ROW } from '@/components/base/sizes'
import { Murmi } from '@/components/brand/Murmi'
import { answerStyleMurmiMood } from '@/components/brand/answerStyleMurmi'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { ApiError } from '@/services/api/httpClient'
import { updateStudentProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'
import type { StudentProfile } from '@/types/student'

/** The style a student who never chose one has, and what "" saves as (stoa-backend#314). */
export const DEFAULT_ANSWER_STYLE = 'standard'

/** The codes this client has a line for; one the backend adds later shows no line until it has one. */
const ABOUT_KEYS: Readonly<Record<string, string>> = {
  standard: 'me.answerStyle.about.standard',
  concise: 'me.answerStyle.about.concise',
  encouraging: 'me.answerStyle.about.encouraging',
  vivid: 'me.answerStyle.about.vivid',
}

/** 422 `profile_choice_unknown`: the style is in no list the backend has, and nothing in the request was saved. */
function refusedAsUnknown(error: unknown) {
  return error instanceof ApiError && error.code === 'profile_choice_unknown'
}

/*
 * How the AI explains things to a student (#597, stoa-backend#314): one of
 * the backend's styles (`choices.answerStyle`, codes, order and names in the
 * request's language), the same dropdown as the year group (#591). A style
 * changes the tone and the way of explaining only: the answer language, its
 * length and "no final answer" stay, so nothing here says a style answers
 * sooner or more directly. The student's own, and only theirs: `/me` mounts
 * it for a student, and no other role's page sends `answerStyle`.
 *
 * `PATCH /students/me/profile` with `answerStyle` only. Murmi beside the
 * field takes the pose of the style chosen (`answerStyleMurmiMood`, #610).
 */
export function AnswerStyleGroup() {
  const { t } = useTranslation('common')
  const profile = useStudentProfileQuery()
  const queryClient = useQueryClient()
  const choices = profile.data?.choices?.answerStyle ?? []
  const stored = readableChoice(choices, profile.data?.answerStyle) || (choices.length ? DEFAULT_ANSWER_STYLE : '')
  const [value, setValue] = useState<string | null>(null)
  const draft = value ?? stored

  const save = useMutation({
    mutationFn: (answerStyle: string) => updateStudentProfile({ answerStyle }),
    onSuccess: async (_profile, answerStyle) => {
      // The saved style first, so a failed read after it does not put the old one back beside "Saved" (#457).
      queryClient.setQueryData<StudentProfile>(studentQueryKeys.profile(), (held) => held && { ...held, answerStyle })
      await queryClient.invalidateQueries({ queryKey: studentQueryKeys.profile() })
      setValue(null)
    },
    // A code the backend no longer offers: read its list again.
    onError: (error) => {
      if (refusedAsUnknown(error)) void queryClient.invalidateQueries({ queryKey: studentQueryKeys.profile() })
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (draft === stored || save.isPending) return
    save.mutate(draft)
  }

  const unchanged = draft === stored
  const aboutKey = ABOUT_KEYS[draft]

  // A backend before stoa-backend#314 offers no styles: nothing to choose from, so no section.
  if (profile.data && !choices.length) return null

  return (
    <section aria-labelledby="me-answer-style-heading" className="flex flex-col">
      <h2
        id="me-answer-style-heading"
        className="m-0 text-caption uppercase"
        style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)', padding: '0 16px 8px' }}
      >
        {t('me.answerStyle.heading')}
      </h2>
      <div
        className="flex flex-col gap-4 border border-[color:var(--card-border)] bg-surface"
        style={{ borderRadius: ROW.groupRadius, padding: ROW.paddingX }}
      >
        {profile.isError && !profile.data ? (
          <p className="m-0 text-[15px] leading-[1.45] text-caption">{t('me.answerStyle.unavailable')}</p>
        ) : (
          <form className="grid max-w-md gap-4" onSubmit={submit} noValidate>
            <div className="flex items-start gap-3">
              <Murmi mood={answerStyleMurmiMood(draft)} size={56} className="shrink-0" />
              <ChoiceSelect
                id="me-answer-style-field"
                className="flex-1"
                label={t('me.answerStyle.label')}
                hint={aboutKey ? t(aboutKey) : undefined}
                placeholder={t('me.answerStyle.placeholder')}
                choices={choices}
                value={draft}
                disabled={!profile.data}
                onChange={(code) => {
                  // The empty first option is no style of its own: "" is the default one.
                  setValue(code || DEFAULT_ANSWER_STYLE)
                  if (save.isSuccess || save.isError) save.reset()
                }}
              />
            </div>
            <p className="m-0 text-[13px] leading-[1.35] text-caption">{t('me.answerStyle.note')}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={!profile.data || unchanged || save.isPending}>
                {save.isPending ? t('actions.saving') : t('me.answerStyle.save')}
              </Button>
              {/* Always mounted, only its text changes: a live region added with its words is not announced (#410). */}
              <p className="m-0 text-[13px] leading-[1.35] text-caption" role="status">
                {save.isSuccess ? t('me.answerStyle.saved') : null}
              </p>
            </div>
            {save.isError && (
              <p className="m-0 text-[13px] leading-[1.35] text-red" role="alert">
                {refusedAsUnknown(save.error) ? t('me.answerStyle.unknown') : t('me.answerStyle.saveFailed')}
              </p>
            )}
            {profile.isError && profile.data && (
              <p className="m-0 text-[13px] leading-[1.35] text-red" role="alert">
                {t('me.answerStyle.refreshFailed')}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
