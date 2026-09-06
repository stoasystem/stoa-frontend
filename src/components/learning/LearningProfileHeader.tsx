import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import type { LearningProfile } from '@/types/learningProfile'

export function LearningProfileHeader({ profile }: { profile: LearningProfile }) {
  const { t } = useTranslation('chat')
  const totals = profile.subjectActivity.reduce(
    (acc, subject) => ({
      questionCount: acc.questionCount + subject.questionCount,
      aiResolvedCount: acc.aiResolvedCount + subject.aiResolvedCount,
      teacherEscalationCount: acc.teacherEscalationCount + subject.teacherEscalationCount,
    }),
    { questionCount: 0, aiResolvedCount: 0, teacherEscalationCount: 0 },
  )

  return (
    <Card>
      <CardContent className="grid gap-4 pt-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Student learning profile</p>
          <h2 className="mt-2 text-2xl font-semibold">{profile.studentId}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.subjects.map((subject) => t(subject.labelKey)).join(', ')}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{totals.questionCount}</p>
            <p className="text-muted-foreground">Questions</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{totals.aiResolvedCount}</p>
            <p className="text-muted-foreground">AI resolved</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{totals.teacherEscalationCount}</p>
            <p className="text-muted-foreground">Tutor help</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
