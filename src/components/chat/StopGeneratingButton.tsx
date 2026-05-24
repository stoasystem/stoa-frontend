import { Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StopGeneratingButton({ onStop }: { onStop: () => void }) {
  return (
    <Button type="button" variant="outline" size="icon" aria-label="Stop generation" onClick={onStop}>
      <Square className="h-4 w-4" />
    </Button>
  )
}
