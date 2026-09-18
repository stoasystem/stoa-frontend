import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError, invalidFieldClass } from '@/components/auth/FieldError'
import type { TutorOnboardingProfile } from '@/types/onboarding'

export type TutorProfileErrors = Partial<Record<'subjects' | 'educationBackground' | 'introduction', string>>

export function TutorProfileStep({
  value,
  subjectText,
  errors = {},
  onChange,
  onSubjectTextChange,
}: {
  value: TutorOnboardingProfile
  subjectText: string
  errors?: TutorProfileErrors
  onChange: (values: Partial<TutorOnboardingProfile>) => void
  onSubjectTextChange: (value: string) => void
}) {
  const { t } = useTranslation('auth')

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tutor-subjects">{t('register.teachingSubjects')}</Label>
          <Input
            id="tutor-subjects"
            className={errors.subjects ? invalidFieldClass : undefined}
            aria-invalid={Boolean(errors.subjects)}
            aria-describedby={errors.subjects ? 'tutor-subjects-error' : undefined}
            value={subjectText}
            onChange={(event) => onSubjectTextChange(event.target.value)}
            placeholder="Mathematics, Physics"
          />
          <FieldError id="tutor-subjects-error" message={errors.subjects} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tutor-years">{t('register.yearsExperience')}</Label>
          <Input id="tutor-years" type="number" min={0} value={value.yearsOfExperience ?? ''} onChange={(event) => onChange({ yearsOfExperience: Number(event.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tutor-education">{t('register.educationBackground')}</Label>
        <Input
          id="tutor-education"
          className={errors.educationBackground ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.educationBackground)}
          aria-describedby={errors.educationBackground ? 'tutor-education-error' : undefined}
          value={value.educationBackground}
          onChange={(event) => onChange({ educationBackground: event.target.value })}
          placeholder="MSc Mathematics, ETH Zurich"
        />
        <FieldError id="tutor-education-error" message={errors.educationBackground} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tutor-intro">{t('register.introduction')}</Label>
        <Textarea
          id="tutor-intro"
          value={value.introduction}
          onChange={(event) => onChange({ introduction: event.target.value })}
          aria-invalid={Boolean(errors.introduction)}
          aria-describedby={errors.introduction ? 'tutor-intro-error' : undefined}
          className={`min-h-28 resize-none ${errors.introduction ? invalidFieldClass : ''}`}
        />
        <FieldError id="tutor-intro-error" message={errors.introduction} />
      </div>
    </div>
  )
}
