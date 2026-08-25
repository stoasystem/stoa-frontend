import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TutorOnboardingProfile } from '@/types/onboarding'

export function TutorProfileStep({
  value,
  subjectText,
  onChange,
  onSubjectTextChange,
}: {
  value: TutorOnboardingProfile
  subjectText: string
  onChange: (values: Partial<TutorOnboardingProfile>) => void
  onSubjectTextChange: (value: string) => void
}) {
  const { t } = useTranslation('auth')

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tutor-subjects">{t('register.teachingSubjects')}</Label>
          <Input id="tutor-subjects" value={subjectText} onChange={(event) => onSubjectTextChange(event.target.value)} placeholder="Mathematics, Physics" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tutor-years">{t('register.yearsExperience')}</Label>
          <Input id="tutor-years" type="number" min={0} value={value.yearsOfExperience ?? ''} onChange={(event) => onChange({ yearsOfExperience: Number(event.target.value) })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tutor-education">{t('register.educationBackground')}</Label>
        <Input id="tutor-education" value={value.educationBackground} onChange={(event) => onChange({ educationBackground: event.target.value })} placeholder="MSc Mathematics, ETH Zurich" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tutor-intro">{t('register.introduction')}</Label>
        <Textarea id="tutor-intro" value={value.introduction} onChange={(event) => onChange({ introduction: event.target.value })} className="min-h-28 resize-none" />
      </div>
    </div>
  )
}
