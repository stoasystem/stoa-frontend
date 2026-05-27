import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LearningProgress } from '@/types/dashboard'

export function LearningProgressCard({ progress }: { progress: LearningProgress[] }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Learning Progress</CardTitle>
        <CardDescription>Where your weekly study target is moving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {progress.map((item) => {
          const percent = Math.min(Math.round((item.completed / item.target) * 100), 100)

          return (
            <div key={item.id} className="rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">{item.subject}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
                </div>
                <div className="text-sm font-semibold">{percent}%</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--stoa-brand-burgundy-soft))]">
                <div
                  className="h-full rounded-full bg-[hsl(var(--stoa-brand-burgundy))]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
