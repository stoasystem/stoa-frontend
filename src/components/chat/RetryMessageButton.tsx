import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RetryMessageButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
      <RotateCcw className="mr-2 h-3.5 w-3.5" />
      Retry
    </Button>
  )
}
