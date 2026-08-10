import { useEffect, useMemo, useState } from 'react'
import { Video } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { PracticeContextCard } from '@/components/chat/PracticeContextCard'
import { QuestionBankContextCard } from '@/components/question-bank/QuestionBankContextCard'
import { ChatSkeleton } from '@/components/chat/ChatSkeleton'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AttachmentPreviewList } from '@/features/uploads/components/AttachmentPreviewList'
import { useInstantVideoHelp } from '@/features/live-classroom/hooks/useInstantVideoHelp'
import { uploadAttachmentToUploadedFile } from '@/features/uploads/utils/uploadAdapters'
import {
  clearUploadHandoff,
  readUploadHandoff,
  type UploadChatHandoff,
  type UploadChatLocationState,
} from '@/features/uploads/utils/uploadHandoff'
import { useConversationQuery } from '@/hooks/chat/useConversationQuery'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { useCreateConversationMutation } from '@/hooks/chat/useCreateConversationMutation'
import { useStreamingChat } from '@/hooks/chat/useStreamingChat'
import { useTeacherHelpMutation } from '@/hooks/chat/useTeacherHelpMutation'
import { useTeacherHelpStatusQuery } from '@/hooks/chat/useTeacherHelpStatusQuery'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { toUserFacingError } from '@/lib/userFacingText'
import type { PracticeChatLocationState } from '@/types/practice'
import { learningSubjectOptions } from '@/types/learningProfile'
import type { QuestionBankChatLocationState } from '@/types/questionBank'
import type { TeacherHelpRequest } from '@/types/teacherHelp'

type TeacherSupportStage =
  | 'idle'
  | 'teacher_text_requested'
  | 'teacher_text_active'
  | 'video_requested'
  | 'video_lobby_ready'
  | 'video_completed'

