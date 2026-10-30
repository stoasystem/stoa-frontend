import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, IconButton } from '@/components/base'
import { QrCode } from '@/features/uploads/QrCode'
import type { PhoneCodeView } from '@/features/uploads/usePhoneUploadCode'
import { useObjectUrl } from '@/features/uploads/drawnImage'
import { phoneUploadUrl } from '@/services/files/uploadCodeApi'
import type { ValidatedUpload } from '@/types/file'

const QR_SIZE = 148

/** "9:41": minutes and seconds left, rounded up so it never shows 0:00 early. */
function minutesAndSeconds(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * The QR over Ask's composer (#514): scanned with the phone, it opens a page
 * there that sends one photo into this conversation. While the phone sends,
 * the card says so; once the photo has passed it is shown here, and joins the
 * question only when the student adds it -- whoever scans first holds the code,
 * so a photo is never added unseen (stoa-backend#171, audit item M1).
 */
export function PhoneUploadCard({
  view,
  onAdd,
  onRenew,
  onClose,
}: {
  view: PhoneCodeView
  onAdd: (upload: ValidatedUpload) => void
  /** A fresh code, in place of one that ran out, failed or was never made. */
  onRenew: () => void
  onClose: () => void
}) {
  const { t } = useTranslation('chat')
  const sentence = view.step === 'unmade' ? t(`ask.phone.unmade.${view.problem}`) : t(`ask.phone.${view.step}`)
  const renew = (
    <Button size="small" variant="tinted" onClick={onRenew}>
      {t(view.step === 'unmade' ? 'ask.phone.tryAgain' : 'ask.phone.newCode')}
    </Button>
  )

  return (
    <section
      data-phone-upload={view.step}
      aria-label={t('ask.phone.label')}
      className="relative mb-1.5 flex gap-3 rounded-[12px] border border-[color:var(--card-border)] bg-surface p-3 pr-9"
    >
      <IconButton
        label={t('ask.phone.close')}
        icon={X}
        size={24}
        variant="gray"
        onClick={onClose}
        className="absolute right-2 top-2"
      />
      {view.step === 'waiting' && (
        <QrCode
          value={phoneUploadUrl(view.code.code)}
          label={t('ask.phone.qrLabel')}
          failed={t('ask.phone.qrFailed')}
          size={QR_SIZE}
        />
      )}
      {view.step === 'ready' && <Preview photo={view.photo} />}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {view.step === 'waiting' && <h3 className="m-0 text-[15px] font-semibold text-ink">{t('ask.phone.title')}</h3>}
        {view.step === 'unmade' || view.step === 'failed' || (view.step === 'ready' && view.photoFailed) ? (
          <p role="alert" className="m-0 text-[13px] text-red">
            {view.step === 'ready' ? t('ask.phone.photoFailed') : sentence}
          </p>
        ) : (
          <p role="status" className="m-0 text-[13px] text-ink">
            {view.step === 'ready' && !view.photo ? t('ask.phone.loadingPhoto') : sentence}
          </p>
        )}
        {view.step === 'waiting' && (
          <p className="m-0 text-[12px] text-caption" data-phone-countdown>
            {t('ask.phone.validFor', { time: minutesAndSeconds(view.remainingMs) })}
          </p>
        )}
        {view.step === 'ready' && view.photo && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              onClick={() =>
                onAdd({
                  uploadId: view.uploadId,
                  expiresAt: view.expiresAt,
                  // The photo went up as the JPEG the phone made of it (#508).
                  filename: `${t('ask.phone.photoName')}.jpg`,
                  mimeType: view.photo?.type || 'image/jpeg',
                  sizeBytes: view.photo?.size ?? 0,
                })
              }
            >
              {t('ask.phone.add')}
            </Button>
            <Button size="small" variant="gray" onClick={onClose}>
              {t('ask.phone.notMine')}
            </Button>
          </div>
        )}
        {(view.step === 'unmade' ||
          view.step === 'failed' ||
          view.step === 'expired' ||
          (view.step === 'ready' && view.photoFailed)) && <div>{renew}</div>}
      </div>
    </section>
  )
}

function Preview({ photo }: { photo?: Blob }) {
  const { t } = useTranslation('chat')
  const url = useObjectUrl(photo)
  return (
    <div className="flex size-[148px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-fill">
      {url && <img src={url} alt={t('ask.phone.photoAlt')} className="size-full object-contain" />}
    </div>
  )
}
