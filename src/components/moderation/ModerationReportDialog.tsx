import { useState } from 'react'
import { Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

// The words for each code live in `teacher:moderationReport`: the dialog opens
// from a teacher's help request, the only place it is used.
const reasonOptions: ModerationReason[] = ['incorrect_answer', 'unsafe_content', 'abuse', 'privacy', 'other']

const severityOptions: ModerationSeverity[] = ['low', 'medium', 'high']

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
  const { t } = useTranslation('teacher')
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
          <DialogTitle>{t('moderationReport.title')}</DialogTitle>
          <DialogDescription>{contextLabel}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            {t('moderationReport.reason')}
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ModerationReason)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {reasonOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`moderationReport.reasons.${option}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {t('moderationReport.severity')}
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value as ModerationSeverity)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`moderationReport.severities.${option}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {t('moderationReport.note')}
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t('moderationReport.notePlaceholder')}
              className="min-h-24"
            />
          </label>
          {mutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              {t('moderationReport.submitFailed')}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t('moderationReport.cancel')}
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
            {mutation.isPending ? t('moderationReport.submitting') : t('moderationReport.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
