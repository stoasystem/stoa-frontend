import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Flag } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { QuestionAnswerInput } from '@/components/question-bank/QuestionAnswerInput'
import { QuestionFeedbackPanel } from '@/components/question-bank/QuestionFeedbackPanel'
import { Button } from '@/components/ui/button'
import { InlineUploadPanel } from '@/features/uploads/components/InlineUploadPanel'
import { saveUploadHandoff } from '@/features/uploads/utils/uploadHandoff'
import type { UploadAttachment } from '@/features/uploads/types/uploads'
import { useQuestionBankSessionQuery } from '@/hooks/questionBank/useQuestionBankSessionQuery'
import { useCompleteQuestionBankSetMutation } from '@/hooks/questionBank/useCompleteQuestionBankSetMutation'
import { useSubmitQuestionBankAnswerMutation } from '@/hooks/questionBank/useSubmitQuestionBankAnswerMutation'
import { getPracticeTopicPath } from '@/lib/practiceRoutes'
import { getQuestionBankResultPath, getQuestionBankSetPath } from '@/lib/questionBankRoutes'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { QuestionBankChatLocationState, QuestionBankFeedback, QuestionBankResult } from '@/types/questionBank'

export function QuestionSessionPage() {
  const { t } = useTranslation('practice')
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const sessionQuery = useQuestionBankSessionQuery(sessionId)
  const submitAnswerMutation = useSubmitQuestionBankAnswerMutation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState<string | string[]>('')
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, QuestionBankFeedback>>({})

  const setData = sessionQuery.data?.set.set
  const questions = sessionQuery.data?.set.questions ?? []
  const question = questions[currentIndex]
  const feedback = question ? feedbackByQuestion[question.id] : undefined
  const answeredCount = useMemo(() => Object.keys(feedbackByQuestion).length, [feedbackByQuestion])
  const finishSetMutation = useCompleteQuestionBankSetMutation()

  if (sessionQuery.isLoading) return <LoadingState message={t('library.loadingQuestions')} />
  if (sessionQuery.isError || !setData || !question) return <ErrorState title="We could not load this practice set" message="Please return to the Practice Library and try again." action={<Button asChild variant="outline"><Link to="/question-bank">Back to Practice Library</Link></Button>} />

  const loadedSet = setData
  const loadedQuestion = question

  const progress = Math.round(((currentIndex + 1) / questions.length) * 100)
  const everyQuestionChecked = answeredCount === questions.length

  function finishSet() {
    const checked = questions.map((item) => feedbackByQuestion[item.id]).filter(Boolean)
    const incorrect = questions.filter(
      (item) => feedbackByQuestion[item.id]?.state === 'incorrect',
    )
    const result: QuestionBankResult = {
      sessionId: sessionId ?? loadedSet.id,
      setId: loadedSet.id,
      score: checked.filter((item) => item.state === 'correct').length,
      total: questions.length,
      timeSpentMinutes: loadedSet.estimatedMinutes,
      accuracyByTopic: [],
      incorrectQuestions: incorrect.map((item) => ({
        id: item.id,
        questionId: item.id,
        setId: loadedSet.id,
        setTitle: loadedSet.title,
        subjectId: item.subjectId,
        subjectTitle: item.subjectId,
        topicId: item.topicId,
        topicTitle: item.topicId,
        difficulty: item.difficulty,
        prompt: item.prompt,
        studentAnswer: String(feedbackByQuestion[item.id]?.studentAnswer ?? ''),
        correctAnswer: String(feedbackByQuestion[item.id]?.correctAnswer ?? ''),
        explanation: feedbackByQuestion[item.id]?.explanation ?? '',
        reviewed: false,
        createdAt: new Date().toISOString(),
      })),
      skippedQuestions: [],
      nextSteps: incorrect.length
        ? ['Review the questions you missed.', 'Ask the Learning Assistant about the ones still unclear.']
        : ['Continue with the next set in this topic.'],
    }
    finishSetMutation.mutate(loadedSet.id, {
      onSettled: () => {
        navigate(getQuestionBankResultPath(sessionId ?? loadedSet.id), { state: { result } })
      },
    })
  }

  function checkAnswer() {
    if (!loadedQuestion) return
    submitAnswerMutation.mutate(
      { questionId: loadedQuestion.id, answer },
      {
        onSuccess: (result) => {
          setFeedbackByQuestion((current) => ({ ...current, [loadedQuestion.id]: result }))
        },
      },
    )
  }

  function skipQuestion() {
    if (!loadedQuestion) return
    submitAnswerMutation.mutate(
      { questionId: loadedQuestion.id, answer: '' },
      {
        onSuccess: (result) => {
          setFeedbackByQuestion((current) => ({ ...current, [loadedQuestion.id]: result }))
        },
      },
    )
  }

  function goTo(index: number) {
    setCurrentIndex(index)
    setAnswer('')
  }

  function askLearningAssistant() {
    const state: QuestionBankChatLocationState = {
      questionBankContext: {
        source: 'question-bank',
        subjectId: loadedSet.subjectId,
        topicId: loadedSet.topicId,
        setId: loadedSet.id,
        questionId: loadedQuestion.id,
        topic: loadedQuestion.skill,
        setTitle: loadedSet.title,
        challengePrompt: loadedQuestion.prompt,
        studentAnswer: Array.isArray(answer) ? answer.join(' / ') : answer,
        correctAnswer: Array.isArray(loadedQuestion.correctAnswer) ? loadedQuestion.correctAnswer.join(' / ') : loadedQuestion.correctAnswer,
        returnTo: `/question-bank/session/${sessionId}`,
      },
      prompt: `Can you explain this Practice Library step: ${loadedQuestion.prompt}`,
    }
    navigate('/chat?source=question-bank&questionId=' + loadedQuestion.id, { state })
  }

  function askLearningAssistantWithUpload(attachments: UploadAttachment[]) {
    const uploadContext = {
      source: 'question-session-upload' as const,
      title: loadedSet.title,
      description: `Uploaded work for ${loadedQuestion.skill}. The Learning Assistant will use this as context.`,
      prompt: 'I uploaded my work for this Practice Library question. Please help me understand the next step without just giving me the answer.',
      returnTo: `/question-bank/session/${sessionId}`,
      sessionId,
      questionId: loadedQuestion.id,
      attachments,
    }

    saveUploadHandoff(uploadContext)
    navigate(`/chat?source=question-bank&sessionId=${sessionId}&questionId=${loadedQuestion.id}`, {
      state: { uploadContext },
    })
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <section className="rounded-lg border bg-card/95 p-5 shadow-[var(--platform-shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link to={getQuestionBankSetPath(loadedSet.id)} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {loadedSet.title}
              </Link>
              <h1 className="mt-2 text-2xl font-semibold">{loadedSet.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
            </div>
            <div className="text-sm text-muted-foreground">{answeredCount} checked · {questions.length - answeredCount} remaining</div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-muted" aria-label={`Session progress ${progress}%`}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5 rounded-lg border bg-card/95 p-5 shadow-[var(--platform-shadow-soft)]">
            <div>
              <p className="brand-section-kicker">{loadedQuestion.skill}</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">{loadedQuestion.prompt}</h2>
              <p className="mt-2 text-sm capitalize text-muted-foreground">{loadedQuestion.type.replace(/_/g, ' ')} · {loadedQuestion.difficulty}</p>
            </div>
            <QuestionAnswerInput question={loadedQuestion} value={answer} onChange={setAnswer} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={checkAnswer} disabled={submitAnswerMutation.isPending}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Check Answer
              </Button>
              <Button type="button" variant="outline" onClick={skipQuestion} disabled={submitAnswerMutation.isPending}>
                Skip for Now
              </Button>
              {everyQuestionChecked && (
                <Button type="button" variant="secondary" onClick={finishSet} disabled={finishSetMutation.isPending}>
                  {finishSetMutation.isPending ? 'Finishing...' : 'Finish set'}
                </Button>
              )}
            </div>
            <QuestionFeedbackPanel feedback={feedback} onAskLearningAssistant={askLearningAssistant} onTrySimilar={() => setAnswer('')} />
            <InlineUploadPanel
              context="question_session"
              compact
              title={t('ui.needHelp')}
              description={t('ui.askAssistant2')}
              sourceOptions={{
                sourcePage: `/question-bank/session/${sessionId}`,
                sourceEntityId: loadedQuestion.id,
              }}
              onAskLearningAssistant={askLearningAssistantWithUpload}
            />
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border bg-card/95 p-4">
              <p className="brand-section-kicker">Practice Navigation</p>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {questions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(index)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold ${index === currentIndex ? 'border-primary bg-primary text-primary-foreground' : feedbackByQuestion[item.id] ? 'border-primary/30 bg-[hsl(var(--stoa-brand-burgundy-soft))]' : 'bg-card'}`}
                    aria-label={`Open question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-primary/15 bg-[hsl(var(--stoa-brand-burgundy-soft))] p-4">
              <p className="brand-section-kicker">Finish Practice</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You still have {questions.length - answeredCount} question{questions.length - answeredCount === 1 ? '' : 's'} without feedback.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {answeredCount < questions.length && (
                  <Button type="button" variant="outline" onClick={() => goTo(questions.findIndex((item) => !feedbackByQuestion[item.id]))}>
                    <Flag className="h-4 w-4" aria-hidden="true" />
                    Review Unanswered
                  </Button>
                )}
                <Button asChild>
                  <Link to={getQuestionBankResultPath(sessionId ?? 'session-linear-equations-basics')}>
                    Finish Anyway
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to={getPracticeTopicPath(loadedSet.subjectId, loadedSet.topicId)}>Related Practice Path</Link>
            </Button>
          </aside>
        </section>
      </PageContainer>
    </DashboardLayout>
  )
}
