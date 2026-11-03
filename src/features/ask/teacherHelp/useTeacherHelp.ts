/*
 * 真人求助 as the student sees it in one 学习会话 (#558): everything Ask needs
 * to say where the conversation's teacher help stands, and the two things the
 * student can do about it.
 *
 * - The request is read from the server only
 *   (`GET /teacher-help/conversations/:id/request`); nothing on this side says
 *   a teacher joined (#12 point 2). A 404 is a conversation never escalated.
 * - It is read again every 5 s while a teacher has it, 15 s while it waits for
 *   one (and for a status this app does not know yet, #397), never once it has
 *   ended; never while the tab is hidden. The conversation itself is read at
 *   the same pace, which is how a teacher's reply reaches the thread, and once
 *   more at each change of status: a teacher who replies and resolves within
 *   one poll turns the polling off just as the reply lands. The list of
 *   conversations follows each change of status too (#405).
 * - "Ask a teacher" sits under the latest answer the assistant finished (#12
 *   point 2), suggested when that answer says so (#506), with the week's
 *   allowance and whether a teacher is online. A conversation has one request:
 *   once asked, open or over, it is not offered here again (#544).
 * - Asking and taking the request back (#543) are read back from the server,
 *   the request and the week's allowance both; nothing is guessed from the
 *   answer to the POST. A refusal is said in the student's words: this module
 *   hands out translation keys (`chat` namespace), the view says them.
 *
 * The status vocabulary is shared with the teacher's side
 * (`types/teacherHelp.ts`); this module reads it and repeats none of it.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAskServer, type AskServer } from '@/features/ask/server/askServer'
import { useConversationQuery } from '@/hooks/chat/useConversationQuery'
import { useTeacherAvailabilityQuery } from '@/hooks/chat/useTeacherAvailabilityQuery'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { ApiError } from '@/services/api/httpClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import type { ChatMessage } from '@/types/chat'
import {
  isEndedHelpRequest,
  isWithdrawableHelpRequest,
  type TeacherHelpRequest,
  type TeacherHelpStatus,
  type TeacherSupportStanding,
} from '@/types/teacherHelp'

/** "Ask a teacher", where it sits and what it says. */
export type HelpOffer = {
  /** The answer it sits under: the latest one the assistant finished. */
  underMessageId: string
  /** That answer suggests a teacher (#506). */
  suggested: boolean
  /** `false` while no teacher is online. */
  teachersOnline: boolean | undefined
  /** This week's allowance; `null` when it could not be read. */
  support: TeacherSupportStanding | null
  /** Why it cannot be pressed, from the allowance (`chat` key); `null` when it can. */
  blockedKey: string | null
  /** Why the last request was refused (`chat` key). */
  errorKey: string | null
}

/** Taking the request back (#543). */
export type HelpWithdraw = {
  /** Still waiting, or offered to a teacher who has not taken it. */
  withdrawable: boolean
  withdrawing: boolean
  /** Why the last withdrawal was refused (`chat` key), whatever the status since. */
  errorKey: string | null
}

/** The card pinned over the thread once a teacher was asked. */
export type HelpCard = {
  request: TeacherHelpRequest
  teachersOnline: boolean | undefined
  withdraw: HelpWithdraw
}

/**
 * What the student sees of teacher help in this conversation.
 *
 * - `none`: nothing: no answer to sit under, or one being written.
 * - `offer` / `asking`: "Ask a teacher", and while the request is on its way.
 * - `waiting`: no teacher has it yet (and a status this app does not know).
 * - `assigned`: offered to a teacher. `withTeacher`: a teacher is on it.
 * - `ended`: resolved, cancelled, withdrawn or expired; a new conversation asks again.
 */
export type TeacherHelpView =
  | { kind: 'none' }
  | { kind: 'offer' | 'asking'; offer: HelpOffer }
  | { kind: 'waiting' | 'assigned' | 'withTeacher' | 'ended'; card: HelpCard }

export type TeacherHelp = {
  view: TeacherHelpView
  /** The teacher's name as the request has it, for their replies. */
  teacherName: string | undefined
  request: () => void
  withdraw: () => void
}

