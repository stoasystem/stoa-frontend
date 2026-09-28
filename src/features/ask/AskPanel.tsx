import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Composer, IconButton, PresenceDot } from '@/components/base'
import { conversationDisplayTitle, subjectDisplayLabel } from '@/components/chat/conversationTitle'
import { AskConversationList, AskEmptyState } from '@/features/ask/AskConversationList'
import { AskMessage } from '@/features/ask/AskMessage'
import { ASK_PANEL } from '@/features/ask/askLayout'
import { TeacherHelpAction, TeacherHelpStatusCard } from '@/features/ask/TeacherHelp'
import type { AskController } from '@/features/ask/useAskController'
import { useAskConversation } from '@/features/ask/useAskConversation'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { useCreateConversationMutation } from '@/hooks/chat/useCreateConversationMutation'
import { useTeacherAvailabilityQuery } from '@/hooks/chat/useTeacherAvailabilityQuery'
import { useRecommendationsQuery } from '@/hooks/learning/useWeakTopicsQuery'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { conversationGrade } from '@/lib/conversationGrade'
import { teacherHelpErrorKey } from '@/lib/teacherHelpErrors'
import { toUserFacingError } from '@/lib/userFacingText'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
import { useAskStore } from '@/store/askStore'
import { learningSubjectOptions } from '@/types/learningProfile'
import type { ChatMessage } from '@/types/chat'

export type AskLayout = 'panel' | 'sheet'

/** The subject a new conversation is about: the planet's, else the student's first, else maths. */
function subjectFor(subjectId: string | undefined, primarySubject: string | undefined) {
  const known = (id: string | undefined) =>
    id ? learningSubjectOptions.find((option) => id.toLowerCase().includes(option.id))?.id : undefined
  return known(subjectId) ?? known(primarySubject) ?? learningSubjectOptions[0].id
}

/**
 * What Ask shows, in the desktop panel and in the phone sheet alike: the
 * conversation list while none is open (#12 point 1), or one conversation with
 * a back arrow to the list; the composer at the bottom either way. Sending
 * from the list starts a new conversation.
 */
