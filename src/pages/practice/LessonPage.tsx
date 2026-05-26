import { useMemo, useReducer, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { ChallengeCard } from '@/components/practice/ChallengeCard'
import { ChallengeFeedback } from '@/components/practice/ChallengeFeedback'
import { HintPanel } from '@/components/practice/HintPanel'
import { LessonProgressBar } from '@/components/practice/LessonProgressBar'
import { MultipleChoiceChallenge } from '@/components/practice/MultipleChoiceChallenge'
import { OrderingChallenge } from '@/components/practice/OrderingChallenge'
import { TextInputChallenge } from '@/components/practice/TextInputChallenge'
import {
  initialPracticeLessonState,
  practiceLessonReducer,
} from '@/components/practice/practiceLessonReducer'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { Button } from '@/components/ui/button'
import { useCompleteLessonMutation } from '@/hooks/practice/useCompleteLessonMutation'
import { useLessonQuery } from '@/hooks/practice/useLessonQuery'
import { usePracticeHintMutation } from '@/hooks/practice/usePracticeHintMutation'
import { usePracticeTeacherHelpMutation } from '@/hooks/practice/usePracticeTeacherHelpMutation'
import { useSubmitChallengeAnswerMutation } from '@/hooks/practice/useSubmitChallengeAnswerMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function LessonPage() {
  const { t } = useTranslation('practice')
  const { lessonId, subjectId } = useParams()
  const navigate = useNavigate()
  const lessonQuery = useLessonQuery(lessonId)
  const submitAnswer = useSubmitChallengeAnswerMutation()
  const completeLesson = useCompleteLessonMutation()
  const hintMutation = usePracticeHintMutation()
  const teacherHelpMutation = usePracticeTeacherHelpMutation()
  const [state, dispatch] = useReducer(practiceLessonReducer, initialPracticeLessonState)
  const [assistantExplanation, setAssistantExplanation] = useState('')

  const lesson = lessonQuery.data
  const challenge = lesson?.challenges[state.currentIndex]
  const canCheck = Boolean(challenge && (Array.isArray(state.answer) ? state.answer.length > 0 : state.answer.trim()))
  const teacherHelpVisible = state.incorrectAttempts >= 2 || state.hintsShown > 0

  const selectedSubjectPath = subjectId ?? lesson?.subjectId ?? 'math'
  const progressCurrent = useMemo(() => (lesson ? state.currentIndex + (state.feedback?.correct ? 1 : 0) : 0), [lesson, state])

  async function handleCheck() {
    if (!challenge) return
    const feedback = await submitAnswer.mutateAsync({
      challengeId: challenge.id,
      payload: { answer: state.answer },
    })
    dispatch({ type: 'feedback', feedback })
  }

  async function handleHint() {
    if (!challenge || !lesson) return
    const hint = await hintMutation.mutateAsync({
      subjectId: lesson.subjectId,
      lessonId: lesson.id,
      challengeId: challenge.id,
      answer: state.answer,
    })
    dispatch({ type: 'hint' })
    return hint
  }

  async function handleShowHint() {
    await handleHint()
  }

  async function handleExplain() {
    const hint = await handleHint()
    setAssistantExplanation(
      hint
        ? `Learning Assistant: ${hint.hint} Try the next step yourself before checking the full answer.`
        : 'Learning Assistant: Start by identifying the operation you can undo first.',
    )
  }

  async function handleTeacherHelp() {
    if (!challenge || !lesson) return
    const response = await teacherHelpMutation.mutateAsync({
      subjectId: lesson.subjectId,
      lessonId: lesson.id,
      challengeId: challenge.id,
      message: `Student is stuck on ${challenge.topic}.`,
    })
    setAssistantExplanation(response.message)
  }

  async function handleContinue() {
    if (!lesson) return
    const hasNext = state.currentIndex < lesson.challenges.length - 1
    if (hasNext) {
      setAssistantExplanation('')
      dispatch({ type: 'next', challenges: lesson.challenges })
      return
    }

    const result = await completeLesson.mutateAsync(lesson.id)
    navigate(`/practice/${lesson.subjectId}/lessons/${lesson.id}/result`, { state: { result } })
  }

  function renderChallenge() {
    if (!challenge) return null
    const disabled = Boolean(state.feedback?.correct)

    if (challenge.type === 'multiple_choice') {
      return (
        <MultipleChoiceChallenge
          disabled={disabled}
          onSelect={(answer) => dispatch({ type: 'answer', answer })}
          options={challenge.options ?? []}
          selected={Array.isArray(state.answer) ? '' : state.answer}
        />
      )
    }

    if (challenge.type === 'ordering') {
      return (
        <OrderingChallenge
          disabled={disabled}
          onChange={(answer) => dispatch({ type: 'answer', answer })}
          options={challenge.options ?? []}
          selected={Array.isArray(state.answer) ? state.answer : []}
        />
      )
    }

    return (
      <TextInputChallenge
        disabled={disabled}
        onChange={(answer) => dispatch({ type: 'answer', answer })}
        value={Array.isArray(state.answer) ? state.answer.join(', ') : state.answer}
      />
    )
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            className="mb-0"
            eyebrow="Practice lesson"
            title={lesson?.title ?? 'Lesson'}
            description={lesson?.topic ?? 'Complete each step, use hints when needed, and keep going.'}
          />
          <Button asChild variant="outline">
            <Link to={`/practice/${selectedSubjectPath}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Subject path
            </Link>
          </Button>
        </div>

        {lessonQuery.isLoading && <PageSkeleton rows={4} />}
        {lessonQuery.isError && <p className="text-sm text-destructive">Lesson is unavailable.</p>}

        {lesson && challenge && (
          <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
            <div className="space-y-5">
              <LessonProgressBar current={progressCurrent} total={lesson.challenges.length} />
              <ChallengeCard challenge={challenge}>{renderChallenge()}</ChallengeCard>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled={!canCheck || submitAnswer.isPending || Boolean(state.feedback)} onClick={handleCheck} type="button">
                  {t('checkAnswer')}
                </Button>
                <p className="text-sm text-muted-foreground">Attempts are practice chances, not penalties.</p>
              </div>
              {state.feedback && (
                <ChallengeFeedback
                  onContinue={handleContinue}
                  onHint={handleShowHint}
                  onRetry={() => dispatch({ type: 'retry' })}
                  result={state.feedback}
                />
              )}
              <HintPanel
                hint={hintMutation.data}
                onExplain={handleExplain}
                onTeacherHelp={handleTeacherHelp}
                teacherHelpMessage={teacherHelpMutation.data?.message}
                teacherHelpVisible={teacherHelpVisible}
              />
              {assistantExplanation && (
                <div className="rounded-lg border border-primary/15 bg-[hsl(var(--platform-surface-app))] p-4 text-sm leading-6">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {t('explainStep')}
                  </div>
                  {assistantExplanation}
                </div>
              )}
            </div>
            <aside className="space-y-4 rounded-lg border bg-card/80 p-5">
              <p className="brand-section-kicker">Lesson focus</p>
              <h2 className="text-xl font-semibold">{lesson.topic}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Work through one step at a time. If a mistake appears, use the hint before asking for a fuller explanation.
              </p>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                Attempts left: {state.feedback?.attemptsRemaining ?? 2}
              </div>
            </aside>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