const KEY_BY_CODE: Record<string, string> = {
  teacher_support_not_included: 'teacher.errors.planDenied',
  teacher_support_allowance_exhausted: 'teacher.errors.allowanceExhausted',
  teacher_support_admission_recoverable: 'teacher.errors.temporary',
}

const KEY_BY_STATUS: Record<number, string> = {
  403: 'teacher.errors.planDenied',
  409: 'teacher.errors.alreadyOpen',
  429: 'teacher.errors.allowanceExhausted',
  502: 'teacher.errors.temporary',
  503: 'teacher.errors.temporary',
  504: 'teacher.errors.temporary',
}

/**
 * Why a request failed, in one sentence the student can act on. The server's
 * own vocabulary ("safely recoverable") told a student nothing; anything not
 * recognised falls back to the generic retry.
 */
function requestErrorKey(error: unknown): string {
  if (!(error instanceof ApiError)) return 'teacher.errors.generic'
  const byCode = error.code ? KEY_BY_CODE[error.code] : undefined
  if (byCode) return byCode
  const byStatus = error.status ? KEY_BY_STATUS[error.status] : undefined
  return byStatus ?? 'teacher.errors.generic'
}

const WITHDRAW_KEY_BY_CODE: Record<string, string> = {
  teacher_help_already_accepted: 'ask.help.withdraw.errors.accepted',
  teacher_help_request_closed: 'ask.help.withdraw.errors.closed',
  teacher_help_request_not_found: 'ask.help.withdraw.errors.closed',
}

/**
 * Why a withdrawal was refused: taken by a teacher, already over, or briefly
 * unavailable (503 `teacher_help_withdrawal_unavailable`, or the gateway's
 * 502/504). A refusal it does not know says it could not be withdrawn.
 */
function withdrawErrorKey(error: unknown): string {
  if (!(error instanceof ApiError)) return 'ask.help.withdraw.errors.generic'
  const byCode = error.code ? WITHDRAW_KEY_BY_CODE[error.code] : undefined
  if (byCode) return byCode
  if (error.status === 502 || error.status === 503 || error.status === 504) return 'ask.help.withdraw.errors.unavailable'
  return 'ask.help.withdraw.errors.generic'
}

/** Why "Ask a teacher" cannot be pressed, in the words a refusal would have used. */
function blockedKeyOf(support: TeacherSupportStanding | null): string | null {
  if (support?.canRequest !== false) return null
  return support.blockedReason === 'teacher_support_not_included'
    ? KEY_BY_CODE.teacher_support_not_included
    : KEY_BY_CODE.teacher_support_allowance_exhausted
}

/** How often the request, and the conversation with it, is read again. */
function paceOf(status: string | null | undefined): number | false {
  if (!status) return false
  if (status === 'assigned' || status === 'in_progress') return 5_000
  if (isEndedHelpRequest(status as TeacherHelpStatus)) return false
  return 15_000
}

/**
 * Where "Ask a teacher" sits: under the latest answer the assistant finished,
 * and nowhere while it is writing or its latest answer failed.
 */
function offerPlace(messages: readonly ChatMessage[]): { id: string; suggested: boolean } | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== 'assistant') continue
    if (message.status === 'streaming' || message.status === 'failed') return null
    return { id: message.id, suggested: message.structured?.suggestTeacher === true }
  }
  return null
}

function cardKind(status: string): 'waiting' | 'assigned' | 'withTeacher' | 'ended' {
  if (isEndedHelpRequest(status as TeacherHelpStatus)) return 'ended'
  if (status === 'assigned') return 'assigned'
  if (status === 'in_progress') return 'withTeacher'
  return 'waiting'
}

/**
 * The requests this module makes (#571): the teacher help group of the server
 * behind Ask, but for availability, which `useTeacherAvailabilityQuery` reads.
 */
export type TeacherHelpServer = Pick<
  AskServer['teacherHelp'],
  'getTeacherHelpRequest' | 'createTeacherHelpRequest' | 'withdrawTeacherHelpRequest'
>

