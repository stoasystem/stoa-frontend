import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, Composer, IconButton, PresenceDot } from '@/components/base'
import { conversationDisplayTitle, subjectDisplayLabel } from '@/components/chat/conversationTitle'
import { GRADE_SECTION_ID } from '@/features/account/GradeGroup'
import { AskConversationList, AskEmptyState } from '@/features/ask/AskConversationList'
import { AskLitCard } from '@/features/ask/AskLitCard'
import { AskMessage } from '@/features/ask/AskMessage'
import { ASK_PANEL } from '@/features/ask/askLayout'
import { TeacherHelpAction, TeacherHelpStatusCard } from '@/features/ask/TeacherHelp'
import type { AskController } from '@/features/ask/useAskController'
import { useAskConversation } from '@/features/ask/useAskConversation'
import {
  quoteBelongs,
  quoteField,
  useAskQuoteStore,
  type AskPractice,
  type AskQuote,
} from '@/features/ask/practiceContext'

// The paperclip and the camera wait behind this switch; why, and who opens
// it (#512), is written where it is set.
import { ATTACHMENTS_WORK } from '@/features/ask/attachmentsSwitch'
import { AttachmentTray } from '@/features/uploads/AttachmentTray'
import { useAttachmentUploads } from '@/features/uploads/useAttachmentUploads'
import { ACCEPT_ATTRIBUTE, CAMERA_ACCEPT_ATTRIBUTE } from '@/services/files/uploadLimits'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { useCreateConversationMutation } from '@/hooks/chat/useCreateConversationMutation'
import { TOUCH_QUERY, useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { useTeacherAvailabilityQuery } from '@/hooks/chat/useTeacherAvailabilityQuery'
import { useRecommendationsQuery } from '@/hooks/learning/useWeakTopicsQuery'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { conversationGrade } from '@/lib/conversationGrade'
import { rememberPendingMessage } from '@/lib/pendingChatMessages'
import { teacherHelpErrorKey } from '@/lib/teacherHelpErrors'
import { toUserFacingError } from '@/lib/userFacingText'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { ApiError } from '@/services/api/httpClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
import { sendDetached } from '@/services/chat/detachedSend'
import { useAuthStore } from '@/store/authStore'
import { litMomentsFor, useLitMoments, type LitMoment } from '@/store/litMomentsStore'
import { learningSubjectOptions } from '@/types/learningProfile'
import { QUOTE_MAX_LENGTH, type ChatMessage, type PracticeContextRef } from '@/types/chat'

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
  practice,
}: {
  controller: AskController
  layout: AskLayout
  subjectId?: string
  /** Pointer handlers that make the header the sheet's drag handle. */
  headerHandle?: HTMLAttributes<HTMLElement>
  /**
   * Beside the practice stage: the exercise on screen, whose ids go out with
   * the question as `practiceContext` (#56). Nothing of its wording does.
   */
  practice?: AskPractice
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
        // The same fields the server took it with, or sending it again under
        // the same key is refused as a different message (#327 K3).
        ...(payload.practiceContext ? { practiceContext: payload.practiceContext } : {}),
      })
    },
  })
  // Two sends in one tick would start two conversations.
  const creatingRef = useRef(false)
  const askedAtRef = useRef<string | null>(null)
  // The conversation a refused first question left behind (#327 K4): asking
  // that question again goes into it, not into another empty one.
  const refusedRef = useRef<RefusedConversation | null>(null)
  const ask = useAskConversation(conversationId)
  const { sendStreamingMessage, isStreaming, conversation } = ask
  const phone = layout === 'sheet'
  const subject = subjectFor(subjectId, profile?.primarySubjects?.[0])

  // Whether this panel is still on screen when the conversation comes back,
  // and still on the list rather than in a conversation the student opened
  // meanwhile.
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const openConversation = useRef(conversationId)
  useEffect(() => {
    openConversation.current = conversationId
  }, [conversationId])

  // The list and a conversation take each other's place, and the row or the
  // back arrow that was pressed goes with them, so the keyboard was left on
  // the page (#408). It goes to the conversation's title, or back to the row
  // it left (else the list, else the title) -- only when it was lost, so a
  // question sent from the list keeps the cursor in the composer.
  const heading = useRef<HTMLHeadingElement>(null)
  const listArea = useRef<HTMLDivElement>(null)
  const shown = useRef(conversationId)
  useEffect(() => {
    const left = shown.current
    shown.current = conversationId
    if (left === conversationId) return
    if (document.activeElement && document.activeElement !== document.body) return
    if (conversationId) {
      heading.current?.focus()
      return
    }
    const rows = Array.from(listArea.current?.querySelectorAll<HTMLElement>('[data-conversation-id]') ?? [])
    const row = rows.find((candidate) => candidate.dataset.conversationId === left)
    ;(row ?? listArea.current?.querySelector<HTMLElement>('[data-ask-list]') ?? heading.current)?.focus()
  }, [conversationId])

  // The passage 「问这段」 put aside, waiting to go out with the next question:
  // only where it was taken from (#263).
  const chosenQuote = useAskQuoteStore((state) => state.quote)
  const setQuote = useAskQuoteStore((state) => state.setQuote)
  const quote =
    chosenQuote &&
    quoteBelongs(chosenQuote, { challengeId: practice?.context.challengeId ?? null, conversationId })
      ? chosenQuote
      : null
  const clearQuote = () => setQuote(null)
  // The files chosen for the next question, uploaded as they are picked (#125).
  const attachments = useAttachmentUploads()
  const picker = useRef<HTMLInputElement>(null)
  // Taking a photo and choosing one are two entries (#509): with `capture` a
  // phone opens the camera and offers no gallery, without it the gallery and
  // files. Only where the camera opens is there a camera to show.
  const camera = useRef<HTMLInputElement>(null)
  const touch = useMediaQuery(TOUCH_QUERY)
  const { clearSent } = attachments

  // The exercise on screen goes out with every question asked beside it: the
  // backend reads the exercise, the chapter and the learning state from the
  // three ids itself (#56). Away from the stage the key is absent altogether.
  const practiceField = practice ? { practiceContext: practice.context } : {}

  function startConversation(content: string, quote?: AskQuote | null) {
    if (creatingRef.current || createConversation.isPending) return
    // A file that waited past its upload's 30 minutes says so in the tray.
    if (attachments.expireStale()) return
    const attachmentIds = attachments.readyReferences
    const carried = attachmentIds.length > 0
    const grade = conversationGrade(profile?.grade)
    const askedAt = new Date().toISOString()
    askedAtRef.current = askedAt
    // Sent is sent: the question leaves the composer now, so closing Ask while
    // the conversation is being made cannot leave it there to be sent twice.
    // It comes back only if the conversation could not be made.
    setDraft('')
    const readyAttachments = attachments.readyAttachments
    const practiceContext = practice?.context
    // Sent into a conversation as a message of its own -- into that
    // conversation only, and whether or not Ask is still open by then (#263).
    const sendInto = (id: string, idempotencyKey: string) => {
      sendDetached(id, {
        idempotencyKey,
        content,
        askedAt,
        ...(attachmentIds.length > 0 ? { attachmentIds, attachments: readyAttachments } : {}),
        ...(practiceContext ? { practiceContext } : {}),
        ...(quote ? { quote: quoteField(quote) } : {}),
      })
      // Gone with the question -- unless another was chosen meanwhile.
      if (quote && useAskQuoteStore.getState().quote === quote) clearQuote()
      clearSent()
    }
    // Opened only in the panel that asked, and only if the student is still
    // on the list: a closed Ask stays closed, and a conversation the student
    // opened meanwhile stays open.
    const open = (id: string) => {
      if (mounted.current && openConversation.current === null) select(id)
    }

    // The refused question asked again as it was goes into the conversation
    // made for it, under the key the server named for it. Any other question
    // starts a conversation of its own, as usual: in the refused one it would
    // sit under the refused question's title (#370).
    const refused = refusedRef.current
    if (
      refused &&
      refused.subject === subject &&
      refused.grade === grade &&
      refused.content === content &&
      !quote &&
      !carried &&
      sameContext(refused.practiceContext, practiceContext)
    ) {
      refusedRef.current = null
      createConversation.reset()
      sendInto(refused.id, `initial-${refused.id}`)
      open(refused.id)
      return
    }

    creatingRef.current = true
    // `POST /conversations` takes neither a quote nor a file, so a question
    // carrying either starts the conversation empty and is sent into it as a
    // message of its own (#263).
    const held = quote || carried
    createConversation
      .mutateAsync({
        subject,
        grade,
        ...(held ? {} : { initialMessage: content }),
        ...practiceField,
      })
      .then(
        (created) => {
          if (held) sendInto(created.id, `held-${created.id}`)
          open(created.id)
        },
        (error: unknown) => {
          // The conversation was made and only its first question refused:
          // the refusal names it (#327 K4).
          const made = refusedConversationId(error)
          if (made && !held) {
            refusedRef.current = { id: made, subject, grade, content, practiceContext }
          }
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
    // Pressing send while a file is still going up is held by the composer's
    // `busy`, which says so; this is the second lock, so a question can never
    // leave without the file it was written for.
    if (attachments.uploading) return
    // A file that waited past its upload's 30 minutes is chosen again first.
    if (attachments.expireStale()) return
    if (!conversationId) {
      startConversation(content, quote)
      return
    }
    if (isStreaming) return
    const attachmentIds = attachments.readyReferences
    const carried = attachments.readyAttachments
    setDraft('')
    clearQuote()
    clearSent()
    void sendStreamingMessage({
      content,
      ...practiceField,
      ...(quote ? { quote: quoteField(quote) } : {}),
      ...(attachmentIds.length > 0 ? { attachmentIds, attachments: carried } : {}),
    })
  }

  // Named as the list names it until it is read itself, so the title the
  // keyboard lands on says which conversation opened, not "Ask" (#452).
  const named = conversation ?? conversationsQuery.data?.items.find((item) => item.id === conversationId)
  const conversationTitle = named ? conversationDisplayTitle(named, t) : ''
  const title = conversationId ? conversationTitle || t('ask.title') : t('ask.title')
  const subtitle = conversationId
    ? named
      ? subjectDisplayLabel(named.subject, t)
      : ''
    : practice
      ? t('ask.practice.subtitle')
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
          <h2 ref={heading} tabIndex={-1} className="truncate text-[15px] font-semibold leading-[1.3] text-ink outline-none">
            {title}
          </h2>
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
        <div ref={listArea} className="flex min-h-0 flex-1 flex-col overflow-y-auto" style={{ padding: phone ? '8px 6px' : '10px 8px' }}>
          {/* A list on screen stays when a read behind it fails: the reads that
              follow a conversation (#405, #452), a language switch (#457). */}
          {conversationsQuery.isError && conversationsQuery.data && (
            <div className="flex flex-col items-start gap-2 px-3 py-2">
              <p role="alert" className="text-[13px] text-caption">
                {t('ask.list.refreshFailed')}
              </p>
              <Button variant="plain" size="small" onClick={() => void conversationsQuery.refetch()}>
                {t('ask.list.retry')}
              </Button>
            </div>
          )}
          {conversationsQuery.isLoading ? (
            <p className="px-3 py-4 text-[13px] text-caption">{t('ask.list.loading')}</p>
          ) : conversationsQuery.isError && !conversationsQuery.data ? (
            <div className="flex flex-col items-start gap-2 px-3 py-4">
              <p role="alert" className="text-[13px] text-caption">
                {t('ask.list.failed')}
              </p>
              <Button variant="plain" size="small" onClick={() => void conversationsQuery.refetch()}>
                {t('ask.list.retry')}
              </Button>
            </div>
          ) : (conversationsQuery.data?.items.length ?? 0) === 0 ? (
            <RecommendedEmptyState
              subject={subject}
              onAsk={(question) => startConversation(question, quote)}
              disabled={createConversation.isPending}
            />
          ) : (
            <AskConversationList conversations={conversationsQuery.data?.items ?? []} onSelect={(id) => select(id)} />
          )}
          {/* Here before it has anything to say, so what it says is read (#408). */}
          <div role="status" data-ask-starting>
            {createConversation.isPending && (
              <p className="px-3 py-2 text-[13px] text-caption">{t('ask.thread.starting')}</p>
            )}
          </div>
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
        {/*
          A student with no year group gets answers pitched at nobody in
          particular. The old chat page said so; Ask replaced that page and
          the sentence did not come with it, so for months the only person
          who could fix it was never told (#154).
        */}
        {profile && !conversationGrade(profile.grade) && (
          <p id="ask-grade-missing" className="m-0 pb-1 text-[13px] text-[color:var(--on-sky-text-body)]">
            <Link to={`/me#${GRADE_SECTION_ID}`} className="text-[color:var(--on-sky-plain)] underline underline-offset-2">
              {t('gradeMissingHint')}
            </Link>
          </p>
        )}
        {quote && <PendingQuote quote={quote} onRemove={clearQuote} />}
        <AttachmentTray drafts={attachments.drafts} overflow={attachments.overflow} onRemove={attachments.remove} />
        <input
          ref={picker}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(event) => {
            attachments.add(Array.from(event.target.files ?? []))
            // Cleared, so choosing the same file twice in a row still fires.
            event.target.value = ''
          }}
        />
        <input
          ref={camera}
          type="file"
          accept={CAMERA_ACCEPT_ATTRIBUTE}
          capture="environment"
          data-ask-camera
          className="hidden"
          onChange={(event) => {
            attachments.add(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          onAttach={ATTACHMENTS_WORK ? () => picker.current?.click() : undefined}
          onCapture={ATTACHMENTS_WORK && touch ? () => camera.current?.click() : undefined}
          dictationHint="inline"
          label={t('ask.composerLabel')}
          placeholder={practice ? t('ask.practice.placeholder') : t('ask.placeholder')}
          busy={isStreaming || createConversation.isPending || attachments.uploading}
          describedBy={profile && !conversationGrade(profile.grade) ? 'ask-grade-missing' : undefined}
        />
      </div>
    </div>
  )
}

/**
 * The passage waiting to go out with the next question, above the composer,
 * with the note that it had to be shortened to what the backend takes (#56).
 */
function PendingQuote({ quote, onRemove }: { quote: AskQuote; onRemove: () => void }) {
  const { t } = useTranslation('chat')
  return (
    <div
      data-ask-pending-quote={quote.source.kind}
      className="mb-1.5 flex items-start gap-2 rounded-[12px] border border-[color:var(--card-border)] bg-surface px-3 py-2"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[12px] font-semibold text-caption">{t('ask.quote.title')}</span>
        <span className="truncate text-[13px] text-ink">{quote.text}</span>
        {quote.truncated && (
          <span role="status" className="text-[12px] text-caption">
            {t('ask.quote.truncated', { count: QUOTE_MAX_LENGTH })}
          </span>
        )}
      </div>
      <IconButton label={t('ask.quote.remove')} icon={X} size={24} variant="gray" onClick={onRemove} />
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

  const ownerId = useAuthStore((state) => state.user?.id)
  // Only the moments of this conversation's subject that lit while it was open, or before it began (#267).
  const moments = litMomentsFor(useLitMoments(ownerId), {
    id: conversationId,
    subject: conversationQuery.data?.subject,
    startedAt: messages[0]?.createdAt,
  })
  const entries = threadEntries(messages, moments)
  const lastAnswerId = latestAnswerId(messages)
  const offerHelp = !helpActive && !isStreaming && !requestHelp.isPending
  // The same element from one render to the next, so the answer it sits under
  // is not drawn again at every key typed in the composer (#416).
  const { mutate: request, isPending: requesting } = requestHelp
  const helpAction = useMemo(
    () =>
      offerHelp || requesting ? (
        <TeacherHelpAction
          onRequest={() => request()}
          requesting={requesting}
          teachersOnline={teachersOnline}
          error={helpError}
        />
      ) : undefined,
    [helpError, offerHelp, request, requesting, teachersOnline],
  )

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
        {entries.map((entry) => entry.kind === 'lit' ? (
          <AskLitCard key={`lit:${entry.moment.unitId}`} moment={entry.moment} />
        ) : (
          <AskMessage
            key={entry.message.id}
            message={entry.message}
            teacherName={help?.teacherName}
            onRetry={retryMessage}
            after={entry.message.id === lastAnswerId ? helpAction : undefined}
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

type ThreadEntry = { kind: 'message'; message: ChatMessage } | { kind: 'lit'; moment: LitMoment }

/**
 * The thread's entries in time order: the messages, and the knowledge points
 * lit this session that are this conversation's (#51, #267), each after the messages sent before it was lit.
 */
export function threadEntries(messages: readonly ChatMessage[], moments: readonly LitMoment[]): ThreadEntry[] {
  const entries: ThreadEntry[] = []
  const lit = [...moments].sort((a, b) => Date.parse(a.litAt) - Date.parse(b.litAt))
  let next = 0
  for (const message of messages) {
    while (next < lit.length && Date.parse(lit[next].litAt) < Date.parse(message.createdAt)) entries.push({ kind: 'lit', moment: lit[next++] })
    entries.push({ kind: 'message', message })
  }
  while (next < lit.length) entries.push({ kind: 'lit', moment: lit[next++] })
  return entries
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

type RefusedConversation = {
  id: string
  subject: string
  grade: string
  content: string
  practiceContext?: PracticeContextRef
}

/**
 * The conversation `POST /conversations` made before refusing its first
 * question: the backend names it in the refusal's detail, so the question can
 * be asked again in it (stoa-backend `_naming_the_conversation`).
 */
function refusedConversationId(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  const detail = error.detail
  if (typeof detail !== 'object' || detail === null) return null
  const id = (detail as { conversationId?: unknown }).conversationId
  return typeof id === 'string' && id ? id : null
}

function sameContext(a?: PracticeContextRef, b?: PracticeContextRef) {
  return (
    a?.unitId === b?.unitId && a?.lessonId === b?.lessonId && a?.challengeId === b?.challengeId
  )
}
