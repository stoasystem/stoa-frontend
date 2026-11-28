import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useUpdateTeacherDispatchStatusMutation } from '@/hooks/teacher/useUpdateTeacherDispatchStatusMutation'
import { dispatchStatusKey } from '@/lib/dispatchStatus'
import { cn } from '@/lib/utils'
import type { TeacherDispatchStatus } from '@/types/teacherAvailability'

/**
 * Whether the teacher takes help requests, and the one switch for it (#768).
 *
 * Saved on its own the moment it is pressed, apart from the subjects and hours
 * below, which never change it (backend `CONTEXT.md`, 可接单状态). A teacher
 * the backend paused for a missed request lands here from the bell and sees
 * that they are paused, with the button to resume.
 */
export function TeacherDispatchStatusCard({ status }: { status: TeacherDispatchStatus | null }) {
  const { t } = useTranslation('teacher')
  const mutation = useUpdateTeacherDispatchStatusMutation()
  const key = dispatchStatusKey(status)
  const next: TeacherDispatchStatus = status === 'available' ? 'paused' : 'available'
  const action = status === 'available' ? 'pause' : status === 'paused' ? 'resume' : 'start'

  return (
    <section
      aria-labelledby="dispatch-status-title"
      data-dispatch-status={key}
      className={cn(
        'space-y-3 rounded-lg border bg-card p-5',
        status === 'available' && 'border-2 border-[color:var(--green)]',
        // Paused stands out: a teacher sent here by the bell must see it at once.
        status === 'paused' && 'border-2 border-[color:var(--accent)] bg-[color:var(--accent-tint)]',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id="dispatch-status-title" className="text-sm font-semibold text-muted-foreground">
            {t('availability.dispatch.title')}
          </h2>
          <p role="status" className="flex items-start gap-2 text-lg font-semibold">
            <span
              aria-hidden="true"
              className={cn(
                'mt-[0.45em] inline-block size-3 shrink-0 rounded-full',
                status === 'available'
                  ? 'bg-[color:var(--green)]'
                  : 'border-2 border-[color:var(--ink)]',
              )}
            />
            {t(`availability.dispatch.state.${key}`)}
          </p>
        </div>
        <Button
          type="button"
          // Not filled: the form's save is the screen's one filled button. On the
          // paused card's tint, the outline is the one that still reads as a button.
          variant={status === null ? 'tinted' : 'outline'}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(next)}
        >
          {mutation.isPending ? t('availability.dispatch.saving') : t(`availability.dispatch.action.${action}`)}
        </Button>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{t(`availability.dispatch.explain.${key}`)}</p>
      <p className="text-sm leading-6 text-muted-foreground">{t('availability.dispatch.online')}</p>
      <p className="text-sm leading-6 text-muted-foreground">{t('availability.dispatch.hoursAreNotStatus')}</p>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">{t('availability.dispatch.saveFailed')}</p>
      )}
    </section>
  )
}
