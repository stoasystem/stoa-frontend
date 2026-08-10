import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/common/Skeleton'
import type { MemoryRecommendation } from '@/services/learning/memoryApi'

const confidenceVariant: Record<
  MemoryRecommendation['confidence'],
  'default' | 'secondary' | 'outline'
> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
}

function RecommendedPracticeSkeleton() {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1 h-3 w-56" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border/70 p-4">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface RecommendedPracticeCardProps {
  recommendations: MemoryRecommendation[]
  isLoading?: boolean
  isError?: boolean
}

export function RecommendedPracticeCard({
  recommendations,
  isLoading,
  isError,
}: RecommendedPracticeCardProps) {
  if (isLoading) return <RecommendedPracticeSkeleton />

  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-[hsl(var(--stoa-brand-burgundy))]" />
          Recommended for Today
        </CardTitle>
        <CardDescription>
          Practice picked from the topics you have been asking about most.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Recommendations are unavailable right now.</span>
          </div>
        )}

        {!isError && recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing to recommend yet. Ask a few questions and suggestions will appear here.
          </p>
        )}

        {recommendations.map((rec) => (
          <div
            key={rec.candidateId}
            className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium capitalize leading-5">{rec.label}</div>
                <div className="mt-1 text-xs capitalize text-muted-foreground">{rec.subject}</div>
              </div>
              <Badge className="shrink-0 capitalize" variant={confidenceVariant[rec.confidence]}>
                {rec.confidence}
              </Badge>
            </div>

            {rec.rationale && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{rec.rationale}</p>
            )}

            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to={`/question-bank/${rec.subject}/${rec.topicId}`}>
                Start practice
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
