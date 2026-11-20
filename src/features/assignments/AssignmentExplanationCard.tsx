import { BookOpenCheck, Clock, Compass } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { chapterPath } from '@/features/chapter/useChapter'
import { pathForTarget } from '@/features/starmap/view/layers'
import { getRecommendationRationale, getSubjectLabel, getTopicLabel } from '@/lib/displayLabels'
import { formatDayAndMonth } from '@/lib/formatDateTime'
import { normalSubjectId } from '@/lib/subjects'
import type { LearningAssignment } from '@/types/learningOperations'
import type { CurriculumCatalog } from '@/types/practice'

/*
 * One assignment as the student reads it under Assignments. The student's page
 * draws its list with this card, and a teacher who has just assigned practice
 * sees the same card, so what they are shown is what the student gets (#703).
 */

function dueLabel(value: string | null | undefined, t: TFunction<'practice'>) {
  if (!value) return t('assignments.noDueDate')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatDayAndMonth(date)
}

function sourceLabel(assignment: LearningAssignment, t: TFunction<'practice'>) {
  if (assignment.automation) return t('assignments.sources.automation')
  if (assignment.sourceType === 'ai_draft') return t('assignments.sources.ai_draft')
  if (assignment.sourceType === 'curriculum_exercise') {
    return t('assignments.sources.curriculum_exercise')
  }
  return t('assignments.sources.reviewed')
}

const assignmentStatuses = new Set([
  'draft',
  'recommended',
  'assigned',
  'started',
  'completed',
  'skipped',
  'archived',
])

function statusLabel(status: string, t: TFunction<'practice'>) {
  if (assignmentStatuses.has(status)) return t(`assignments.status.${status}`)
  return t('assignments.status.unknown')
}

function targetLabel(assignment: LearningAssignment, t: TFunction<'practice'>) {
  const subject = assignment.subject ? getSubjectLabel(assignment.subject, t) : t('assignments.subjectPending')
  const topics = assignment.topicIds.map((topicId) => getTopicLabel(topicId, t)).join(', ')
  return `${subject} / ${topics || t('assignments.topicPending')}`
}

function rationaleText(assignment: LearningAssignment, t: TFunction<'practice'>) {
  const fallback = t('assignments.defaultRationale')
  const sentence = assignment.automation?.explanation || assignment.rationale
  return sentence ? getRecommendationRationale(sentence, t, fallback) : fallback
}

function nextAction(status: string, t: TFunction<'practice'>) {
  if (status === 'completed') return t('assignments.nextAction.completed')
  if (status === 'started') return t('assignments.nextAction.started')
  if (status === 'skipped') return t('assignments.nextAction.skipped')
  return t('assignments.nextAction.default')
}

export type AssignmentLink = { to: string; labelKey: 'assignments.openChapter' | 'assignments.openTopic' }

/*
 * Where an assignment's work lives (#400). The backend sets work from a
 * curriculum exercise, which names its lesson, or from a reviewed AI draft,
 * which names only a subject and topics. A lesson the catalog knows opens its
 * chapter; otherwise the first of its topics the catalog knows opens as a
 * nebula on the star map. Anything the catalog cannot place has no link.
 */
export function assignmentLink(assignment: LearningAssignment, catalog: CurriculumCatalog | undefined): AssignmentLink | null {
  if (!catalog) return null
  const lesson = assignment.lessonId ? catalog.lessons.find((candidate) => candidate.id === assignment.lessonId) : undefined
  if (lesson) return { to: chapterPath(lesson.unitId), labelKey: 'assignments.openChapter' }
  const subject = normalSubjectId(assignment.subject)
  const topic = assignment.topicIds
    .map((topicId) =>
      catalog.topics.find(
        (candidate) => candidate.id === topicId && (!subject || normalSubjectId(candidate.subjectId) === subject),
      ),
    )
    .find((candidate) => candidate !== undefined)
  if (topic) return { to: pathForTarget(topic.subjectId, { layer: 'nebula', nebulaId: topic.id }), labelKey: 'assignments.openTopic' }
  return null
}

export function AssignmentExplanationCard({
  assignment,
  link,
  marker,
}: {
  assignment: LearningAssignment
  link: AssignmentLink | null
  /** Beside the title: a teacher's view marks what was just assigned. */
  marker?: ReactNode
}) {
  const { t } = useTranslation('practice')
  const titleId = useId()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3 text-xl">
          {marker ? (
            <span className="flex flex-wrap items-center gap-2">
              <span id={titleId}>{assignment.title || t('assignments.untitled')}</span>
              {marker}
            </span>
          ) : (
            <span id={titleId}>{assignment.title || t('assignments.untitled')}</span>
          )}
          <span className="rounded-full border px-2 py-1 text-xs font-semibold text-muted-foreground">
            {statusLabel(assignment.status, t)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Compass className="h-4 w-4" /> {t('assignments.source')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{sourceLabel(assignment, t)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BookOpenCheck className="h-4 w-4" /> {t('assignments.target')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{targetLabel(assignment, t)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4" /> {t('assignments.due')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{dueLabel(assignment.dueAt, t)}</p>
          </div>
        </div>
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="text-sm font-semibold">{t('assignments.whyThisAppeared')}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{rationaleText(assignment, t)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            {nextAction(assignment.status, t)}
          </p>
          {link && (
            // One per card, the same words on each: the card's title tells them apart.
            <Button asChild variant="tinted" size="sm">
              <Link to={link.to} aria-describedby={titleId}>
                {t(link.labelKey)}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
