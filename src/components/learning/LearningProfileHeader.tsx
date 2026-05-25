import { Card, CardContent } from '@/components/ui/card'
import type { LearningProfile } from '@/types/learningProfile'

export function LearningProfileHeader({ profile }: { profile: LearningProfile }) {
  return (
    <Card>
      <CardContent className="grid gap-4 pt-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Student learning profile</p>
          <h2 className="mt-2 text-2xl font-semibold">{profile.student.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.student.grade} · {profile.activeSubjects.join(', ')}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{profile.usage.aiMessagesThisMonth}</p>
            <p className="text-muted-foreground">AI messages</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{profile.usage.fileUploadsThisMonth}</p>
            <p className="text-muted-foreground">Uploads</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{profile.usage.teacherHelpRequestsThisMonth}</p>
            <p className="text-muted-foreground">Tutor help</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
