import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { StudentOnboardingProfile } from '@/types/onboarding'

export function StudentProfileStep({
  value,
  subjectText,
  onChange,
  onSubjectTextChange,
}: {
  value: StudentOnboardingProfile
  subjectText: string
  onChange: (values: Partial<StudentOnboardingProfile>) => void
  onSubjectTextChange: (value: string) => void
}) {
  const { t } = useTranslation('auth')

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="student-age">{t('register.age')}</Label>
        <Input id="student-age" type="number" min={5} value={value.age} onChange={(event) => onChange({ age: Number(event.target.value) })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-grade">{t('register.grade')}</Label>
        <Input id="student-grade" value={value.grade} onChange={(event) => onChange({ grade: event.target.value })} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="student-school">{t('register.school')}</Label>
        <Input id="student-school" value={value.school} onChange={(event) => onChange({ school: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-system">{t('register.schoolSystem')}</Label>
        <Input id="student-system" value={value.schoolSystem ?? ''} onChange={(event) => onChange({ schoolSystem: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-subjects">{t('register.subjects')}</Label>
        <Input id="student-subjects" value={subjectText} onChange={(event) => onSubjectTextChange(event.target.value)} placeholder="Mathematics, Physics" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent-name">{t('register.parentName')}</Label>
        <Input id="parent-name" value={value.parentName} onChange={(event) => onChange({ parentName: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent-email">{t('register.parentEmail')}</Label>
        <Input id="parent-email" type="email" value={value.parentEmail} onChange={(event) => onChange({ parentEmail: event.target.value })} />
      </div>
    </div>
  )
}
