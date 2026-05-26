import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PracticeSubject } from '@/types/practice'

export function SubjectPathCard({ subject }: { subject: PracticeSubject }) {
  const { t } = useTranslation('practice')

  return (
    <Card className="group border-primary/10 bg-card/95 shadow-[var(--platform-shadow-soft)] transition-colors hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="brand-section-kicker">Demo path</p>
            <h3 className="mt-2 text-xl font-semibold">{subject.name}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{subject.description}</p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to={`/practice/${subject.id}`}>
              {t('startLesson')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[hsl(var(--stoa-brand-burgundy-soft))]">
          <div
            className="h-full rounded-full bg-[hsl(var(--stoa-brand-burgundy))] transition-all group-hover:bg-primary"
            style={{ width: `${subject.progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{subject.progress}% path progress</p>
      </CardContent>
    </Card>
  )
}
