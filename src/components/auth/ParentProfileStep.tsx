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
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="child-name">Child name</Label>
        <Input id="child-name" value={value.childName} onChange={(event) => onChange({ childName: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-age">Child age</Label>
        <Input id="child-age" type="number" min={5} value={value.childAge ?? ''} onChange={(event) => onChange({ childAge: Number(event.target.value) })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-grade">Child grade</Label>
        <Input id="child-grade" value={value.childGrade} onChange={(event) => onChange({ childGrade: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-school">Child school</Label>
        <Input id="child-school" value={value.childSchool ?? ''} onChange={(event) => onChange({ childSchool: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-subjects">Subjects needing help</Label>
        <Input id="child-subjects" value={subjectText} onChange={(event) => onSubjectTextChange(event.target.value)} placeholder="Mathematics, English" />
      </div>
    </div>
  )
}
