import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NewConversationButton({
  onCreateConversation,
  disabled = false,
}: {
  onCreateConversation: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="New conversation"
      onClick={onCreateConversation}
      disabled={disabled}
    >
      <MessageSquarePlus className="h-4 w-4" />
    </Button>
  )
}
