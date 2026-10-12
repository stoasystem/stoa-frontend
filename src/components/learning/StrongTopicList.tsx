import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSubjectLabel } from '@/lib/displayLabels'
import type { LearningWeakTopic } from '@/types/learningProfile'

export function StrongTopicList({ topics }: { topics: LearningWeakTopic[] }) {
  const { t } = useTranslation('admin')
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('learningProfile.strongTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('learningProfile.strongEmpty')}</p>
        )}
        {topics.map((topic) => (
          <div key={`${topic.subject}-${topic.topicId}`} className="rounded-md border p-3">
            <p className="font-medium">{topic.label}</p>
            <p className="text-sm text-muted-foreground">
              {getSubjectLabel(topic.subject, t)} · {t('learningProfile.signals', { count: topic.count })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
