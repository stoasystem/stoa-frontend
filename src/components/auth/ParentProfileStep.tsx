import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError, invalidFieldClass } from '@/components/auth/FieldError'
import { MAX_AGE, MIN_AGE, normalizeAgeInput } from '@/lib/validation'
import type { ParentOnboardingProfile } from '@/types/onboarding'

export type ParentProfileErrors = Partial<Record<'childName' | 'childAge' | 'childGrade' | 'subjects', string>>

export function ParentProfileStep({
  value,
  subjectText,
  errors = {},
  onChange,
  onSubjectTextChange,
}: {
  value: ParentOnboardingProfile
  subjectText: string
  errors?: ParentProfileErrors
  onChange: (values: Partial<ParentOnboardingProfile>) => void
  onSubjectTextChange: (value: string) => void
}) {
  const { t } = useTranslation('auth')

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="child-name">{t('register.childName')}</Label>
        <Input
          id="child-name"
          className={errors.childName ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.childName)}
          aria-describedby={errors.childName ? 'child-name-error' : undefined}
          value={value.childName}
          onChange={(event) => onChange({ childName: event.target.value })}
        />
        <FieldError id="child-name-error" message={errors.childName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-age">{t('register.age')}</Label>
        <Input
          id="child-age"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={String(MAX_AGE).length}
          className={errors.childAge ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.childAge)}
          aria-describedby={errors.childAge ? 'child-age-error' : 'child-age-hint'}
          value={value.childAge === null || value.childAge === undefined ? '' : String(value.childAge)}
          onChange={(event) => {
            const digits = normalizeAgeInput(event.target.value)
            onChange({ childAge: digits === '' ? null : Number(digits) })
          }}
        />
        {errors.childAge ? (
          <FieldError id="child-age-error" message={errors.childAge} />
        ) : (
          <p id="child-age-hint" className="text-xs leading-5 text-muted-foreground">
            {t('register.ageHint', { min: MIN_AGE, max: MAX_AGE })}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-grade">{t('register.grade')}</Label>
        <Input
          id="child-grade"
          className={errors.childGrade ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.childGrade)}
          aria-describedby={errors.childGrade ? 'child-grade-error' : undefined}
          value={value.childGrade}
          onChange={(event) => onChange({ childGrade: event.target.value })}
        />
        <FieldError id="child-grade-error" message={errors.childGrade} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-school">{t('register.childSchool')}</Label>
        <Input id="child-school" value={value.childSchool ?? ''} onChange={(event) => onChange({ childSchool: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-subjects">{t('register.subjects')}</Label>
        <Input
          id="child-subjects"
          className={errors.subjects ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.subjects)}
          aria-describedby={errors.subjects ? 'child-subjects-error' : undefined}
          value={subjectText}
          onChange={(event) => onSubjectTextChange(event.target.value)}
          placeholder="Mathematics, English"
        />
        <FieldError id="child-subjects-error" message={errors.subjects} />
      </div>
    </div>
  )
}