export function ChatPage() {
  const { t } = useTranslation('chat')
  const location = useLocation()
  const navigate = useNavigate()
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [teacherHelpRequest, setTeacherHelpRequest] = useState<TeacherHelpRequest | null>(null)
  const [teacherHelpError, setTeacherHelpError] = useState<string | null>(null)
  const [teacherSupportStage, setTeacherSupportStage] = useState<TeacherSupportStage>('idle')
  const [newConversationMessage, setNewConversationMessage] = useState('')
  const [queuedInitialMessage, setQueuedInitialMessage] = useState<{
    conversationId: string
    content: string
    attachments?: ReturnType<typeof uploadAttachmentToUploadedFile>[]
  } | null>(null)
  const [uploadContext, setUploadContext] = useState<UploadChatHandoff | null>(null)

  const conversationsQuery = useConversationsQuery()
  const [selectedSubjectId, setSelectedSubjectId] = useState(learningSubjectOptions[0].id)
  const studentProfileQuery = useStudentProfileQuery()
  const practiceState = location.state as (PracticeChatLocationState & QuestionBankChatLocationState & UploadChatLocationState) | null
  const practiceContext = practiceState?.practiceContext
  const questionBankContext = practiceState?.questionBankContext
  const conversations = useMemo(
    () => conversationsQuery.data?.items ?? [],
    [conversationsQuery.data],
  )

  const selectedSubject = learningSubjectOptions.find((subject) => subject.id === selectedSubjectId)
    ?? learningSubjectOptions[0]

  useEffect(() => {
    if (!activeConversationId) return

    const activeConversationExists = conversations.some(
      (conversation) => conversation.id === activeConversationId,
    )

    if (!activeConversationExists) {
      setActiveConversationId(null)
    }
  }, [activeConversationId, conversations])

  const conversationQuery = useConversationQuery(activeConversationId)
  const createConversationMutation = useCreateConversationMutation()
  const teacherHelpMutation = useTeacherHelpMutation()
  const instantVideoHelpMutation = useInstantVideoHelp()
  const teacherHelpStatusQuery = useTeacherHelpStatusQuery(teacherHelpRequest?.requestId ?? null)
  const {
    localMessages,
    isStreaming,
    sendStreamingMessage,
    stopStreaming,
    retryMessage,
  } = useStreamingChat(activeConversationId)

  useEffect(() => {
    const nextUploadContext = practiceState?.uploadContext ?? readUploadHandoff()
    if (!nextUploadContext) return

    setUploadContext(nextUploadContext)
    setActiveConversationId(null)
    setNewConversationMessage(nextUploadContext.prompt)
  }, [location.key, practiceState?.uploadContext])

  useEffect(() => {
    const preferredSubject = subjectIdFromProfile(studentProfileQuery.data?.primarySubjects?.[0])
    if (!preferredSubject) return

    setSelectedSubjectId(preferredSubject)
  }, [studentProfileQuery.data?.primarySubjects])

  useEffect(() => {
    if (!practiceContext) return
    setActiveConversationId(null)
    setNewConversationMessage(practiceState?.prompt ?? 'Can you explain this step?')
  }, [practiceContext, practiceState?.prompt])

  useEffect(() => {
    if (!questionBankContext) return
    setActiveConversationId(null)
    setNewConversationMessage(practiceState?.prompt ?? 'Can you explain this Practice Library step?')
  }, [practiceState?.prompt, questionBankContext])

  useEffect(() => {
    setTeacherHelpRequest(null)
    setTeacherHelpError(null)
    setTeacherSupportStage('idle')
  }, [activeConversationId])

  const displayedMessages = useMemo(() => {
    const backendMessages = conversationQuery.data?.messages ?? []
    const backendMessageIds = new Set(backendMessages.map((message) => message.id))

    return [
      ...backendMessages,
      ...localMessages.filter((message) => !backendMessageIds.has(message.id)),
    ]
  }, [conversationQuery.data?.messages, localMessages])

  useEffect(() => {
    if (
      !queuedInitialMessage ||
      !activeConversationId ||
      queuedInitialMessage.conversationId !== activeConversationId ||
      !conversationQuery.data
    ) {
      return
    }

    const content = queuedInitialMessage.content
    setQueuedInitialMessage(null)
    void sendStreamingMessage({
      content,
      attachmentIds: queuedInitialMessage.attachments?.map((attachment) => attachment.id),
      attachments: queuedInitialMessage.attachments,
    })
  }, [activeConversationId, conversationQuery.data, queuedInitialMessage, sendStreamingMessage])

  function handleCreateConversation(message?: string) {
    if (createConversationMutation.isPending) return
    const initialMessage = buildInitialMessage(message?.trim() ?? '', practiceContext, questionBankContext, uploadContext)
    const initialAttachments = uploadContext?.attachments.map(uploadAttachmentToUploadedFile)

    const profile = studentProfileQuery.data
    const subject = selectedSubject.label
    const grade = profile?.grade ?? 'Grade 8'

    createConversationMutation.mutate(
      { subject, grade },
      {
        onSuccess: (conversation) => {
          setActiveConversationId(conversation.id)
          if (initialMessage) {
            setQueuedInitialMessage({
              conversationId: conversation.id,
              content: initialMessage,
              attachments: initialAttachments,
            })
          }
          setNewConversationMessage('')
          if (uploadContext) {
            clearUploadHandoff()
            setUploadContext(null)
          }
          setTeacherHelpRequest(null)
          setTeacherHelpError(null)
          setTeacherSupportStage('idle')
        },
      },
    )
  }

  function handleStartNewConversation() {
    setActiveConversationId(null)
    setTeacherHelpRequest(null)
    setTeacherHelpError(null)
    setTeacherSupportStage('idle')
    setSendError(null)
  }

  function handleSendMessage(payload: {
    content: string
    attachmentIds?: string[]
    attachments?: {
      id: string
      filename: string
      mimeType: string
      sizeBytes: number
      status: 'uploaded' | 'processing' | 'parsed' | 'failed'
      createdAt: string
    }[]
  }) {
    if (!activeConversationId || isStreaming) return

    setSendError(null)
    void sendStreamingMessage(payload)
  }

  function handleFollowUp(prompt: string) {
    if (!activeConversationId || isStreaming) return

    setSendError(null)
    void sendStreamingMessage({ content: prompt })
  }

  function handleRequestTeacherHelp() {
    if (!activeConversationId || teacherHelpMutation.isPending) return

    setTeacherHelpError(null)
    teacherHelpMutation.mutate(
      {
        conversationId: activeConversationId,
        message: 'Student requested help from a tutor.',
      },
      {
        onSuccess: (request) => {
          setTeacherHelpRequest(request)
          setTeacherSupportStage('teacher_text_requested')
        },
        onError: (error) => {
          setTeacherHelpError(toUserFacingError(error, t('teacher.failed')))
        },
      },
    )
  }

  function handleTeacherTextActive() {
    setTeacherSupportStage('teacher_text_active')
  }

  function handleStartVideoClassroom() {
    if (!activeConversationId || instantVideoHelpMutation.isPending) return

    setTeacherSupportStage('video_requested')
    instantVideoHelpMutation.mutate(
      {
        source: 'teacher_text_help',
        conversationId: activeConversationId,
        topicLabel: conversationQuery.data?.subject ?? 'Current question',
        summary: 'The student requested a live classroom after tutor support.',
      },
      {
        onSuccess: (session) => {
          setTeacherSupportStage('video_lobby_ready')
          navigate(`/classroom/sessions/${session.id}/lobby?source=chat`)
        },
        onError: () => {
          setTeacherSupportStage('teacher_text_active')
          setTeacherHelpError('We could not prepare the classroom lobby. Please try again.')
        },
      },
    )
  }

  if (conversationsQuery.isLoading) {
    return <ChatSkeleton />
  }

  if (conversationsQuery.isError) {
    return (
      <div className="chat-workspace flex h-screen items-center justify-center text-foreground">
        <ErrorState message={t('loadFailed')} />
      </div>
    )
  }

  const newConversationForm = (
    <div className="w-full max-w-2xl space-y-4">
      {practiceContext && (
        <PracticeContextCard
          context={practiceContext}
          onBackToLesson={() => navigate(practiceContext.returnTo ?? '/practice')}
        />
      )}
      {questionBankContext && (
        <QuestionBankContextCard
          context={questionBankContext}
          onBack={() => navigate(questionBankContext.returnTo ?? '/question-bank')}
        />
      )}
      {uploadContext && (
        <UploadLearningContextCard
          context={uploadContext}
          onBack={() => navigate(uploadContext.returnTo ?? '/dashboard')}
        />
      )}
      <div className="brand-rule rounded-lg border bg-card p-5 shadow-[var(--platform-shadow-soft)]">
        <EmptyState
          message={
            questionBankContext
              ? 'Review this question step with the Learning Assistant.'
              : uploadContext
                ? uploadContext.description
              : practiceContext
                ? t('practiceContext.welcome')
                : t('welcome')
          }
        />
        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (createConversationMutation.isPending) return
            handleCreateConversation(newConversationMessage)
          }}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">Subject for this question</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {learningSubjectOptions.map((subject) => {
                const selected = subject.id === selectedSubjectId
                return (
                  <button
                    key={subject.id}
                    type="button"
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 text-left text-sm transition ${
                      selected
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                    onClick={() => setSelectedSubjectId(subject.id)}
                    aria-pressed={selected}
                  >
                    <span className="font-medium">{subject.label}</span>
                    <Badge variant={subject.rolloutState === 'active' ? 'default' : 'secondary'}>
                      {subject.rolloutState === 'active' ? 'Active' : 'Foundation'}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>
          <Textarea
            value={newConversationMessage}
            onChange={(event) => setNewConversationMessage(event.target.value)}
            placeholder={questionBankContext ? 'Ask what is unclear in this question...' : uploadContext ? 'Tell the Learning Assistant what part is unclear...' : practiceContext ? t('practiceContext.placeholder') : t('placeholder')}
            className="min-h-24 resize-none"
            disabled={createConversationMutation.isPending}
            aria-label={t('newConversationLabel')}
          />
          {createConversationMutation.isError && (
            <p className="text-xs text-destructive" role="alert">
              {toUserFacingError(createConversationMutation.error, t('createFailed'))}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={createConversationMutation.isPending}
          >
            {createConversationMutation.isPending ? t('starting') : t('startConversation')}
          </Button>
        </form>
      </div>
    </div>
  )

  if (conversations.length === 0) {
    return (
      <div className="chat-workspace flex h-screen items-center justify-center px-4 text-foreground">
        {newConversationForm}
      </div>
    )
  }

  return (
    <div className="chat-workspace flex h-screen overflow-hidden text-foreground">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId ?? ''}
        onSelectConversation={setActiveConversationId}
        onCreateConversation={handleStartNewConversation}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          conversation={conversationQuery.data ?? null}
          onCreateConversation={handleStartNewConversation}
        />
        {!activeConversationId && (
          <div className="flex flex-1 items-center justify-center px-4">
            {newConversationForm}
          </div>
        )}
        {activeConversationId && conversationQuery.isLoading && (
          <div className="flex-1 overflow-hidden">
            <ChatSkeleton compact />
          </div>
        )}
        {activeConversationId && conversationQuery.isError && (
          <div className="flex flex-1 items-center justify-center">
            <ErrorState message={t('conversationLoadFailed')} />
          </div>
        )}
        {activeConversationId && conversationQuery.data && (
          <>
            {practiceContext && (
              <PracticeContextCard
                context={practiceContext}
                onBackToLesson={() => navigate(practiceContext.returnTo ?? '/practice')}
              />
            )}
            {questionBankContext && (
              <QuestionBankContextCard
                context={questionBankContext}
                onBack={() => navigate(questionBankContext.returnTo ?? '/question-bank')}
              />
            )}
            {uploadContext && (
              <UploadLearningContextCard
                context={uploadContext}
                onBack={() => navigate(uploadContext.returnTo ?? '/dashboard')}
              />
            )}
            <ChatMessageList
              key={activeConversationId}
              messages={displayedMessages}
              isAssistantThinking={false}
              onRetryMessage={retryMessage}
              onRequestTeacher={handleRequestTeacherHelp}
              isRequestingTeacher={teacherHelpMutation.isPending}
              teacherFeedback={
                teacherHelpError ??
                (teacherHelpStatusQuery.data || teacherHelpRequest
                  ? t('teacher.submitted')
                  : null)
              }
              moderationTargetId={activeConversationId}
              onFollowUp={handleFollowUp}
              isFollowUpDisabled={isStreaming}
            />
            {(teacherHelpRequest || teacherSupportStage !== 'idle') && (
              <TeacherVideoEscalationCard
                stage={teacherSupportStage}
                isStartingVideo={instantVideoHelpMutation.isPending}
                onTeacherTextActive={handleTeacherTextActive}
                onStartVideo={handleStartVideoClassroom}
              />
            )}
            {sendError && (
              <div className="px-4 pb-3 md:px-6">
                <div className="mx-auto max-w-3xl text-xs text-destructive" role="alert">
                  {sendError}
                </div>
              </div>
            )}
            <ChatInput
              onSendMessage={handleSendMessage}
              onStopStreaming={stopStreaming}
              isStreaming={isStreaming}
              disabled={!activeConversationId}
              conversationId={activeConversationId ?? undefined}
            />
          </>
        )}
      </main>
    </div>
  )
}

function TeacherVideoEscalationCard({
  stage,
  isStartingVideo,
  onTeacherTextActive,
  onStartVideo,
}: {
  stage: TeacherSupportStage
  isStartingVideo: boolean
  onTeacherTextActive: () => void
  onStartVideo: () => void
}) {
  const isTextActive = stage === 'teacher_text_active' || stage === 'video_requested' || stage === 'video_lobby_ready'

  return (
    <section className="px-4 pb-3 md:px-6" aria-live="polite">
      <div className="mx-auto max-w-3xl rounded-lg border border-primary/15 bg-card p-4 shadow-[var(--platform-shadow-soft)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="brand-section-kicker">Tutor support</p>
            <h2 className="mt-2 text-lg font-semibold">
              {isTextActive ? 'Tutor joined' : 'Tutor support requested'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isTextActive
                ? 'The Learning Assistant is observing while your tutor helps. Start a live classroom if you still need deeper support.'
                : 'A tutor will join this conversation when available. You can continue with the Learning Assistant while waiting.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {!isTextActive && (
              <Button type="button" variant="outline" onClick={onTeacherTextActive}>
                Tutor joined
              </Button>
            )}
            {isTextActive && (
              <Button type="button" onClick={onStartVideo} disabled={isStartingVideo}>
                <Video className="h-4 w-4" aria-hidden="true" />
                {isStartingVideo ? 'Preparing lobby...' : 'Start Live Classroom'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function buildInitialMessage(
  message: string,
  practiceContext: PracticeChatLocationState['practiceContext'],
  questionBankContext?: QuestionBankChatLocationState['questionBankContext'],
  uploadContext?: UploadChatHandoff | null,
) {
  if (uploadContext) {
    return [
      message || uploadContext.prompt,
      '',
      `Upload source: ${uploadContext.title}`,
      uploadContext.sessionId ? `Question session: ${uploadContext.sessionId}` : '',
      uploadContext.questionId ? `Question: ${uploadContext.questionId}` : '',
      uploadContext.attachments.length > 0
        ? `Attached learning material: ${uploadContext.attachments.map((attachment) => attachment.fileName).join(', ')}`
        : '',
    ].filter(Boolean).join('\n')
  }

  if (questionBankContext) {
    const question = message || 'Can you explain this question step?'

    return [
      question,
      '',
      `Practice Library set: ${questionBankContext.setTitle}`,
      `Practice Library topic: ${questionBankContext.topic}`,
      `Question: ${questionBankContext.challengePrompt}`,
      questionBankContext.studentAnswer ? `My answer: ${questionBankContext.studentAnswer}` : '',
    ].filter(Boolean).join('\n')
  }

  if (!practiceContext) {
    return message
  }

  const question = message || 'Can you explain this step?'

  return [
    question,
    '',
    `Practice topic: ${practiceContext.topic}`,
    `Practice question: ${practiceContext.challengePrompt}`,
    practiceContext.studentAnswer ? `My answer: ${practiceContext.studentAnswer}` : '',
    typeof practiceContext.attempts === 'number' ? `Attempts: ${practiceContext.attempts}` : '',
    practiceContext.hintViewed ? 'Hint viewed: yes' : '',
  ].filter(Boolean).join('\n')
}

function UploadLearningContextCard({
  context,
  onBack,
}: {
  context: UploadChatHandoff
  onBack: () => void
}) {
  return (
    <section className="mx-auto mt-4 w-full max-w-3xl rounded-lg border border-primary/15 bg-card/95 p-4 shadow-[var(--platform-shadow-soft)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="brand-section-kicker">Uploaded learning material</p>
          <h2 className="mt-2 text-lg font-semibold">{context.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{context.description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onBack}>Back</Button>
      </div>
      <div className="mt-4">
        <AttachmentPreviewList attachments={context.attachments} compact />
      </div>
    </section>
  )
}

function subjectIdFromProfile(subject: string | undefined) {
  if (!subject) return undefined
  const normalized = subject.toLowerCase()
  return learningSubjectOptions.find((option) => (
    normalized.includes(option.id)
    || normalized.includes(option.label.toLowerCase())
  ))?.id
}
