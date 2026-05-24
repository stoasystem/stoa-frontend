import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog'
import { Button } from '@/components/ui/button'

export function FeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => setOpen(true)}
      >
        <MessageSquareText className="h-4 w-4" />
        Feedback
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
