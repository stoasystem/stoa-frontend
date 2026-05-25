import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ParentOnboardingProfile } from '@/types/onboarding'

export function ParentProfileStep({
  value,
  subjectText,
  onChange,
  onSubjectTextChange,
}: {
  value: ParentOnboardingProfile
  subjectText: string
  onChange: (values: Partial<ParentOnboardingProfile>) => void
  onSubjectTextChange: (value: string) => void
}) {
  const { t } = useTranslation('auth')

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="child-name">{t('register.childName')}</Label>
        <Input id="child-name" value={value.childName} onChange={(event) => onChange({ childName: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-age">{t('register.age')}</Label>
        <Input id="child-age" type="number" min={5} value={value.childAge ?? ''} onChange={(event) => onChange({ childAge: Number(event.target.value) })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-grade">{t('register.grade')}</Label>
        <Input id="child-grade" value={value.childGrade} onChange={(event) => onChange({ childGrade: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-school">{t('register.childSchool')}</Label>
        <Input id="child-school" value={value.childSchool ?? ''} onChange={(event) => onChange({ childSchool: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-subjects">{t('register.subjects')}</Label>
        <Input id="child-subjects" value={subjectText} onChange={(event) => onSubjectTextChange(event.target.value)} placeholder="Mathematics, English" />
      </div>
    </div>
  )
}
