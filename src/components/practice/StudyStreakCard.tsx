import { FlameKindling } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'

export function StudyStreakCard({ streak, points }: { streak: number; points: number }) {
  const { t } = useTranslation('practice')

  return (
    <Card className="border-primary/10 bg-card/90">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-[hsl(var(--platform-accent-soft))] p-2 text-[hsl(var(--stoa-brand-charcoal))]">
            <FlameKindling className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t('studyStreak')}</p>
            <p className="mt-1 text-2xl font-semibold">{streak} days</p>
            <p className="mt-1 text-sm text-muted-foreground">{points} progress points</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
