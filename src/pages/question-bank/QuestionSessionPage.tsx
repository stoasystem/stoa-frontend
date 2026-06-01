import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Flag } from 'lucide-react'
import { PageContainer } from '@/components/common/PageContainer'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { QuestionAnswerInput } from '@/components/question-bank/QuestionAnswerInput'
import { QuestionFeedbackPanel } from '@/components/question-bank/QuestionFeedbackPanel'
import { Button } from '@/components/ui/button'
import { useQuestionBankSessionQuery } from '@/hooks/questionBank/useQuestionBankSessionQuery'
import { useSubmitQuestionBankAnswerMutation } from '@/hooks/questionBank/useSubmitQuestionBankAnswerMutation'
import { getPracticeTopicPath } from '@/lib/practiceRoutes'
import { getQuestionBankResultPath, getQuestionBankSetPath } from '@/lib/questionBankRoutes'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { QuestionBankChatLocationState, QuestionBankFeedback } from '@/types/questionBank'

export function QuestionSessionPage() {
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

  if (sessionQuery.isLoading) return <LoadingState />
  if (sessionQuery.isError || !setData || !question) return <ErrorState message="Question session could not be loaded." />

  const loadedSet = setData
  const loadedQuestion = question

  const progress = Math.round(((currentIndex + 1) / questions.length) * 100)

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
      prompt: `Can you explain this Question Bank step: ${loadedQuestion.prompt}`,
    }
    navigate('/chat?source=question-bank&questionId=' + loadedQuestion.id, { state })
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
              <h1 className="mt-2 text-2xl font-semibold">Question {currentIndex + 1} of {questions.length}</h1>
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
                Skip
              </Button>
            </div>
            <QuestionFeedbackPanel feedback={feedback} onAskLearningAssistant={askLearningAssistant} onTrySimilar={() => setAnswer('')} />
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border bg-card/95 p-4">
              <p className="brand-section-kicker">Session Navigation</p>
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
              <p className="brand-section-kicker">Finish Set</p>
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
