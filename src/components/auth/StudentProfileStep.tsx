import { useTranslation } from 'react-i18next'
import { languageOptions, type SupportedLanguage } from '@/i18n/languages'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError, invalidFieldClass } from '@/components/auth/FieldError'
import { MAX_AGE, MIN_AGE, isAdultAge, normalizeAgeInput } from '@/lib/validation'
import type { StudentOnboardingProfile } from '@/types/onboarding'

export type StudentProfileErrors = Partial<Record<'age' | 'school' | 'grade' | 'subjects' | 'parentName' | 'parentEmail', string>>

export function StudentProfileStep({
  value,
  subjectText,
  errors = {},
  onChange,
  onSubjectTextChange,
}: {
  value: StudentOnboardingProfile
  subjectText: string
  errors?: StudentProfileErrors
  onChange: (values: Partial<StudentOnboardingProfile>) => void
  onSubjectTextChange: (value: string) => void
}) {
  const { t } = useTranslation('auth')
  const parentOptional = isAdultAge(value.age)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="student-age">{t('register.age')}</Label>
        <Input
          id="student-age"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={String(MAX_AGE).length}
          className={errors.age ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.age)}
          aria-describedby={errors.age ? 'student-age-error' : 'student-age-hint'}
          value={value.age === null ? '' : String(value.age)}
          onChange={(event) => {
            const digits = normalizeAgeInput(event.target.value)
            onChange({ age: digits === '' ? null : Number(digits) })
          }}
        />
        {errors.age ? (
          <FieldError id="student-age-error" message={errors.age} />
        ) : (
          <p id="student-age-hint" className="text-xs leading-5 text-muted-foreground">
            {t('register.ageHint', { min: MIN_AGE, max: MAX_AGE })}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-grade">{t('register.grade')}</Label>
        <Input
          id="student-grade"
          className={errors.grade ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.grade)}
          aria-describedby={errors.grade ? 'student-grade-error' : undefined}
          value={value.grade}
          onChange={(event) => onChange({ grade: event.target.value })}
        />
        <FieldError id="student-grade-error" message={errors.grade} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="student-school">{t('register.school')}</Label>
        <Input
          id="student-school"
          className={errors.school ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.school)}
          aria-describedby={errors.school ? 'student-school-error' : undefined}
          value={value.school}
          onChange={(event) => onChange({ school: event.target.value })}
        />
        <FieldError id="student-school-error" message={errors.school} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-system">{t('register.schoolSystem')}</Label>
        <Input id="student-system" value={value.schoolSystem ?? ''} onChange={(event) => onChange({ schoolSystem: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-subjects">{t('register.subjects')}</Label>
        <Input
          id="student-subjects"
          className={errors.subjects ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.subjects)}
          aria-describedby={errors.subjects ? 'student-subjects-error' : undefined}
          value={subjectText}
          onChange={(event) => onSubjectTextChange(event.target.value)}
          placeholder="Mathematics, Physics"
        />
        <FieldError id="student-subjects-error" message={errors.subjects} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="student-answer-language">{t('register.answerLanguage')}</Label>
        <select
          id="student-answer-language"
          className="h-10 w-full rounded-md border border-border/80 bg-card/75 px-3 text-sm text-foreground focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
          value={value.preferredAnswerLanguage}
          onChange={(event) => onChange({ preferredAnswerLanguage: event.target.value as SupportedLanguage })}
        >
          {languageOptions.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
        <p className="text-xs leading-5 text-muted-foreground">{t('register.answerLanguageHelp')}</p>
      </div>
      <div className="space-y-2 md:col-span-2">
        <p className="text-xs leading-5 text-muted-foreground">
          {parentOptional ? t('register.parentOptionalHint') : t('register.parentRequiredHint')}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent-name">
          {t('register.parentName')}
          {parentOptional && <span className="ml-1 text-muted-foreground">{t('register.optionalSuffix')}</span>}
        </Label>
        <Input
          id="parent-name"
          className={errors.parentName ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.parentName)}
          aria-describedby={errors.parentName ? 'parent-name-error' : undefined}
          value={value.parentName}
          onChange={(event) => onChange({ parentName: event.target.value })}
        />
        <FieldError id="parent-name-error" message={errors.parentName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent-email">
          {t('register.parentEmail')}
          {parentOptional && <span className="ml-1 text-muted-foreground">{t('register.optionalSuffix')}</span>}
        </Label>
        <Input
          id="parent-email"
          type="email"
          className={errors.parentEmail ? invalidFieldClass : undefined}
          aria-invalid={Boolean(errors.parentEmail)}
          aria-describedby={errors.parentEmail ? 'parent-email-error' : undefined}
          value={value.parentEmail}
          onChange={(event) => onChange({ parentEmail: event.target.value })}
        />
        <FieldError id="parent-email-error" message={errors.parentEmail} />
      </div>
    </div>
  )
}
