import { FormEvent, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSubmitFeedbackMutation } from '@/hooks/feedback/useSubmitFeedbackMutation'
import { useAuthStore } from '@/store/authStore'
import type { FeedbackType } from '@/services/feedback/feedbackApi'

const feedbackTypes: FeedbackType[] = ['bug', 'confusion', 'suggestion', 'praise']

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const submitFeedback = useSubmitFeedbackMutation()
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) {
      setError('Feedback message is required.')
      return
    }
    setError(null)
    submitFeedback.mutate(
      {
        type,
        page: location.pathname,
        message: trimmed,
        userRole: user?.role,
        createdAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setMessage('')
          setType('bug')
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Share a bug, confusing moment, suggestion, or quick reaction from this page.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Type</Label>
            <select
              id="feedback-type"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value as FeedbackType)}
            >
              {feedbackTypes.map((feedbackType) => (
                <option key={feedbackType} value={feedbackType}>
                  {feedbackType}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What happened? What did you expect?"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitFeedback.isPending}>
              {submitFeedback.isPending ? 'Sending...' : 'Send feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
