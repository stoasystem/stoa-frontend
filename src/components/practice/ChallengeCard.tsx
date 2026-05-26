import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PracticeChallenge } from '@/types/practice'

export function ChallengeCard({ challenge, children }: { challenge: PracticeChallenge; children: ReactNode }) {
  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <p className="brand-section-kicker">{challenge.topic}</p>
        <CardTitle className="text-2xl">{challenge.prompt}</CardTitle>
        <p className="text-sm text-muted-foreground">{challenge.gradeLevel}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
