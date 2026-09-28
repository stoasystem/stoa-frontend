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
import { rememberPendingMessage } from '@/lib/pendingChatMessages'
import { teacherHelpErrorKey } from '@/lib/teacherHelpErrors'
import { toUserFacingError } from '@/lib/userFacingText'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
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
  // The first question goes out with the conversation itself
  // (`POST /conversations` with `initialMessage`), so it is sent exactly when
  // the student sends it: never later, and not lost if Ask closes or the page
  // reloads before the conversation opens. Its answer comes on the command the
  // backend keys `initial-<id>`; it is remembered as a message waiting for its
  // answer, which the conversation picks up when it opens (after a reload too).
  const createConversation = useCreateConversationMutation({
    onCreated: (created, payload) => {
      if (!payload.initialMessage) return
      rememberPendingMessage(created.id, {
        idempotencyKey: `initial-${created.id}`,
        content: payload.initialMessage,
        askedAt: askedAtRef.current ?? new Date().toISOString(),
      })
    },
  })
  // Two sends in one tick would start two conversations.
  const creatingRef = useRef(false)
  const askedAtRef = useRef<string | null>(null)
  const ask = useAskConversation(conversationId)
  const { sendStreamingMessage, isStreaming, conversation } = ask
  const phone = layout === 'sheet'
  const subject = subjectFor(subjectId, profile?.primarySubjects?.[0])

  // Whether this panel is still on screen when the conversation comes back.
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  function startConversation(content: string) {
    if (creatingRef.current || createConversation.isPending) return
    creatingRef.current = true
    askedAtRef.current = new Date().toISOString()
    // Sent is sent: the question leaves the composer now, so closing Ask while
    // the conversation is being made cannot leave it there to be sent twice.
    // It comes back only if the conversation could not be made.
    setDraft('')
    createConversation
      .mutateAsync({ subject, grade: conversationGrade(profile?.grade), initialMessage: content })
      .then(
        (created) => {
          // Opened only in the panel that asked; a closed Ask stays closed.
          if (mounted.current) select(created.id)
        },
        () => {
          // Unless the student has started another question meanwhile.
          if (!controller.readDraft()) setDraft(content)
        },
      )
      .finally(() => {
        creatingRef.current = false
      })
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
}: {
  conversationId: string
  ask: ReturnType<typeof useAskConversation>
  layout: AskLayout
  teachersOnline: boolean | undefined
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

  // Keep the latest message in view as the thread grows -- unless the student
  // has scrolled up to read something earlier.
  const atBottom = useRef(true)
  useLayoutEffect(() => {
    const node = scroller.current
    if (node && atBottom.current) node.scrollTop = node.scrollHeight
  }, [messages])
  const onScroll = () => {
    const node = scroller.current
    if (node) atBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < STICK_TO_BOTTOM_PX
  }
  const announcement = useFinishedReplyAnnouncement(messages, conversationQuery.isSuccess, {
    teacher: help?.teacherName?.trim() || t('ask.thread.teacherFallback'),
  })

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
        // An answer is written a few words at a time; read out whole, once
        // finished, by the announcer below -- not token by token.
        aria-live="off"
        onScroll={onScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        style={{ gap: layout === 'sheet' ? 10 : 12, padding: layout === 'sheet' ? '12px 14px' : '16px 18px' }}
      >
        <div className="flex-1" />
        {conversationQuery.isLoading ? (
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
      <p className="sr-only" aria-live="polite" data-ask-announcer>
        {announcement}
      </p>
    </>
  )
}

/** How near the bottom still counts as reading the latest message. */
const STICK_TO_BOTTOM_PX = 48

/**
 * The reply to read out: an answer or a teacher's message once it is whole.
 * What was already there when the conversation opened is not announced.
 */
function useFinishedReplyAnnouncement(
  messages: readonly ChatMessage[],
  loaded: boolean,
  names: { teacher: string },
) {
  const [announcement, setAnnouncement] = useState('')
  const seen = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!loaded) return
    const finished = messages.filter(
      (message) =>
        (message.role === 'assistant' || message.role === 'teacher') &&
        message.status !== 'streaming' &&
        message.content.length > 0,
    )
    if (seen.current === null) {
      seen.current = new Set(finished.map((message) => message.id))
      return
    }
    const known = seen.current
    const fresh = finished.filter((message) => !known.has(message.id))
    for (const message of fresh) known.add(message.id)
    const latest = fresh[fresh.length - 1]
    // A teacher's reply says who it is from; an answer is the assistant's.
    if (latest) setAnnouncement(latest.role === 'teacher' ? `${names.teacher}: ${latest.content}` : latest.content)
  }, [loaded, messages, names.teacher])
  return announcement
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
