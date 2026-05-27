import { ArrowRight, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { PracticeRoadmapLesson } from '@/types/practice'

export function ContinueNextLessonCard({
  lesson,
  onContinue,
}: {
  lesson: PracticeRoadmapLesson
  onContinue: () => void
}) {
  const { t } = useTranslation('practice')

  return (
    <section className="rounded-lg border border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--platform-surface-app))_100%)] p-5 shadow-[var(--platform-shadow-soft)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="brand-section-kicker">{t('roadmap.currentLesson')}</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">{lesson.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('roadmap.supportCopy')}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('roadmap.learningChatHint')}
          </div>
        </div>
        <Button className="w-full md:w-auto" onClick={onContinue} type="button">
          {t('roadmap.continue')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
