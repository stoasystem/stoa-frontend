import { ArrowRight, BookOpenCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getQuestionBankSubjectPath, getQuestionBankTopicPath } from '@/lib/questionBankRoutes'
import type { QuestionBankSubject, QuestionBankTopic } from '@/types/questionBank'

export function SubjectCard({ subject }: { subject: QuestionBankSubject }) {
  const { t } = useTranslation('practice')

  return (
    <article className="flex h-full min-w-0 flex-col rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
      <div
        className="h-1.5 w-16 rounded-full"
        style={{ backgroundColor: subject.accent }}
      />
      <h3 className="mt-4 hyphens-auto break-words text-xl font-semibold">{subject.title}</h3>
      {/* Four of these share a desktop row. An uncapped summary made one card
          three times the height of its neighbours and broke a word per line. */}
      <p
        className="mt-2 line-clamp-3 min-h-12 text-sm leading-6 text-muted-foreground"
        title={subject.description}
      >
        {subject.description}
      </p>
      <div className="mb-5 mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Metric value={`${subject.setCount}`} label={t('learn.metricSets')} />
        <Metric value={`${subject.questionCount}`} label={t('learn.metricQuestions')} />
        <Metric value={`${subject.accuracy}%`} label={t('learn.metricAccuracy')} />
      </div>
      <Button asChild variant="outline" className="mt-auto w-full">
        <Link to={getQuestionBankSubjectPath(subject.id)}>
          {t('learn.open')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </article>
  )
}

export function TopicCard({ topic }: { topic: QuestionBankTopic }) {
  const { t } = useTranslation('practice')

  return (
    <article className="flex h-full min-w-0 flex-col rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="brand-section-kicker">{t('learn.topicKicker')}</p>
          <h3 className="mt-2 hyphens-auto break-words text-xl font-semibold">{topic.title}</h3>
        </div>
        <div className="shrink-0 rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
          <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p
        className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground"
        title={topic.description}
      >
        {topic.description}
      </p>
      <div className="mb-5 mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Metric value={`${topic.setCount}`} label={t('learn.metricSets')} />
        <Metric value={`${topic.questionCount}`} label={t('learn.metricQuestions')} />
        <Metric value={`${topic.completedSetCount}/${topic.setCount}`} label={t('learn.metricDone')} />
      </div>
      <Button asChild className="mt-auto w-full">
        <Link to={getQuestionBankTopicPath(topic.subjectId, topic.id)}>
          {t('learn.open')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </article>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-md border bg-[hsl(var(--platform-surface-app))] p-2">
      <p className="font-semibold text-foreground">{value}</p>
      {/* The label used to spill over the neighbouring tile at four-up widths. */}
      <p className="mt-1 break-words text-[0.7rem] leading-tight text-muted-foreground">{label}</p>
    </div>
  )
}
