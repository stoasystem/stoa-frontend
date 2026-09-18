import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/common/Skeleton'
import { AlertCircle } from 'lucide-react'
import { getCurriculumTopicLabel, getSubjectLabel } from '@/lib/displayLabels'
import type { WeakTopic } from '@/types/dashboard'

const levelVariant: Record<WeakTopic['level'], 'default' | 'secondary' | 'outline'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'default',
}

function WeakTopicsCardSkeleton() {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-1 h-3 w-52" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4"
          >
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface WeakTopicsCardProps {
  topics: WeakTopic[]
  isLoading?: boolean
  isError?: boolean
}

export function WeakTopicsCard({ topics, isLoading, isError }: WeakTopicsCardProps) {
  const { t } = useTranslation('practice')
  if (isLoading) return <WeakTopicsCardSkeleton />

  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{t('progress.weakTopics')}</CardTitle>
        <CardDescription>{t('progress.weakTopicsBody')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{t('progress.weakTopicsFailed')}</span>
          </div>
        )}
        {!isError && topics.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('progress.weakTopicsEmpty')}</p>
        )}
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="flex items-start justify-between gap-4 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium leading-5">
                {getCurriculumTopicLabel(topic.topic, t)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {getSubjectLabel(topic.subject, t)}
              </div>
            </div>
            <Badge className="shrink-0" variant={levelVariant[topic.level]}>
              {t(`progress.priority.${topic.level}`)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
