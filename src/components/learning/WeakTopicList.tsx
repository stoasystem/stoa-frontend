import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSubjectLabel } from '@/lib/displayLabels'
import type { LearningWeakTopic } from '@/types/learningProfile'

export function WeakTopicList({ topics }: { topics: LearningWeakTopic[] }) {
  const { t } = useTranslation('admin')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('learningProfile.weakTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('learningProfile.weakEmpty')}</p>
        )}
        {topics.map((topic) => (
          <div key={`${topic.subject}-${topic.topicId}`} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{topic.label}</p>
                <p className="text-sm text-muted-foreground">{getSubjectLabel(topic.subject, t)}</p>
              </div>
              <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                {t('learningProfile.signals', { count: topic.count })}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('learningProfile.evidenceQuestions', { count: topic.evidenceQuestionIds.length })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
