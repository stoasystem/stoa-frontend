import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { conversationDisplayTitle } from '@/components/chat/conversationTitle'
import { formatDayAndMonth, formatTimeOfDay } from '@/lib/formatDateTime'
import type { ConversationSummary } from '@/types/chat'

function when(updatedAt: string) {
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return ''
  return date.toDateString() === new Date().toDateString() ? formatTimeOfDay(date) : formatDayAndMonth(date)
}

/**
 * The student's conversations, shown whenever Ask has none open (#12 point 1).
 * Drawn as the conversation list on the Ask board: rows 10 / 12 padded, radius
 * 10, the title 14/500 with its date at 12, the last message two lines of 13.
 */
export function AskConversationList({
  conversations,
  onSelect,
}: {
  conversations: readonly ConversationSummary[]
  onSelect: (conversationId: string) => void
}) {
  const { t } = useTranslation('chat')

  return (
    <nav aria-label={t('ask.list.label')}>
      <ul className="flex flex-col gap-0.5">
        {conversations.map((conversation) => {
          const title = conversationDisplayTitle(conversation, t) || t('ask.list.untitled')
          return (
            <li key={conversation.id}>
              <button
                type="button"
                data-conversation-id={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className="flex w-full cursor-pointer flex-col gap-[3px] border-0 bg-transparent text-left hover:bg-fill"
                style={{ padding: '10px 12px', borderRadius: 10, minHeight: 44 }}
              >
                <span className="flex w-full items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{title}</span>
                  <span className="shrink-0 text-[12px] text-caption">{when(conversation.updatedAt)}</span>
                </span>
                {conversation.lastMessagePreview && (
                  <span className="line-clamp-2 text-[13px] leading-[1.35] text-caption">
                    {conversation.lastMessagePreview}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * No conversation yet (#12 point 7): one line, and two or three questions to
 * start from -- the first about the knowledge point recommended now, when
 * there is one.
 */
export function AskEmptyState({
  recommendedPoint,
  onAsk,
  disabled,
}: {
  recommendedPoint?: string | null
  onAsk: (question: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation('chat')
  const suggestions = [
    recommendedPoint ? t('ask.empty.point', { point: recommendedPoint }) : null,
    t('ask.empty.check'),
    t('ask.empty.practice'),
  ].filter((suggestion): suggestion is string => Boolean(suggestion))

  return (
    <div data-ask-empty className="flex flex-1 flex-col items-center justify-center gap-4 px-2 text-center">
      <p className="text-[17px] font-semibold tracking-[-0.2px] text-ink">{t('ask.empty.title')}</p>
      <ul aria-label={t('ask.empty.suggestionsLabel')} className="flex max-w-full flex-col items-center gap-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion} className="max-w-full">
            <Button
              variant="tinted"
              size="small"
              className="max-w-full"
              disabled={disabled}
              onClick={() => onAsk(suggestion)}
            >
              <span className="min-w-0 truncate">{suggestion}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