export function useTeacherHelp({
  conversationId,
  messages,
  isStreaming,
}: {
  conversationId: string
  messages: readonly ChatMessage[]
  isStreaming: boolean
}): TeacherHelp {
  const queryClient = useQueryClient()
  const server: TeacherHelpServer = useAskServer().teacherHelp
  const { getTeacherHelpRequest, createTeacherHelpRequest, withdrawTeacherHelpRequest } = server
  const [requestError, setRequestError] = useState<string | null>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  const helpQuery = useQuery({
    queryKey: chatQueryKeys.teacherHelpRequest(conversationId),
    // 404 is the answer for a conversation that was never escalated: no help,
    // kept like any other answer. Taken for an error, it was asked again each
    // time the conversation opened (#405).
    queryFn: () =>
      getTeacherHelpRequest(conversationId).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }),
    refetchInterval: (query) => paceOf(query.state.data?.status),
    refetchIntervalInBackground: false,
  })
  const help = helpQuery.data ?? null
  const availability = useTeacherAvailabilityQuery().data

  // The conversation, read at the request's pace: one more reader of the same
  // query, which the thread draws from.
  const { refetch: readConversation } = useConversationQuery(conversationId, {
    refetchInterval: paceOf(help?.status),
  })
  const status = help?.status ?? null
  const lastStatus = useRef(status)
  useEffect(() => {
    if (lastStatus.current === status) return
    const previous = lastStatus.current
    lastStatus.current = status
    if (previous !== null) void readConversation()
  }, [readConversation, status])

  // The list follows a change of help status, as read here (#405).
  const listStatus = helpQuery.data === undefined ? undefined : status
  const seenListStatus = useRef(listStatus)
  useEffect(() => {
    const before = seenListStatus.current
    seenListStatus.current = listStatus
    if (listStatus === undefined || before === undefined || listStatus === before) return
    void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations(), exact: true })
  }, [listStatus, queryClient])

  const asking = useMutation({
    mutationFn: () => createTeacherHelpRequest({ conversationId }),
    onSuccess: (request) => {
      setRequestError(null)
      trackEvent('teacher_help_requested', {
        requestId: request.requestId,
        conversationId: request.conversationId,
        status: request.status,
      })
      // The card shows the request as the server reports it, read back from
      // the server: not the answer to this POST, and never a guess.
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.teacherHelpRequest(conversationId) })
      // One of the week's requests is gone: said now, not at the next minute's read (#506).
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.teacherAvailability() })
    },
    onError: (error) => {
      const key = requestErrorKey(error)
      trackEvent('teacher_help_request_failed', { reason: key })
      setRequestError(key)
      // A refusal for the allowance or the plan may be news to the reading on screen.
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.teacherAvailability() })
    },
  })

  // Like asking, what the card then shows is read back from the server, and so
  // is the week's allowance, given back. A refusal reads both again too: a 409
  // means the request has moved on.
  const withdrawing = useMutation({
    mutationFn: () => withdrawTeacherHelpRequest(conversationId),
    onSuccess: () => setWithdrawError(null),
    onError: (error) => setWithdrawError(withdrawErrorKey(error)),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.teacherHelpRequest(conversationId) })
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.teacherAvailability() })
    },
  })

  const teachersOnline = availability?.online
  const support = availability?.teacherSupport ?? null
  const isAsking = asking.isPending
  const isWithdrawing = withdrawing.isPending
  // The same view from one render to the next while nothing in it changed, so
  // the answer it sits under is not drawn again at every key typed (#416).
  const view = useMemo<TeacherHelpView>(() => {
    if (help) return {
      kind: cardKind(help.status),
      card: {
        request: help,
        teachersOnline,
        withdraw: {
          withdrawable: isWithdrawableHelpRequest(help.status),
          withdrawing: isWithdrawing,
          errorKey: withdrawError,
        },
      },
    }
    const place = offerPlace(messages)
    // A conversation has one request: once asked, open or over, help is not
    // offered here again (#544); nor while an answer is being written.
    if (!place || (isStreaming && !isAsking)) return { kind: 'none' }
    return {
      kind: isAsking ? 'asking' : 'offer',
      offer: {
        underMessageId: place.id,
        suggested: place.suggested,
        teachersOnline,
        support,
        blockedKey: blockedKeyOf(support),
        errorKey: requestError,
      },
    }
  }, [help, isAsking, isStreaming, isWithdrawing, messages, requestError, support, teachersOnline, withdrawError])

  const { mutate: ask } = asking
  const { mutate: takeBack } = withdrawing
  return { view, teacherName: help?.teacherName, request: ask, withdraw: takeBack }
}
