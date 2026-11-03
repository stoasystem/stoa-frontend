import type { AskServer } from '@/features/ask/server/askServer'

/**
 * The server a question goes out to (#562): the two requests asking from the
 * list makes, and nothing else -- a part of the server behind Ask (#571),
 * which tests replace with an in-memory one.
 *
 * - `conversations.createConversation`: `POST /conversations`, with or without the first question.
 * - `stream.streamConversationMessage`: a message sent into a conversation,
 *   here with nothing on screen waiting on its events.
 */
export type AskQuestionAdapter = {
  conversations: Pick<AskServer['conversations'], 'createConversation'>
  stream: Pick<AskServer['stream'], 'streamConversationMessage'>
}
