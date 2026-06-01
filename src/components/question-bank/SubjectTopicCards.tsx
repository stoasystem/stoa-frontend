import { ArrowRight, BookOpenCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getQuestionBankSubjectPath, getQuestionBankTopicPath } from '@/lib/questionBankRoutes'
import type { QuestionBankSubject, QuestionBankTopic } from '@/types/questionBank'

export function SubjectCard({ subject }: { subject: QuestionBankSubject }) {
  return (
    <article className="rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
      <div
        className="h-1.5 w-16 rounded-full"
        style={{ backgroundColor: subject.accent }}
      />
      <h3 className="mt-4 text-xl font-semibold">{subject.title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{subject.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Metric value={`${subject.setCount}`} label="sets" />
        <Metric value={`${subject.questionCount}`} label="questions" />
        <Metric value={`${subject.accuracy}%`} label="accuracy" />
      </div>
      <Button asChild variant="outline" className="mt-5 w-full">
        <Link to={getQuestionBankSubjectPath(subject.id)}>
          Open
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </article>
  )
}

export function TopicCard({ topic }: { topic: QuestionBankTopic }) {
  return (
    <article className="rounded-lg border border-border/80 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="brand-section-kicker">Topic</p>
          <h3 className="mt-2 text-xl font-semibold">{topic.title}</h3>
        </div>
        <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
          <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{topic.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Metric value={`${topic.setCount}`} label="sets" />
        <Metric value={`${topic.questionCount}`} label="questions" />
        <Metric value={`${topic.completedSetCount}/${topic.setCount}`} label="done" />
      </div>
      <Button asChild className="mt-5 w-full">
        <Link to={getQuestionBankTopicPath(topic.subjectId, topic.id)}>
          Open
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </article>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-2">
      <p className="font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-muted-foreground">{label}</p>
    </div>
  )
}
