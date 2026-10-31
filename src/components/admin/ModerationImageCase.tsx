import { useId, useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ImageOff, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { drawnType, useObjectUrl } from '@/features/uploads/drawnImage'
import { useAdminModerationCaseImageQuery } from '@/hooks/admin/useAdminModerationCases'
import { formatDayAndTime } from '@/lib/formatDateTime'
import { formattingLocale } from '@/i18n/languages'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api/httpClient'
import type { ModerationCase, ModerationImageContext } from '@/services/admin/adminApi'

/**
 * An `image_upload` case: the image moderation refused, and why (#538). It
 * takes the place of the question / AI answer / teacher reply, which such a
 * case does not have.
 *
 * The image is not fit to look at, so it shows blurred until the admin asks for
 * it. Its route wants the admin's token: the bytes are read here and drawn from
 * an object URL, released when the case leaves the screen. A deleted image is
 * said to be deleted, never drawn as a broken one.
 */
export function ModerationImageCase({ item }: { item: ModerationCase }) {
  const { t } = useTranslation('admin')
  const heading = useId()
  const context = item.image_context
  return (
    // Side by side only when the case's own column is wide enough, whatever
    // the window: beside the queue it is narrow even on a laptop.
    <section aria-labelledby={heading} className="@container rounded-md border p-4">
      <div className="grid gap-4 @2xl:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 id={heading} className="text-sm font-semibold">{t('moderation.image.title')}</h2>
          </div>
          <BlockedImage caseId={item.case_id} context={context} />
        </div>
        <div className="min-w-0 space-y-4">
          <ImageHits context={context} />
          <ImageFacts context={context} />
        </div>
      </div>
    </section>
  )
}

const PANEL = 'flex min-h-48 flex-col items-center justify-center gap-2 rounded-md border bg-secondary/30 p-4 text-center text-sm text-muted-foreground'

function BlockedImage({ caseId, context }: { caseId: string; context: ModerationImageContext | null | undefined }) {
  const { t } = useTranslation('admin')
  const deleted = context?.image_status === 'deleted'
  const query = useAdminModerationCaseImageQuery(caseId, !deleted)
  const blob = query.data && drawnType(query.data) ? query.data : undefined
  const url = useObjectUrl(blob)
  const [revealed, setRevealed] = useState(false)
  // Read, but not a picture the browser can draw.
  const [undrawable, setUndrawable] = useState(false)

  if (deleted || (query.error instanceof ApiError && query.error.status === 404)) {
    const deletedAt = context?.image_deleted_at
    return (
      <div className={PANEL} data-moderation-image="deleted">
        <ImageOff className="h-5 w-5" aria-hidden="true" />
        <p>
          {deletedAt
            ? t('moderation.image.deletedOn', { date: formatDayAndTime(deletedAt) })
            : t('moderation.image.deleted')}
        </p>
      </div>
    )
  }
  if (undrawable || (query.data && !blob)) {
    return (
      <div className={PANEL} data-moderation-image="undrawable">
        <ImageOff className="h-5 w-5" aria-hidden="true" />
        <p>{t('moderation.image.undrawable')}</p>
      </div>
    )
  }
  if (query.isError) {
    return (
      <div className={PANEL} data-moderation-image="failed">
        <p role="alert" className="text-destructive">{t('moderation.image.failed')}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
          {t('moderation.image.retry')}
        </Button>
      </div>
    )
  }
  if (!url) {
    return (
      <div className={PANEL} data-moderation-image="loading" aria-busy="true">
        {t('moderation.image.loading')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border bg-secondary/30">
        <img
          src={url}
          alt={t('moderation.image.alt')}
          data-revealed={revealed}
          className={cn('mx-auto max-h-96 w-auto max-w-full object-contain', !revealed && 'scale-110 blur-2xl')}
          onError={() => setUndrawable(true)}
        />
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => setRevealed((shown) => !shown)}>
        {revealed ? (
          <EyeOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        {revealed ? t('moderation.image.hide') : t('moderation.image.show')}
      </Button>
    </div>
  )
}

function ImageHits({ context }: { context: ModerationImageContext | null | undefined }) {
  const { t } = useTranslation('admin')
  const heading = useId()
  const hits = context?.hits ?? []
  return (
    <div>
      <h3 id={heading} className="text-xs font-semibold uppercase text-muted-foreground">
        {t('moderation.image.hits')}
      </h3>
      {hits.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t('moderation.image.noHits')}</p>
      ) : (
        // Rekognition's own names: they are what the threshold was set against.
        <ul aria-labelledby={heading} className="mt-2 space-y-2">
          {hits.map((hit) => (
            <li
              key={`${hit.category}/${hit.label}`}
              className="flex items-baseline justify-between gap-3 rounded-md bg-secondary/40 p-2 text-sm"
            >
              <span className="min-w-0">
                <span className="font-medium">{hit.category}</span>
                {hit.label !== hit.category && <span className="text-muted-foreground"> · {hit.label}</span>}
              </span>
              <span className="shrink-0 tabular-nums">{formatConfidence(hit.confidence)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ImageFacts({ context }: { context: ModerationImageContext | null | undefined }) {
  const { t } = useTranslation('admin')
  if (!context) return null
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
      <dt className="text-muted-foreground">{t('moderation.image.uploader')}</dt>
      <dd className="min-w-0">
        <span className="[overflow-wrap:anywhere]">{context.uploader_id}</span>{' '}
        <span className="whitespace-nowrap">· {uploaderRoleLabel(context.uploader_role, t)}</span>
      </dd>
      <dt className="text-muted-foreground">{t('moderation.image.uploadedAt')}</dt>
      <dd>{context.uploaded_at ? formatDayAndTime(context.uploaded_at) : t('moderation.unknownTime')}</dd>
      {context.conversation_id && (
        <>
          <dt className="text-muted-foreground">{t('moderation.image.conversation')}</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere]">{context.conversation_id}</dd>
        </>
      )}
    </dl>
  )
}

/** Rekognition's confidence is out of 100. */
function formatConfidence(confidence: number) {
  return new Intl.NumberFormat(formattingLocale(), { style: 'percent', maximumFractionDigits: 1 }).format(
    confidence / 100,
  )
}

function uploaderRoleLabel(value: string, t: TFunction) {
  return t(`admin:moderation.image.role.${value}`, { defaultValue: value })
}

/**
 * The queue's line for an `image_upload` case: it has no text to preview, and
 * the image itself is not shown there, only what it was blocked for.
 */
export function blockedImageLine(item: ModerationCase, t: TFunction) {
  const categories = [...new Set((item.image_context?.hits ?? []).map((hit) => hit.category))]
  return categories.length > 0
    ? t('admin:moderation.image.listLine', { categories: categories.join(', ') })
    : t('admin:moderation.image.title')
}
