import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { TeacherEscalationCard } from '@/components/chat/TeacherEscalationCard'
import { useMockChat } from '@/hooks/useMockChat'

export function ChatPage() {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    isAssistantThinking,
  } = useMockChat()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader conversation={activeConversation} />
        <ChatMessageList
          messages={activeConversation?.messages ?? []}
          isAssistantThinking={isAssistantThinking}
        />
        <TeacherEscalationCard />
        <ChatInput onSendMessage={sendMessage} />
      </main>
    </div>
  )
}
