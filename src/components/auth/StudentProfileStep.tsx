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
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="student-age">Age</Label>
        <Input id="student-age" type="number" min={5} value={value.age} onChange={(event) => onChange({ age: Number(event.target.value) })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-grade">Grade</Label>
        <Input id="student-grade" value={value.grade} onChange={(event) => onChange({ grade: event.target.value })} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="student-school">School</Label>
        <Input id="student-school" value={value.school} onChange={(event) => onChange({ school: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-system">School system</Label>
        <Input id="student-system" value={value.schoolSystem ?? ''} onChange={(event) => onChange({ schoolSystem: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-subjects">Subjects needing help</Label>
        <Input id="student-subjects" value={subjectText} onChange={(event) => onSubjectTextChange(event.target.value)} placeholder="Mathematics, Physics" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent-name">Parent name</Label>
        <Input id="parent-name" value={value.parentName} onChange={(event) => onChange({ parentName: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent-email">Parent email</Label>
        <Input id="parent-email" type="email" value={value.parentEmail} onChange={(event) => onChange({ parentEmail: event.target.value })} />
      </div>
    </div>
  )
}
