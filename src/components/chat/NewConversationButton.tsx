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
      <MessageSquarePlus className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
    </Button>
  )
}
