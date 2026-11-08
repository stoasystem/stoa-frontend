import { ChevronLeft, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, Composer, IconButton, PresenceDot } from '@/components/base'
import { conversationDisplayTitle, subjectDisplayLabel } from '@/components/chat/conversationTitle'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { GRADE_SECTION_ID } from '@/features/account/GradeGroup'
import { AskConversationList, AskEmptyState } from '@/features/ask/AskConversationList'
import { hasSections, quoteCaption, sectionsSpokenText, type AnswerStep } from '@/features/ask/AskAnswerSections'
import { AskLitCard } from '@/features/ask/AskLitCard'
import { AskMessage } from '@/features/ask/AskMessage'
import { ASK_PANEL } from '@/features/ask/askLayout'
import { TeacherHelpAction, TeacherHelpStatusCard } from '@/features/ask/teacherHelp/TeacherHelp'
import { useTeacherHelp } from '@/features/ask/teacherHelp/useTeacherHelp'
import type { AskController } from '@/features/ask/useAskController'
import { useAskConversation } from '@/features/ask/useAskConversation'
import { useAskQuestion } from '@/features/ask/question/useAskQuestion'
import {
  makeQuote,
  quoteBelongs,
  useAskQuoteStore,
  type AskPractice,
  type AskQuote,
} from '@/features/ask/practiceContext'
import { Attachments } from '@/features/uploads/Attachments'
import { useAttachments, type AttachmentBatch } from '@/features/uploads/useAttachments'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { askRefusalWords, refusedForNow } from '@/hooks/chat/useStreamingChat'
import { useTeacherAvailabilityQuery } from '@/hooks/chat/useTeacherAvailabilityQuery'
import { useRecommendationsQuery } from '@/hooks/learning/useWeakTopicsQuery'
import { useStudentProfileQuery } from '@/hooks/student/useStudentProfileQuery'
import { conversationGrade } from '@/lib/conversationGrade'
import { saysGrade } from '@/lib/profileChoices'
import { toUserFacingError } from '@/lib/userFacingText'
import { cn } from '@/lib/utils'
import { askFor, useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'
import { litMomentsFor, useLitMoments, type LitMoment } from '@/store/litMomentsStore'
import { learningSubjectOptions } from '@/types/learningProfile'
import { QUOTE_MAX_LENGTH, type ChatMessage } from '@/types/chat'

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
  const ownerId = useAuthStore((state) => state.user?.id ?? null)
  const conversationsQuery = useConversationsQuery()
  const availability = useTeacherAvailabilityQuery().data
  const teachersOnline = availability?.online
  const profileQuery = useStudentProfileQuery()
  const profile = profileQuery.data
  const ask = useAskConversation(conversationId)
  const { sendStreamingMessage, isStreaming, conversation } = ask
  const phone = layout === 'sheet'
  const subject = subjectFor(subjectId, profile?.primarySubjects?.[0])
  // Where the question goes -- the open conversation, a new one, or the one a
  // refusal left behind -- and under which key, is the question module's (#562).
  const question = useAskQuestion({
    subject,
    grade: conversationGrade(profile?.grade),
    conversationId,
    sendStreamingMessage,
    isStreaming,
  })

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
  // "I don't get this step" (#506): the step goes out as a quote of that part
  // of the answer, with a question the student can change or send as it is.
  const composerArea = useRef<HTMLDivElement>(null)
  const { readDraft } = controller
  const askAboutStep = useCallback(
    ({ messageId, index, text }: AnswerStep) => {
      setQuote(makeQuote(text, { kind: 'message', id: messageId, part: { section: 'steps', index } }, conversationId))
      if (!readDraft().trim()) setDraft(t('ask.answer.stepQuestion'))
      composerArea.current?.querySelector('textarea')?.focus()
    },
    [conversationId, readDraft, setDraft, setQuote, t],
  )
  // The files chosen for the next question, uploaded as they are picked
  // (#125): from the chooser, the camera (#509) or a phone by QR (#514).
  const attachments = useAttachments({ camera: true, phone: conversationId })

  function send(content: string, files: AttachmentBatch) {
    // Sent is sent: the question leaves the composer now, so closing Ask while
    // the conversation is being made cannot leave it there to be sent twice.
    // It comes back only if it could not go out.
    setDraft('')
    // Into the open conversation it goes at once, and so does the passage.
    if (conversationId) clearQuote()
    void question.ask({ content, quote, files, practice }).then((outcome) => {
      if (outcome.kind === 'failed') {
        // Unless the student has started another question meanwhile.
        if (!controller.readDraft()) setDraft(content)
        return
      }
      // Gone with the question -- unless another was chosen meanwhile.
      if (quote && useAskQuoteStore.getState().quote === quote) clearQuote()
      // Opened only in the panel that asked, and only if the student is still
      // on the list: a closed Ask stays closed, and a conversation the student
      // opened meanwhile stays open.
      if (mounted.current && openConversation.current === null) select(outcome.conversationId)
    })
  }

  function submit(value: string) {
    const content = value.trim()
    if (!content) return
    // Pressing send while a file is still going up is held by the composer's
    // `busy`, which says so; `take()` is the second lock, so a question can
    // never leave without the file it was written for. A file that waited past
    // its upload's 30 minutes is chosen again first.
    const files = attachments.take()
    if (!files) return
    if (!question.canAsk()) return
    send(content, files)
  }

  function askRecommended(recommended: string) {
    if (!question.canAsk()) return
    // A file still going up, or one that waited past its upload's 30 minutes,
    // holds the question; the tray says which.
    const files = attachments.take()
    if (!files) return
    send(recommended, files)
  }

  // An example chosen on the star map ("Find my own star", #586) goes out as
  // soon as Ask is open on its list, once the student's year is known (the
  // conversation is made for it). Taken from the store once, so it is sent once.
  const pending = useAskStore((state) => askFor(state, ownerId).pending)
  const askPending = useRef(askRecommended)
  useEffect(() => {
    askPending.current = askRecommended
  })
  const takesPending = controller.entry === 'planet' && conversationId === null && !profileQuery.isPending
  useEffect(() => {
    if (!pending || !takesPending || !ownerId) return
    const taken = useAskStore.getState().takePending(ownerId)
    if (taken) askPending.current(taken)
  }, [pending, takesPending, ownerId])

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
          onAskAboutStep={askAboutStep}
          onNewConversation={() => select(null)}
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
              onAsk={askRecommended}
              disabled={question.starting}
            />
          ) : (
            <AskConversationList conversations={conversationsQuery.data?.items ?? []} onSelect={(id) => select(id)} />
          )}
          {/* Here before it has anything to say, so what it says is read (#408). */}
          <div role="status" data-ask-starting>
            {question.starting && (
              <p className="px-3 py-2 text-[13px] text-caption">{t('ask.thread.starting')}</p>
            )}
          </div>
          {question.startError && (
            <p role="alert" className="px-3 py-2 text-[13px] text-red">
              {toUserFacingError(question.startError, t('ask.thread.startFailed'), askRefusalWords)}
            </p>
          )}
        </div>
      )}

      <div ref={composerArea} data-ask-composer-area className="shrink-0" style={{ padding: phone ? '0 12px 34px' : '0 14px 16px' }}>
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
        {profile && !saysGrade(profile) && (
          <p id="ask-grade-missing" className="m-0 pb-1 text-[13px] text-[color:var(--on-sky-text-body)]">
            <Link to={`/me#${GRADE_SECTION_ID}`} className="text-[color:var(--on-sky-plain)] underline underline-offset-2">
              {t('gradeMissingHint')}
            </Link>
          </p>
        )}
        {quote && <PendingQuote quote={quote} onRemove={clearQuote} />}
        <Attachments view={attachments.view} />
        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          onAttach={attachments.sources.pickFile}
          onCapture={attachments.sources.takePhoto}
          onPhone={attachments.sources.usePhone}
          dictation
          label={t('ask.composerLabel')}
          placeholder={practice ? t('ask.practice.placeholder') : t('ask.placeholder')}
          busy={isStreaming || question.starting || attachments.busy}
          describedBy={profile && !saysGrade(profile) ? 'ask-grade-missing' : undefined}
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
        <span className="text-[12px] font-semibold text-caption">{quoteCaption(quote, t)}</span>
        {/* A step of an answer carries its formulas: drawn, as on the bubble it came from (#506). */}
        <span className="truncate text-[13px] text-ink">
          <MathRenderer plain>{quote.text}</MathRenderer>
        </span>
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
  onAskAboutStep,
  onNewConversation,
}: {
  conversationId: string
  ask: ReturnType<typeof useAskConversation>
  layout: AskLayout
  onAskAboutStep: (step: AnswerStep) => void
  /** Back to the list, where the next question starts a new conversation. */
  onNewConversation: () => void
}) {
  const { t } = useTranslation('chat')
  const scroller = useRef<HTMLDivElement>(null)
  const { messages, isStreaming, retryMessage, conversationQuery } = ask
  const help = useTeacherHelp({ conversationId, messages, isStreaming })
  const { view, request, withdraw } = help

  const ownerId = useAuthStore((state) => state.user?.id)
  // Only the moments of this conversation's subject that lit while it was open, or before it began (#267).
  const moments = litMomentsFor(useLitMoments(ownerId), {
    id: conversationId,
    subject: conversationQuery.data?.subject,
    startedAt: messages[0]?.createdAt,
  })
  const entries = threadEntries(messages, moments)
  // The same element from one render to the next, so the answer it sits under
  // is not drawn again at every key typed in the composer (#416).
  // Built from what it shows, not from the view: a new message is a new view.
  const offer = view.kind === 'offer' || view.kind === 'asking' ? view.offer : null
  const requesting = view.kind === 'asking'
  const offered = offer !== null
  const { teachersOnline, support, suggested, blockedKey, errorKey } = offer ?? {}
  const helpAction = useMemo(
    () =>
      offered ? (
        <TeacherHelpAction
          onRequest={() => request()}
          requesting={requesting}
          teachersOnline={teachersOnline}
          support={support ?? null}
          suggested={suggested}
          blockedKey={blockedKey}
          errorKey={errorKey}
        />
      ) : undefined,
    [blockedKey, errorKey, offered, request, requesting, suggested, support, teachersOnline],
  )
  const card = 'card' in view ? view.card : null

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
    teacher: help.teacherName?.trim() || t('ask.thread.teacherFallback'),
  })

  return (
    <>
      {card && (
        <div className="shrink-0" style={{ padding: layout === 'sheet' ? '10px 14px 0' : '12px 18px 0' }}>
          <TeacherHelpStatusCard
            request={card.request}
            teachersOnline={card.teachersOnline}
            withdraw={{ ...card.withdraw, onWithdraw: () => withdraw() }}
            onNewConversation={onNewConversation}
          />
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
            teacherName={help.teacherName}
            onRetry={refusedForNow(entry.message) ? undefined : retryMessage}
            onAskAboutStep={onAskAboutStep}
            after={entry.message.id === offer?.underMessageId ? helpAction : undefined}
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
    // A teacher's reply says who it is from; an answer is the assistant's, read
    // as it is shown: in sections, its steps and answer, not the hint (#506).
    if (latest) {
      setAnnouncement(
        latest.role === 'teacher'
          ? `${names.teacher}: ${latest.content}`
          : hasSections(latest.structured)
            ? sectionsSpokenText(latest.structured)
            : latest.content,
      )
    }
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
