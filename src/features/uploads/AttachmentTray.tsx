import { FileText, Image as ImageGlyph, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import type { AttachmentDraft } from '@/features/uploads/useAttachmentUploads'
import {
  ATTACHMENTS_PER_MESSAGE,
  DOCUMENT_MAX_BYTES,
  IMAGE_EXTENSIONS,
  IMAGE_MAX_BYTES,
  extensionOf,
  megabytes,
} from '@/services/files/uploadLimits'

const isImage = (filename: string) =>
  (IMAGE_EXTENSIONS as readonly string[]).includes(extensionOf(filename))

/**
 * The files waiting over the composer (#125): one row each, with what is
 * happening to it and a way to take it back out.
 *
 * Every sentence here is this side's own. The upload API's prose is English and
 * written for whoever wrote the request; what a student reads is chosen from the
 * stable code it comes with (`attachmentProblems.ts`).
 */
export function AttachmentTray({
  drafts,
  overflow,
  onRemove,
}: {
  drafts: readonly AttachmentDraft[]
  /** More files were chosen than a message carries; the extras were left out. */
  overflow: boolean
  onRemove: (localId: string) => void
}) {
  const { t } = useTranslation('chat')
  if (drafts.length === 0 && !overflow) return null

  return (
    <div data-ask-attachments className="mb-1.5 flex flex-col gap-1">
      {drafts.length > 0 && (
        <ul aria-label={t('ask.attachments.label')} className="m-0 flex list-none flex-col gap-1 p-0">
          {drafts.map((draft) => (
            <li
              key={draft.localId}
              data-attachment-state={draft.state}
              className="flex items-center gap-2 rounded-[12px] border border-[color:var(--card-border)] bg-surface px-2.5 py-1.5"
            >
              <span aria-hidden="true" className="shrink-0 text-caption">
                {isImage(draft.filename) ? (
                  <ImageGlyph size={ICON.rowLeading} strokeWidth={ICON.stroke} />
                ) : (
                  <FileText size={ICON.rowLeading} strokeWidth={ICON.stroke} />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] text-ink">{draft.filename}</span>
                {draft.state === 'uploading' && (
                  <span role="status" className="text-[12px] text-caption">
                    {t('ask.attachments.uploading')}
                  </span>
                )}
                {draft.state === 'failed' && (
                  <span role="alert" className="text-[12px] text-red">
                    {t(`ask.attachments.errors.${draft.problem ?? 'failed'}`, {
                      imageLimit: megabytes(IMAGE_MAX_BYTES),
                      fileLimit: megabytes(DOCUMENT_MAX_BYTES),
                    })}
                  </span>
                )}
              </span>
              <IconButton
                label={t('ask.attachments.remove', { name: draft.filename })}
                icon={X}
                size={24}
                variant="gray"
                onClick={() => onRemove(draft.localId)}
              />
            </li>
          ))}
        </ul>
      )}
      {overflow && (
        <p role="alert" className="m-0 text-[12px] text-red">
          {t('ask.attachments.errors.tooMany', { count: ATTACHMENTS_PER_MESSAGE })}
        </p>
      )}
    </div>
  )
}
