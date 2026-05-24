import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { useUpdateStudentProfileMutation } from '@/hooks/student/useUpdateStudentProfileMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { studentProfileSchema } from '@/lib/validation'

export function StudentProfilePage() {
  const profileQuery = useStudentProfileQuery()
  const updateProfile = useUpdateStudentProfileMutation()
  const [grade, setGrade] = useState('')
  const [schoolSystem, setSchoolSystem] = useState('')
  const [primarySubjects, setPrimarySubjects] = useState('')
  const [errors, setErrors] = useState<{ grade?: string; primarySubjects?: string }>({})

  useEffect(() => {
    if (!profileQuery.data) return
    setGrade(profileQuery.data.grade)
    setSchoolSystem(profileQuery.data.schoolSystem ?? '')
    setPrimarySubjects(profileQuery.data.primarySubjects.join(', '))
  }, [profileQuery.data])

  return (
    <DashboardLayout>
      <PageContainer className="max-w-2xl p-0">
        <PageHeader
          title="Student Profile"
          description="Keep grade and subject context current for STOA learning workflows."
        />
        {profileQuery.isLoading && <PageSkeleton rows={1} />}
        {profileQuery.isError && <p className="text-sm text-destructive">Failed to load profile.</p>}
        {profileQuery.data && (
          <form
            className="space-y-4 rounded-lg border bg-card p-5"
            onSubmit={(event) => {
              event.preventDefault()
              const subjects = primarySubjects
                .split(',')
                .map((subject) => subject.trim())
                .filter(Boolean)
              const result = studentProfileSchema.safeParse({
                grade,
                schoolSystem,
                primarySubjects: subjects,
              })
              if (!result.success) {
                const fieldErrors = result.error.flatten().fieldErrors
                setErrors({
                  grade: fieldErrors.grade?.[0],
                  primarySubjects: fieldErrors.primarySubjects?.[0],
                })
                toast.error('Check the profile fields before saving.')
                return
              }
              setErrors({})
              updateProfile.mutate(result.data)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" value={grade} onChange={(event) => setGrade(event.target.value)} />
              {errors.grade && <p className="text-xs text-destructive">{errors.grade}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjects">Primary subjects</Label>
              <Input
                id="subjects"
                value={primarySubjects}
                onChange={(event) => setPrimarySubjects(event.target.value)}
              />
              {errors.primarySubjects && (
                <p className="text-xs text-destructive">{errors.primarySubjects}</p>
              )}
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
      </PageContainer>
    </DashboardLayout>
  )
}
