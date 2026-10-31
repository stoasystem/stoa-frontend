import { FileText, Image as ImageGlyph, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import type { AttachmentDraft } from '@/features/uploads/useAttachmentUploads'
import {
  ATTACHMENTS_PER_MESSAGE,
  DOCUMENT_MAX_BYTES,
  IMAGE_SOURCE_MAX_BYTES,
  isPreparedImage,
  megabytes,
} from '@/services/files/uploadLimits'

/**
 * The files waiting over the composer (#125): one row each, with what is
 * happening to it and a way to take it back out.
 *
 * Every sentence here is this side's own. The upload API's prose is English and
 * written for whoever wrote the request; what a student reads is chosen from the
 * stable code it comes with (`attachmentProblems.ts`).
 *
 * The same tray sits over a teacher's reply (#513), where it speaks to the
 * teacher as the teacher pages do: `copy` picks whose sentences it uses.
 */
export function AttachmentTray({
  drafts,
  overflow,
  onRemove,
  copy = 'student',
}: {
  drafts: readonly AttachmentDraft[]
  /** More files were chosen than a message carries; the extras were left out. */
  overflow: boolean
  onRemove: (localId: string) => void
  copy?: TrayCopy
}) {
  const { prefix } = COPY[copy]
  const t = useTrayTranslation(copy)
  const uploading = drafts.filter((draft) => draft.state === 'uploading')

  return (
    <>
      {/* Mounted before the first file is chosen: a live region that appears
          together with its text is not announced, and each row's "Adding…"
          did just that (#450). */}
      <p role="status" className="sr-only">
        {uploading.map((draft) => t(`${prefix}.uploadingFile`, { name: draft.filename })).join(' ')}
      </p>
      {(drafts.length > 0 || overflow) && <Tray drafts={drafts} overflow={overflow} onRemove={onRemove} copy={copy} />}
    </>
  )
}

/** Whose words the tray speaks: the student's in Ask, the teacher's over a reply. */
export type TrayCopy = 'student' | 'teacher'

const COPY = {
  student: { prefix: 'ask.attachments' },
  teacher: { prefix: 'reply.attachments' },
} as const satisfies Record<TrayCopy, { prefix: string }>

/**
 * Both namespaces are named as they are written, so what the tray reads can be
 * told from its code (onDemandCopy456); the one `copy` asks for is used.
 */
function useTrayTranslation(copy: TrayCopy) {
  const { t: student } = useTranslation('chat')
  const { t: teacher } = useTranslation('teacher')
  return copy === 'teacher' ? teacher : student
}

function Tray({
  drafts,
  overflow,
  onRemove,
  copy,
}: {
  drafts: readonly AttachmentDraft[]
  overflow: boolean
  onRemove: (localId: string) => void
  copy: TrayCopy
}) {
  const { prefix } = COPY[copy]
  const t = useTrayTranslation(copy)
  return (
    <div data-ask-attachments className="mb-1.5 flex flex-col gap-1">
      {drafts.length > 0 && (
        <ul aria-label={t(`${prefix}.label`)} className="m-0 flex list-none flex-col gap-1 p-0">
          {drafts.map((draft) => (
            <li
              key={draft.localId}
              data-attachment-state={draft.state}
              className="flex items-center gap-2 rounded-[12px] border border-[color:var(--card-border)] bg-surface px-2.5 py-1.5"
            >
              <span aria-hidden="true" className="shrink-0 text-caption">
                {isPreparedImage(draft.filename) ? (
                  <ImageGlyph size={ICON.rowLeading} strokeWidth={ICON.stroke} />
                ) : (
                  <FileText size={ICON.rowLeading} strokeWidth={ICON.stroke} />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] text-ink">{draft.filename}</span>
                {draft.state === 'uploading' && (
                  <span className="text-[12px] text-caption">
                    {t(`${prefix}.uploading`)}
                  </span>
                )}
                {draft.state === 'failed' && (
                  <span role="alert" className="text-[12px] text-red">
                    {t(`${prefix}.errors.${draft.problem ?? 'failed'}`, {
                      // A photo as chosen: it is shrunk far under the backend's own limit (#508).
                      imageLimit: megabytes(IMAGE_SOURCE_MAX_BYTES),
                      fileLimit: megabytes(DOCUMENT_MAX_BYTES),
                    })}
                  </span>
                )}
              </span>
              <IconButton
                label={t(`${prefix}.remove`, { name: draft.filename })}
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
          {t(`${prefix}.errors.tooMany`, { count: ATTACHMENTS_PER_MESSAGE })}
        </p>
      )}
    </div>
  )
}
