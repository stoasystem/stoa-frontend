import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError, invalidFieldClass } from '@/components/auth/FieldError'
import type { TeacherOnboardingProfile } from '@/types/onboarding'

export type TeacherProfileErrors = Partial<Record<'subjects' | 'educationBackground' | 'introduction', string>>

export function TeacherProfileStep({
  value,
  subjectText,
  errors = {},
  onChange,
  onSubjectTextChange,
}: {
  value: TeacherOnboardingProfile
  subjectText: string
  errors?: TeacherProfileErrors
  onChange: (values: Partial<TeacherOnboardingProfile>) => void
  onSubjectTextChange: (value: string) => void
}) {
  const { t } = useTranslation('auth')

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="teacher-subjects">{t('register.teachingSubjects')}</Label>
          <Input
            id="teacher-subjects"
            className={errors.subjects ? invalidFieldClass : undefined}
            aria-invalid={Boolean(errors.subjects)}
            aria-describedby={errors.subjects ? 'teacher-subjects-error' : undefined}
            value={subjectText}
            onChange={(event) => onSubjectTextChange(event.target.value)}
            placeholder="Mathematics, Physics"
          />
          <FieldError id="teacher-subjects-error" message={errors.subjects} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="teacher-years">{t('register.yearsExperience')}</Label>
          <Input id="teacher-years" type="number" min={0} value={value.yearsOfExperience ?? ''} onChange={(event) => onChange({ yearsOfExperience: Number(event.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="teacher-education">{t('register.educationBackground')}</Label>
        <Input
          id="teacher-education"
          className={errors.educationBackground ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.educationBackground)}
          aria-describedby={errors.educationBackground ? 'teacher-education-error' : undefined}
          value={value.educationBackground}
          onChange={(event) => onChange({ educationBackground: event.target.value })}
          placeholder="MSc Mathematics, ETH Zurich"
        />
        <FieldError id="teacher-education-error" message={errors.educationBackground} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="teacher-intro">{t('register.introduction')}</Label>
        <Textarea
          id="teacher-intro"
          value={value.introduction}
          onChange={(event) => onChange({ introduction: event.target.value })}
          aria-invalid={Boolean(errors.introduction)}
          aria-describedby={errors.introduction ? 'teacher-intro-error' : undefined}
          className={`min-h-28 resize-none ${errors.introduction ? invalidFieldClass : ''}`}
        />
        <FieldError id="teacher-intro-error" message={errors.introduction} />
      </div>
    </div>
  )
}
