import { Mail, MapPin, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { stoaContactInfo } from '@/lib/brandContact'

export function FooterContactInfo() {
  const { t } = useTranslation('common')

  return (
    <address className="space-y-3 not-italic text-sm leading-6 text-muted-foreground">
      <div className="flex gap-3">
        <MapPin className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--accent))]" aria-hidden="true" />
        <div>
          <div className="font-semibold text-foreground">{t('footer.address')}</div>
          <div>{stoaContactInfo.locations}</div>
        </div>
      </div>
      <div className="flex gap-3">
        <Mail className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--accent))]" aria-hidden="true" />
        <div>
          <div className="font-semibold text-foreground">{t('footer.email')}</div>
          <a className="hover:text-foreground" href={`mailto:${stoaContactInfo.email}`}>
            {stoaContactInfo.email}
          </a>
        </div>
      </div>
      <div className="flex gap-3">
        <Phone className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--accent))]" aria-hidden="true" />
        <div>
          <div className="font-semibold text-foreground">{t('footer.phone')}</div>
          <a className="hover:text-foreground" href={stoaContactInfo.phoneHref}>
            {stoaContactInfo.phone}
          </a>
        </div>
      </div>
    </address>
  )
}

