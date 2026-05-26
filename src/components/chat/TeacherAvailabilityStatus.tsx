import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useTeacherAvailabilityQuery } from '@/hooks/chat/useTeacherAvailabilityQuery'

export function TeacherAvailabilityStatus() {
  const { t } = useTranslation('chat')
  const availabilityQuery = useTeacherAvailabilityQuery()
  const availability = availabilityQuery.data
  const isOnline = availability?.online ?? false
  const isChecking = availabilityQuery.isLoading && !availability
  const label = isChecking
    ? t('availability.checking')
    : isOnline
      ? t('availability.online')
      : t('availability.offline')
  const detail = isOnline
    ? t('availability.onlineDetail', {
        count: availability?.availableTeachers ?? 1,
      })
    : availability?.nextWindow
      ? t('availability.nextWindow', { nextWindow: availability.nextWindow })
      : t('availability.offlineDetail')

  return (
    <div
      className={cn(
        'flex min-h-10 max-w-[13rem] items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs shadow-sm sm:max-w-none sm:px-3',
        isOnline
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-border bg-card text-muted-foreground',
      )}
      role="status"
      aria-label={`${label}. ${detail}`}
    >
      {isChecking ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <span
          className={cn(
            'h-2.5 w-2.5 shrink-0 rounded-full',
            isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/50',
          )}
          aria-hidden="true"
        />
      )}
      <span className="min-w-0">
        <span className="block truncate font-medium">{label}</span>
        <span className="hidden truncate text-[11px] opacity-80 sm:block">{detail}</span>
      </span>
    </div>
  )
}
