import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, Check, CircleAlert, FileText, RefreshCw, Sparkles, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAcceptAiTeacherDraftMutation,
  useArchiveAiTeacherDraftMutation,
  useCreateAiTeacherExerciseDraftMutation,
  useCreateAiTeacherSummaryDraftMutation,
  useRegenerateAiTeacherDraftMutation,
  useRejectAiTeacherDraftMutation,
} from '@/hooks/teacher/useAiTeacherDraftMutations'
import type { AiTeacherDraft, TeacherHelpRequestDetail } from '@/types/teacher'

const difficulties = ['targeted', 'standard', 'stretch']

type Props = {
  request: TeacherHelpRequestDetail
}

export function AiTeacherToolsPanel({ request }: Props) {
  const { t } = useTranslation('teacher')
  const [summaryDraft, setSummaryDraft] = useState<AiTeacherDraft>()
  const [exerciseDraft, setExerciseDraft] = useState<AiTeacherDraft>()
  const [difficulty, setDifficulty] = useState('targeted')
  const [exerciseCount, setExerciseCount] = useState(3)
  const topicIds = useMemo(() => {
    const topicId = request.practiceContext?.topicId
    return topicId ? [topicId] : [request.subject.toLowerCase().replace(/\s+/g, '-')]
  }, [request.practiceContext?.topicId, request.subject])

  const createSummary = useCreateAiTeacherSummaryDraftMutation()
  const createExercise = useCreateAiTeacherExerciseDraftMutation()
  const regenerate = useRegenerateAiTeacherDraftMutation()
  const accept = useAcceptAiTeacherDraftMutation()
  const reject = useRejectAiTeacherDraftMutation()
  const archive = useArchiveAiTeacherDraftMutation()
  const isReviewing = accept.isPending || reject.isPending || archive.isPending || regenerate.isPending

  function handleCreateExercise() {
    createExercise.mutate(
      {
        studentId: request.student.id,
        subject: request.subject,
        topicIds,
        difficulty,
        exerciseCount,
        questionId: request.requestId,
      },
      { onSuccess: setExerciseDraft },
    )
  }

  function handleRegenerate(draft: AiTeacherDraft) {
    regenerate.mutate(draft.draftId, {
      onSuccess: (nextDraft) => {
        if (draft.draftType === 'teacher_summary') setSummaryDraft(mergeDraft(draft, nextDraft))
        if (draft.draftType === 'practice_exercise') setExerciseDraft(mergeDraft(draft, nextDraft))
      },
    })
  }

  function handleReview(draft: AiTeacherDraft, action: 'accept' | 'reject' | 'archive') {
    const mutation = action === 'accept' ? accept : action === 'reject' ? reject : archive
    mutation.mutate(
      { draftId: draft.draftId },
      {
        onSuccess: (reviewedDraft) => {
          const merged = mergeDraft(draft, reviewedDraft)
          if (draft.draftType === 'teacher_summary') setSummaryDraft(merged)
          if (draft.draftType === 'practice_exercise') setExerciseDraft(merged)
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('aiTools.title')}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('aiTools.description')}
            </p>
          </div>
          <Badge variant="outline">{t('aiTools.draftOnly')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border border-border/70 p-3">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
              <div>
                <p className="text-sm font-medium">{t('aiTools.summary.title')}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t('aiTools.summary.description')}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                aria-label={t('aiTools.summary.generateLabel')}
                disabled={createSummary.isPending}
                onClick={() => createSummary.mutate(request.requestId, { onSuccess: setSummaryDraft })}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                {t('aiTools.generate')}
              </Button>
            </div>
            <DraftStatus draft={summaryDraft} />
            {summaryDraft && (
              <div className="space-y-3">
                <SummaryLine label={t('aiTools.summary.session')} value={summaryDraft.sessionSummary} />
                <SummaryLine label={t('aiTools.summary.misconception')} value={summaryDraft.misconceptionSummary} />
                <SummaryLine label={t('aiTools.summary.focus')} value={summaryDraft.suggestedTeachingFocus} />
                <SummaryLine label={t('aiTools.summary.followUp')} value={summaryDraft.draftFollowupExplanation} />
                <DraftActions
                  draft={summaryDraft}
                  isPending={isReviewing}
                  onAccept={() => handleReview(summaryDraft, 'accept')}
                  onReject={() => handleReview(summaryDraft, 'reject')}
                  onArchive={() => handleReview(summaryDraft, 'archive')}
                  onRegenerate={() => handleRegenerate(summaryDraft)}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-md border border-border/70 p-3">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
              <div>
                <p className="text-sm font-medium">{t('aiTools.exercise.title')}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t('aiTools.exercise.description')}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                aria-label={t('aiTools.exercise.generateLabel')}
                disabled={createExercise.isPending}
                onClick={handleCreateExercise}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t('aiTools.generate')}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_96px]">
              <div className="space-y-2">
                <Label htmlFor="exercise-difficulty">{t('aiTools.exercise.difficulty')}</Label>
                <div id="exercise-difficulty" className="flex flex-wrap gap-2">
                  {difficulties.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={difficulty === option}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        difficulty === option ? 'border-primary bg-primary text-primary-foreground' : 'bg-background'
                      }`}
                      onClick={() => setDifficulty(option)}
                    >
                      {t(`aiTools.exercise.difficulties.${option}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exercise-count">{t('aiTools.exercise.items')}</Label>
                <Input
                  id="exercise-count"
                  type="number"
                  min={1}
                  max={5}
                  value={exerciseCount}
                  onChange={(event) => setExerciseCount(clampExerciseCount(event.target.valueAsNumber))}
                />
              </div>
            </div>
            <DraftStatus draft={exerciseDraft} />
            {exerciseDraft && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {exerciseDraft.items.map((item, index) => (
                    <div key={item.id} className="rounded-md bg-secondary/40 p-3">
                      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                        {t('aiTools.exercise.item', { number: index + 1 })}
                      </p>
                      <p className="mt-1 text-sm leading-6">{item.prompt}</p>
                    </div>
                  ))}
                </div>
                <SummaryLine
                  label={t('aiTools.exercise.answerKey')}
                  value={exerciseDraft.answerKey.map((item) => item.answer).join(', ')}
                />
                <DraftActions
                  draft={exerciseDraft}
                  isPending={isReviewing}
                  onAccept={() => handleReview(exerciseDraft, 'accept')}
                  onReject={() => handleReview(exerciseDraft, 'reject')}
                  onArchive={() => handleReview(exerciseDraft, 'archive')}
                  onRegenerate={() => handleRegenerate(exerciseDraft)}
                />
              </div>
            )}
          </div>
        </div>
        {(createSummary.isError || createExercise.isError) && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <CircleAlert className="h-4 w-4" aria-hidden="true" />
            {t('aiTools.unavailable')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DraftStatus({ draft }: { draft?: AiTeacherDraft }) {
  const { t } = useTranslation('teacher')
  if (!draft) {
    return <p className="text-sm text-muted-foreground">{t('aiTools.noDraft')}</p>
  }

  return (
    <div className="grid gap-2 sm:flex sm:flex-wrap">
      <Badge variant={draft.status === 'draft' ? 'secondary' : 'outline'}>{t(`aiTools.status.${draft.status}`, { defaultValue: draft.status })}</Badge>
      <Badge variant="outline">
        {t(`aiTools.delivery.${draft.studentDeliveryStatus}`, { defaultValue: draft.studentDeliveryStatus.replace('_', ' ') })}
      </Badge>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value?: string | null }) {
  const { t } = useTranslation('teacher')
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-6">{value || t('aiTools.notAvailable')}</p>
    </div>
  )
}

function DraftActions({
  draft,
  isPending,
  onAccept,
  onReject,
  onArchive,
  onRegenerate,
}: {
  draft: AiTeacherDraft
  isPending: boolean
  onAccept: () => void
  onReject: () => void
  onArchive: () => void
  onRegenerate: () => void
}) {
  const { t } = useTranslation('teacher')
  const disabled = isPending || draft.status !== 'draft'

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={onRegenerate}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {t('aiTools.actions.regenerate')}
      </Button>
      <Button type="button" size="sm" disabled={disabled} onClick={onAccept}>
        <Check className="h-4 w-4" aria-hidden="true" />
        {t('aiTools.actions.accept')}
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onReject}>
        <X className="h-4 w-4" aria-hidden="true" />
        {t('aiTools.actions.reject')}
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onArchive}>
        <Archive className="h-4 w-4" aria-hidden="true" />
        {t('aiTools.actions.archive')}
      </Button>
    </div>
  )
}

function clampExerciseCount(value: number) {
  if (Number.isNaN(value)) return 1
  return Math.max(1, Math.min(5, value))
}

function mergeDraft(current: AiTeacherDraft, next: AiTeacherDraft): AiTeacherDraft {
  return {
    ...current,
    ...next,
    draftType: current.draftType,
    items: next.items.length > 0 ? next.items : current.items,
    answerKey: next.answerKey.length > 0 ? next.answerKey : current.answerKey,
    explanations: next.explanations.length > 0 ? next.explanations : current.explanations,
    studentDeliveryStatus: 'not_delivered',
  }
}
