import { useEffect, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AttachmentTray, type TrayCopy } from '@/features/uploads/AttachmentTray'
import { PhoneUploadCard } from '@/features/uploads/PhoneUploadCard'
import type { AttachmentsView } from '@/features/uploads/useAttachments'
import { usePhoneUploadCode } from '@/features/uploads/usePhoneUploadCode'
import { ACCEPT_ATTRIBUTE, CAMERA_ACCEPT_ATTRIBUTE, IMAGE_ACCEPT_ATTRIBUTE } from '@/services/files/uploadLimits'

/**
 * The files waiting to go out with the next message, where the composer puts
 * them (#561): the phone's card while one is open, the tray, and the hidden
 * inputs `useAttachments`' sources open.
 *
 * `copy` says whose words the tray speaks (#513). Over a teacher's reply,
 * `needsText` says the reply has no words yet: pictures alone are not a reply
 * the backend takes, and the tray says so once one is ready.
 */
export function Attachments({
  view,
  copy = 'student',
  needsText = false,
}: {
  view: AttachmentsView
  copy?: TrayCopy
  needsText?: boolean
}) {
  const { add } = view
  const chosen = (event: ChangeEvent<HTMLInputElement>) => {
    add(Array.from(event.target.files ?? []))
    // Cleared, so choosing the same file twice in a row still fires.
    event.target.value = ''
  }

  return (
    <>
      {view.phone !== false && <PhoneEntry view={view} conversationId={view.phone} />}
      <AttachmentTray copy={copy} drafts={view.drafts} overflow={view.overflow} onRemove={view.remove} />
      {copy === 'teacher' ? (
        <>
          {needsText && view.drafts.some((draft) => draft.state === 'ready') && <NeedsText />}
          <input
            ref={view.picker}
            type="file"
            multiple
            hidden
            accept={view.imagesOnly ? IMAGE_ACCEPT_ATTRIBUTE : ACCEPT_ATTRIBUTE}
            data-teacher-reply-images
            onChange={chosen}
          />
        </>
      ) : (
        <input
          ref={view.picker}
          type="file"
          multiple
          accept={view.imagesOnly ? IMAGE_ACCEPT_ATTRIBUTE : ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={chosen}
        />
      )}
      {view.camera && (
        <input
          ref={view.cameraInput}
          type="file"
          accept={CAMERA_ACCEPT_ATTRIBUTE}
          capture="environment"
          data-ask-camera
          className="hidden"
          onChange={chosen}
        />
      )}
    </>
  )
}

function NeedsText() {
  const { t } = useTranslation('teacher')
  return <p className="text-sm text-muted-foreground">{t('reply.attachments.needsText')}</p>
}

/**
 * A photo taken on the phone, by a QR the computer shows (#514). The code is
 * made for no conversation (#554); the card belongs to the question it was
 * opened for. Its photo joins the tray only when the student adds it.
 */
function PhoneEntry({ view, conversationId }: { view: AttachmentsView; conversationId: string | null }) {
  const phoneCode = usePhoneUploadCode(conversationId)
  const { phoneStart, adopt } = view
  const { start, close } = phoneCode
  useEffect(() => {
    phoneStart.current = start
    return () => {
      if (phoneStart.current === start) phoneStart.current = null
    }
  }, [phoneStart, start])

  if (!phoneCode.view) return null
  return (
    <PhoneUploadCard
      view={phoneCode.view}
      onAdd={(upload) => {
        adopt(upload)
        close()
      }}
      onRenew={start}
      onClose={close}
    />
  )
}
