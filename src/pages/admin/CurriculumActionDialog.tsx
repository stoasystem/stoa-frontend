import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { CurriculumMigrationSummary } from '@/types/curriculumOperations'

export type CurriculumReviewStep = 'approve' | 'requestChanges' | 'publish'

export type CurriculumAction =
  | {
      kind: CurriculumReviewStep
      publicLessonId: string
      versionId: string
      /** The version the console believes is live; `null` when none is. */
      liveVersionId: string | null
    }
  | { kind: 'apply'; migrationId: string; summary: CurriculumMigrationSummary }

/** The backend keeps at most this much of an audit reason. */
const REASON_MAX = 500

/** Steps the backend records with a reason the admin writes. */
function needsReason(kind: CurriculumAction['kind']) {
  return kind === 'requestChanges' || kind === 'publish'
}

/**
 * The one place a curriculum review step or a migration is confirmed (#258).
 *
 * Approve, request-changes, publish and apply used to run on the first click,
 * with an English reason the console made up. Each now says what it is about
 * to change, takes the audit reason from the admin where the backend records
 * one, and shows a refusal inside the dialog so the reason survives a retry.
 */
export function CurriculumActionDialog({
  action,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  action: CurriculumAction | null
  pending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: (action: CurriculumAction, reason: string) => void
}) {
  return (
    <Dialog open={action !== null} onOpenChange={(open) => (open || pending ? null : onCancel())}>
      {action ? (
        // Keyed by step and target so a new dialog never opens on the last reason.
        <ActionForm
          key={action.kind === 'apply' ? `apply:${action.migrationId}` : `${action.kind}:${action.versionId}`}
          action={action}
          pending={pending}
          error={error}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      ) : null}
    </Dialog>
  )
}

function ActionForm({
  action,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  action: CurriculumAction
  pending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: (action: CurriculumAction, reason: string) => void
}) {
  const { t } = useTranslation('admin')
  const [reason, setReason] = useState('')
  const withReason = needsReason(action.kind)
  const ready = !pending && (!withReason || reason.trim().length > 0)

  return (
    <DialogContent>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (ready) onConfirm(action, reason.trim())
        }}
      >
        <DialogHeader>
          <DialogTitle>{t(`curriculum.confirm.title.${action.kind}`)}</DialogTitle>
          <DialogDescription>
            {action.kind === 'apply'
              ? t('curriculum.confirm.body.apply', { migration: action.migrationId })
              : t(`curriculum.confirm.body.${action.kind}`, {
                  lesson: action.publicLessonId,
                  version: action.versionId,
                })}
          </DialogDescription>
        </DialogHeader>
        {action.kind === 'publish' ? (
          <p className="text-sm text-foreground">
            {action.liveVersionId
              ? t('curriculum.confirm.liveVersion', { version: action.liveVersionId })
              : t('curriculum.confirm.noLiveVersion')}
          </p>
        ) : null}
        {action.kind === 'apply' ? (
          <p className="text-sm text-foreground">
            {t('curriculum.confirm.applySummary', {
              creates: action.summary.creates,
              updates: action.summary.updates,
              skips: action.summary.skips,
            })}
          </p>
        ) : null}
        {withReason ? (
          <label className="flex flex-col gap-1 text-sm">
            {t('curriculum.confirm.reason')}
            <Textarea
              value={reason}
              maxLength={REASON_MAX}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {t('curriculum.confirm.cancel')}
          </Button>
          <Button type="submit" disabled={!ready}>
            {t(`curriculum.confirm.submit.${action.kind}`)}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