export function AskPanel({
  controller,
  layout,
  subjectId,
  headerHandle,
}: {
  controller: AskController
  layout: AskLayout
  subjectId?: string
  /** Pointer handlers that make the header the sheet's drag handle. */
  headerHandle?: HTMLAttributes<HTMLElement>
}) {
  const { t } = useTranslation('chat')
  const { conversationId, draft, setDraft, select, close } = controller
  const conversationsQuery = useConversationsQuery()
  const availability = useTeacherAvailabilityQuery().data
  const teachersOnline = availability?.online
  const profile = useStudentProfileQuery().data
  const createConversation = useCreateConversationMutation()
  const queued = useAskStore((state) => state.queued)
  const queue = useAskStore((state) => state.queue)
  const ask = useAskConversation(conversationId)
  const { sendStreamingMessage, isStreaming, conversation } = ask
  const phone = layout === 'sheet'
  const subject = subjectFor(subjectId, profile?.primarySubjects?.[0])

  // The first message of a conversation just started goes out once it is open.
  useEffect(() => {
    if (!queued || !conversationId || queued.conversationId !== conversationId || !conversation) return
    queue(null)
    void sendStreamingMessage({ content: queued.content })
  }, [conversation, conversationId, queue, queued, sendStreamingMessage])

  function startConversation(content: string) {
    if (createConversation.isPending) return
    createConversation.mutate(
      { subject, grade: conversationGrade(profile?.grade) },
      {
        onSuccess: (created) => {
          queue({ conversationId: created.id, content })
          setDraft('')
          select(created.id)
        },
      },
    )
  }

  function submit(value: string) {
    const content = value.trim()
    if (!content) return
    if (!conversationId) {
      startConversation(content)
      return
    }
    if (isStreaming) return
    setDraft('')
    void sendStreamingMessage({ content })
  }

  const conversationTitle = conversation ? conversationDisplayTitle(conversation, t) : ''
  const title = conversationId ? conversationTitle || t('ask.title') : t('ask.title')
  const subtitle = conversationId
    ? conversation
      ? subjectDisplayLabel(conversation.subject, t)
      : ''
    : t('ask.listSubtitle')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        {...headerHandle}
        className={cn('flex shrink-0 items-center gap-2.5 border-b border-separator', phone && 'touch-none')}
        style={
          phone
            ? { padding: '6px 12px 8px 16px' }
            : { height: ASK_PANEL.headerHeight, padding: '0 12px 0 18px' }
        }
      >
        {conversationId && (
          <IconButton
            label={t('ask.back')}
            icon={ChevronLeft}
            size={30}
            hitSize={phone ? 44 : undefined}
            onClick={() => select(null)}
            className="-ml-2"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-[15px] font-semibold leading-[1.3] text-ink">{title}</h2>
          {subtitle && <p className="truncate text-[12px] leading-[1.3] text-caption">{subtitle}</p>}
        </div>
        {!phone && availability && (
          <span role="status" className="inline-flex shrink-0 items-center gap-[7px] text-[13px] text-caption">
            <PresenceDot className={teachersOnline ? undefined : 'bg-tertiary'} />
            {teachersOnline
              ? t('ask.presence.online', { count: availability.availableTeachers })
              : t('ask.presence.offline')}
          </span>
        )}
        <IconButton label={t('ask.close')} icon={X} size={30} hitSize={phone ? 44 : undefined} variant="gray" onClick={close} />
      </header>

      {conversationId ? (
        <AskThread
          key={conversationId}
          conversationId={conversationId}
          ask={ask}
          layout={layout}
          teachersOnline={teachersOnline}
          starting={queued?.conversationId === conversationId}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto" style={{ padding: phone ? '8px 6px' : '10px 8px' }}>
          {conversationsQuery.isLoading ? (
            <p className="px-3 py-4 text-[13px] text-caption">{t('ask.list.loading')}</p>
          ) : conversationsQuery.isError ? (
            <div className="flex flex-col items-start gap-2 px-3 py-4">
              <p role="alert" className="text-[13px] text-caption">
                {t('ask.list.failed')}
              </p>
              <Button variant="plain" size="small" onClick={() => void conversationsQuery.refetch()}>
                {t('ask.list.retry')}
              </Button>
            </div>
          ) : (conversationsQuery.data?.items.length ?? 0) === 0 ? (
            <RecommendedEmptyState subject={subject} onAsk={startConversation} disabled={createConversation.isPending} />
          ) : (
            <AskConversationList conversations={conversationsQuery.data?.items ?? []} onSelect={(id) => select(id)} />
          )}
          {createConversation.isPending && (
            <p role="status" className="px-3 py-2 text-[13px] text-caption">
              {t('ask.thread.starting')}
            </p>
          )}
          {createConversation.isError && (
            <p role="alert" className="px-3 py-2 text-[13px] text-red">
              {toUserFacingError(createConversation.error, t('ask.thread.startFailed'))}
            </p>
          )}
        </div>
      )}

      <div className="shrink-0" style={{ padding: phone ? '0 12px 34px' : '0 14px 16px' }}>
        {isStreaming && (
          <div className="flex justify-end pb-1">
            <Button variant="plain" size="small" onClick={ask.stopStreaming}>
              {t('ask.thread.stop')}
            </Button>
          </div>
        )}
        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          label={t('ask.composerLabel')}
          placeholder={t('ask.placeholder')}
          busy={isStreaming || createConversation.isPending}
        />
      </div>
    </div>
  )
}

/** No conversation yet: one of the questions offered is about the point recommended now. */
function RecommendedEmptyState({
  subject,
  onAsk,
  disabled,
}: {
  subject: string
  onAsk: (question: string) => void
  disabled: boolean
}) {
  const { recommendations } = useRecommendationsQuery(subject)
  return <AskEmptyState recommendedPoint={recommendations[0]?.label} onAsk={onAsk} disabled={disabled} />
}

function AskThread({
  conversationId,
  ask,
  layout,
  teachersOnline,
  starting,
}: {
  conversationId: string
  ask: ReturnType<typeof useAskConversation>
  layout: AskLayout
  teachersOnline: boolean | undefined
  starting: boolean
}) {
  const { t } = useTranslation('chat')
  const queryClient = useQueryClient()
  const scroller = useRef<HTMLDivElement>(null)
  const [helpError, setHelpError] = useState<string | null>(null)
  const { messages, help, helpActive, isStreaming, retryMessage, conversationQuery } = ask

  const requestHelp = useMutation({
    mutationFn: () => createTeacherHelpRequest({ conversationId }),
    onSuccess: (request) => {
      setHelpError(null)
      trackEvent('teacher_help_requested', {
        requestId: request.requestId,
        conversationId: request.conversationId,
        status: request.status,
      })
      // The card shows the request as the server reports it, read back from
      // the server: not the answer to this POST, and never a guess.
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.teacherHelpRequest(conversationId) })
    },
    onError: (error) => {
      trackEvent('teacher_help_request_failed', { reason: teacherHelpErrorKey(error) })
      setHelpError(t(teacherHelpErrorKey(error)))
    },
  })

  const lastAnswerId = latestAnswerId(messages)
  const offerHelp = !helpActive && !isStreaming && !requestHelp.isPending

  // Keep the latest message in view as the thread grows.
  useLayoutEffect(() => {
    const node = scroller.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages])

  return (
    <>
      {help && (
        <div className="shrink-0" style={{ padding: layout === 'sheet' ? '10px 14px 0' : '12px 18px 0' }}>
          <TeacherHelpStatusCard request={help} teachersOnline={teachersOnline} />
        </div>
      )}
      <div
        ref={scroller}
        role="log"
        aria-label={t('ask.thread.label')}
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        style={{ gap: layout === 'sheet' ? 10 : 12, padding: layout === 'sheet' ? '12px 14px' : '16px 18px' }}
      >
        <div className="flex-1" />
        {conversationQuery.isLoading && !starting ? (
          <p className="text-[13px] text-caption">{t('ask.thread.loading')}</p>
        ) : conversationQuery.isError ? (
          <div className="flex flex-col items-start gap-2">
            <p role="alert" className="text-[13px] text-caption">
              {t('ask.thread.failed')}
            </p>
            <Button variant="plain" size="small" onClick={() => void conversationQuery.refetch()}>
              {t('ask.thread.retry')}
            </Button>
          </div>
        ) : null}
        {messages.map((message) => (
          <AskMessage
            key={message.id}
            message={message}
            teacherName={help?.teacherName}
            onRetry={retryMessage}
            after={
              message.id === lastAnswerId && (offerHelp || requestHelp.isPending) ? (
                <TeacherHelpAction
                  onRequest={() => requestHelp.mutate()}
                  requesting={requestHelp.isPending}
                  teachersOnline={teachersOnline}
                  error={helpError}
                />
              ) : undefined
            }
          />
        ))}
      </div>
    </>
  )
}

/** The latest answer the assistant finished: the request for a teacher sits under it. */
function latestAnswerId(messages: readonly ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role === 'assistant') {
      return message.status === 'streaming' || message.status === 'failed' ? null : message.id
    }
  }
  return null
}
