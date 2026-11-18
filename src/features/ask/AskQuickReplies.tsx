import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import type { ChatMessage } from '@/types/chat'

/** The most an answer offers (stoa-backend#443); more from a misbehaving server are not shown. */
const MOST = 3

/**
 * The quick replies on screen (#682): under the thread's newest message, when
 * that is an answer the assistant finished and it offers some. Not under an
 * earlier answer, nor while the next one is being written, nor once a question
 * or a teacher's message came after it. `null` when there are none to show.
 */
export function quickRepliesPlace(messages: readonly ChatMessage[]): { underMessageId: string; replies: string[] } | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role === 'system') continue
    if (message.role !== 'assistant' || message.status === 'streaming' || message.status === 'failed') return null
    const replies = (message.structured?.quickReplies ?? []).filter((reply) => reply.trim()).slice(0, MOST)
    return replies.length > 0 ? { underMessageId: message.id, replies } : null
  }
  return null
}

/**
 * What the answer above offers to say next (#682), each a button that sends
 * its own words as an ordinary follow-up. The words are the backend's, in the
 * answer's language, so nothing here translates them. They wrap, at phone
 * width and in a narrow panel, rather than run off the side.
 */
export const AskQuickReplies = memo(function AskQuickReplies({
  replies,
  disabled,
  onReply,
}: {
  replies: readonly string[]
  /** A question is on its way, or asking is paused (#615): none can be pressed. */
  disabled: boolean
  /** `keyboard`: pressed with Enter or Space rather than a pointer. */
  onReply: (reply: string, keyboard: boolean) => void
}) {
  const { t } = useTranslation('chat')
  return (
    <div role="group" aria-label={t('ask.answer.quickReplies')} data-ask-quick-replies className="flex max-w-full flex-wrap gap-2">
      {replies.map((reply, index) => (
        <Button
          key={`${index}:${reply}`}
          variant="tinted"
          size="small"
          disabled={disabled}
          // A click the keyboard made carries no pointer press count.
          onClick={(event) => onReply(reply, event.detail === 0)}
          data-ask-quick-reply
          className="max-w-full whitespace-normal break-words text-left leading-[1.3]"
          // As tall as its words: a long reply wraps inside the button.
          style={{ height: 'auto', minHeight: 32, paddingBlock: 7 }}
        >
          {reply}
        </Button>
      ))}
    </div>
  )
})
