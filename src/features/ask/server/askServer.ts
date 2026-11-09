/*
 * The server behind Ask (#571): the twelve requests Ask makes, in one object.
 *
 * The seam is at the service functions, in a React context, as the star map's
 * source is (`StarMapSourceContext`). Its default is the real services, so the
 * application mounts no provider and nothing changes in production; a test
 * puts an in-memory server in its place (`tests/fakes/askServer.ts`) with
 * `<AskServerProvider value={server}>`, instead of mocking each service module.
 *
 * Five groups, by what they are about. Each function has exactly the
 * signature of the service it stands for, so a group of the real server is
 * the services themselves; the modules that use one group take its type, or a
 * part of it (`AskQuestionAdapter`).
 *
 * Uploads and reading pictures are not this server's: they keep their own
 * seams (`uploader`, `AttachmentReader`).
 */
import { createContext, useContext } from 'react'
import { createConversation, getConversation, getConversations } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'
import { getMyMemorySummary } from '@/services/learning/memoryApi'
import { getStudentEntitlement, getStudentProfile } from '@/services/student/studentApi'
import {
  createTeacherHelpRequest,
  getTeacherAvailability,
  getTeacherHelpRequest,
  withdrawTeacherHelpRequest,
} from '@/services/teacherHelp/teacherHelpApi'

export type AskServer = {
  /** The student's conversations: the list, one of them, a new one. */
  conversations: {
    getConversations: typeof getConversations
    getConversation: typeof getConversation
    createConversation: typeof createConversation
  }
  /** A message sent into a conversation, and the command that answers it. */
  stream: {
    streamConversationMessage: typeof streamConversationMessage
    getGenerationProgress: typeof getGenerationProgress
  }
  /** 真人求助: whether teachers are online, and the conversation's request. */
  teacherHelp: {
    getTeacherAvailability: typeof getTeacherAvailability
    getTeacherHelpRequest: typeof getTeacherHelpRequest
    createTeacherHelpRequest: typeof createTeacherHelpRequest
    withdrawTeacherHelpRequest: typeof withdrawTeacherHelpRequest
  }
  /** The student's profile (their year group and subjects), and their entitlement (the usage period, #615). */
  student: {
    getStudentProfile: typeof getStudentProfile
    getStudentEntitlement: typeof getStudentEntitlement
  }
  /** What the student's learning memory recommends. */
  memory: {
    getMyMemorySummary: typeof getMyMemorySummary
  }
}

/**
 * The real server: each function calls its service when it is called, not
 * when this module loads, so a test that replaces a service module still
 * reaches its replacement through here.
 */
export const serverAskServer: AskServer = {
  conversations: {
    getConversations: () => getConversations(),
    getConversation: (conversationId) => getConversation(conversationId),
    createConversation: (payload) => createConversation(payload),
  },
  stream: {
    streamConversationMessage: (request) => streamConversationMessage(request),
    getGenerationProgress: (conversationId, signal, idempotencyKey) =>
      getGenerationProgress(conversationId, signal, idempotencyKey),
  },
  teacherHelp: {
    getTeacherAvailability: () => getTeacherAvailability(),
    getTeacherHelpRequest: (conversationId) => getTeacherHelpRequest(conversationId),
    createTeacherHelpRequest: (payload) => createTeacherHelpRequest(payload),
    withdrawTeacherHelpRequest: (conversationId) => withdrawTeacherHelpRequest(conversationId),
  },
  student: {
    getStudentProfile: () => getStudentProfile(),
    getStudentEntitlement: () => getStudentEntitlement(),
  },
  memory: {
    getMyMemorySummary: (subject) => getMyMemorySummary(subject),
  },
}

export const AskServerContext = createContext<AskServer>(serverAskServer)

/** Put another server behind Ask for everything under it: `<AskServerProvider value={server}>`. */
export const AskServerProvider = AskServerContext.Provider

/** The server Ask talks to: the real one, unless a provider above says otherwise. */
export function useAskServer(): AskServer {
  return useContext(AskServerContext)
}
