import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PracticeMistake } from '@/types/practice'

export function MistakeReviewCard({ mistake }: { mistake: PracticeMistake }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="brand-section-kicker">
              {mistake.subjectName} · {mistake.topic}
            </p>
            <h3 className="text-lg font-semibold">{mistake.prompt}</h3>
            <p className="text-sm text-muted-foreground">Recent answer: {mistake.studentAnswer}</p>
            <p className="text-sm">Next step to review: {mistake.hint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`/practice/${mistake.subjectId}/lessons/${mistake.lessonId}`}>Retry</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to={`/chat?practice=${mistake.challengeId}`}>Explain this step</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
