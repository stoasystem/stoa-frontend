import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PracticeToChatCTA({
  onExplain,
  variant = 'outline',
}: {
  onExplain: () => void
  variant?: 'outline' | 'secondary'
}) {
  return (
    <Button onClick={onExplain} type="button" variant={variant}>
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      Explain this step
    </Button>
  )
}
