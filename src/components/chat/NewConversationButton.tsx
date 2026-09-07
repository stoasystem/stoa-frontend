import { MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function NewConversationButton({
  onCreateConversation,
  disabled = false,
}: {
  onCreateConversation: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation('chat')
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={t('newConversation')}
      onClick={onCreateConversation}
      disabled={disabled}
    >
      <MessageSquarePlus className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
    </Button>
  )
}
