import { Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'

export function DailyGoalCard({ completed, target, label }: { completed: number; target: number; label: string }) {
  const { t } = useTranslation('practice')
  const percent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0

  return (
    <Card className="border-primary/10 bg-card/90">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
            <Target className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t('dailyGoal')}</p>
            <p className="mt-1 text-2xl font-semibold">{percent}%</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
