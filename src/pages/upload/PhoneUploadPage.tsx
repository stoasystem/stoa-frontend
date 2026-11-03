import { Camera, Check, Image as ImageGlyph } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import { Seo } from '@/components/common/Seo'
import { usePhoneUpload, type PhoneUploadPhase } from '@/features/uploads/usePhoneUpload'
import { AuthLayout } from '@/layouts/AuthLayout'
import {
  CAMERA_ACCEPT_ATTRIBUTE,
  IMAGE_SOURCE_MAX_BYTES,
  PHOTO_ACCEPT_ATTRIBUTE,
  megabytes,
} from '@/services/files/uploadLimits'

/**
 * The code, from after the `#` of the address the QR opened (#514). Read once:
 * the page then takes it out of the address bar, so it is not left in the
 * phone's history or in a screenshot of the page.
 */
function codeFromAddress() {
  return window.location.hash.replace(/^#/, '').trim()
}

/**
 * What a phone opens from the QR in Ask on the computer (#514): take or choose
 * one photo, and it goes into that conversation. No sign-in: the code in the
 * address is what lets it in, once, for ten minutes.
 */
export function PhoneUploadPage() {
  const { t } = useTranslation('uploads')
  const [code] = useState(codeFromAddress)

  useEffect(() => {
    if (!window.location.hash) return
    // The router's own state is kept; only the fragment goes.
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }, [])

  return (
    <AuthLayout>
      <Seo title={`${t('phone.title')} | STOA`} />
      <section
        aria-labelledby="phone-upload-title"
        className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-[20px] border border-[color:var(--card-border)] bg-surface p-6"
      >
        <h1 id="phone-upload-title" className="m-0 text-[22px] font-semibold leading-tight text-ink">
          {t('phone.title')}
        </h1>
        {code ? <PhoneUpload code={code} /> : (
          <p role="alert" className="m-0 text-[15px] text-red">
            {t('phone.noCode')}
          </p>
        )}
      </section>
    </AuthLayout>
  )
}

function PhoneUpload({ code }: { code: string }) {
  const { t } = useTranslation('uploads')
  const { phase, choose, retry } = usePhoneUpload(code)
  const camera = useRef<HTMLInputElement>(null)
  const picker = useRef<HTMLInputElement>(null)

  const offerChoice = phase.step === 'choose' || (phase.step === 'stopped' && phase.next === 'choose')

  return (
    <>
      {phase.step !== 'sent' && <p className="m-0 text-[15px] text-caption">{t('phone.intro')}</p>}
      <p role="status" className="m-0 text-[15px] text-ink">
        {phase.step === 'sending' && t('phone.sending')}
      </p>
      {phase.step === 'sent' && <Sent />}
      {phase.step === 'stopped' && <Stopped phase={phase} />}
      {offerChoice && (
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={() => camera.current?.click()}>
            <Camera size={ICON.rowLeading} strokeWidth={ICON.stroke} aria-hidden="true" />
            {t('phone.take')}
          </Button>
          <Button fullWidth variant="tinted" onClick={() => picker.current?.click()}>
            <ImageGlyph size={ICON.rowLeading} strokeWidth={ICON.stroke} aria-hidden="true" />
            {t('phone.choose')}
          </Button>
        </div>
      )}
      {phase.step === 'stopped' && phase.next === 'retry' && (
        <Button fullWidth onClick={() => void retry()}>
          {t('phone.retry')}
        </Button>
      )}
      <input
        ref={camera}
        type="file"
        accept={CAMERA_ACCEPT_ATTRIBUTE}
        capture="environment"
        data-phone-camera
        className="hidden"
        onChange={(event) => {
          void choose(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={picker}
        type="file"
        accept={PHOTO_ACCEPT_ATTRIBUTE}
        data-phone-picker
        className="hidden"
        onChange={(event) => {
          void choose(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </>
  )
}

function Sent() {
  const { t } = useTranslation('uploads')
  return (
    <div data-phone-sent className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
        <Check size={ICON.rowLeading} strokeWidth={ICON.stroke} />
      </span>
      <p className="m-0 text-[15px] text-ink">{t('phone.sent')}</p>
    </div>
  )
}

function Stopped({ phase }: { phase: Extract<PhoneUploadPhase, { step: 'stopped' }> }) {
  const { t } = useTranslation('uploads')
  return (
    <p role="alert" data-phone-stop={phase.stop} className="m-0 text-[15px] text-red">
      {t(`phone.stops.${phase.stop}`, { limit: megabytes(IMAGE_SOURCE_MAX_BYTES) })}
    </p>
  )
}
