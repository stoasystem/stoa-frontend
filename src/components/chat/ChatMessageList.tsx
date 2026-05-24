import { Bot } from 'lucide-react'
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import type { ChatMessage } from '@/types/chat'

export function ChatMessageList({
  messages,
  isAssistantThinking,
}: {
  messages: ChatMessage[]
  isAssistantThinking: boolean
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        {isAssistantThinking && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Bot className="h-4 w-4" />
              <span>STOA AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
