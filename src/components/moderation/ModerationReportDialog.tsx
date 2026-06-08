import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useReportModerationCaseMutation } from '@/hooks/moderation/useReportModerationCaseMutation'
import type {
  ModerationReason,
  ModerationSeverity,
  ModerationSurface,
} from '@/services/admin/adminApi'

const reasonOptions: { value: ModerationReason; label: string }[] = [
  { value: 'incorrect_answer', label: 'Incorrect answer' },
  { value: 'unsafe_content', label: 'Unsafe content' },
  { value: 'abuse', label: 'Abuse or harassment' },
  { value: 'privacy', label: 'Privacy concern' },
  { value: 'other', label: 'Other' },
]

const severityOptions: { value: ModerationSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

type ModerationReportDialogProps = {
  questionId: string
  surface: ModerationSurface
  triggerLabel: string
  contextLabel: string
  defaultReason?: ModerationReason
}

export function ModerationReportDialog({
  questionId,
  surface,
  triggerLabel,
  contextLabel,
  defaultReason = 'other',
}: ModerationReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ModerationReason>(defaultReason)
  const [severity, setSeverity] = useState<ModerationSeverity>('medium')
  const [note, setNote] = useState('')
  const mutation = useReportModerationCaseMutation()

  const canSubmit = questionId.trim().length > 0 && !mutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2">
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>{contextLabel}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Reason
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ModerationReason)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Severity
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value as ModerationSeverity)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Note
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What should the admin review?"
              className="min-h-24"
            />
          </label>
          {mutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              Could not submit moderation report.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              mutation.mutate(
                {
                  questionId,
                  surface,
                  reason,
                  severity,
                  note: note.trim() || undefined,
                },
                {
                  onSuccess: () => {
                    setNote('')
                    setOpen(false)
                  },
                },
              )
            }
          >
            {mutation.isPending ? 'Submitting...' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
