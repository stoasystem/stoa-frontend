import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { useUpdateStudentProfileMutation } from '@/hooks/student/useUpdateStudentProfileMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function StudentProfilePage() {
  const profileQuery = useStudentProfileQuery()
  const updateProfile = useUpdateStudentProfileMutation()
  const [grade, setGrade] = useState('')
  const [schoolSystem, setSchoolSystem] = useState('')
  const [primarySubjects, setPrimarySubjects] = useState('')

  useEffect(() => {
    if (!profileQuery.data) return
    setGrade(profileQuery.data.grade)
    setSchoolSystem(profileQuery.data.schoolSystem ?? '')
    setPrimarySubjects(profileQuery.data.primarySubjects.join(', '))
  }, [profileQuery.data])

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep grade and subject context current for STOA learning workflows.
          </p>
        </div>
        {profileQuery.isLoading && <p className="text-sm text-muted-foreground">Loading profile...</p>}
        {profileQuery.isError && <p className="text-sm text-destructive">Failed to load profile.</p>}
        {profileQuery.data && (
          <form
            className="space-y-4 rounded-lg border bg-card p-5"
            onSubmit={(event) => {
              event.preventDefault()
              updateProfile.mutate({
                grade,
                schoolSystem,
                primarySubjects: primarySubjects
                  .split(',')
                  .map((subject) => subject.trim())
                  .filter(Boolean),
              })
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" value={grade} onChange={(event) => setGrade(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjects">Primary subjects</Label>
              <Input
                id="subjects"
                value={primarySubjects}
                onChange={(event) => setPrimarySubjects(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school-system">School system</Label>
              <Input
                id="school-system"
                value={schoolSystem}
                onChange={(event) => setSchoolSystem(event.target.value)}
              />
            </div>
            {updateProfile.isError && <p className="text-sm text-destructive">Failed to save profile.</p>}
            {updateProfile.isSuccess && <p className="text-sm text-muted-foreground">Profile saved.</p>}
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
