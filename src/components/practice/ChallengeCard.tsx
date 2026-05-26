import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PracticeChallenge } from '@/types/practice'

export function ChallengeCard({ challenge, children }: { challenge: PracticeChallenge; children: ReactNode }) {
  return (
    <Card className="overflow-hidden border-primary/15 bg-card/95 shadow-[var(--platform-shadow-soft)]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <p className="brand-section-kicker">{challenge.topic}</p>
          <span className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] px-2 py-1 text-xs font-semibold text-primary">
            {challenge.gradeLevel}
          </span>
        </div>
        <CardTitle className="max-w-3xl text-2xl leading-tight">{challenge.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="border-t bg-[hsl(var(--platform-surface-app)_/_0.45)] p-5">{children}</CardContent>
    </Card>
  )
}
