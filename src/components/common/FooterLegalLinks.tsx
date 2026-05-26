import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { stoaContactInfo } from '@/lib/brandContact'

export function FooterLegalLinks() {
  const { t } = useTranslation('common')

  return (
    <nav aria-label={t('footer.legal')} className="flex min-w-0 flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <Link className="hover:text-foreground" to="/privacy">
        {t('navigation.privacy')}
      </Link>
      <Link className="hover:text-foreground" to="/terms">
        {t('navigation.terms')}
      </Link>
      <Link className="hover:text-foreground" to="/contact">
        {t('footer.contact')}
      </Link>
      <a className="hover:text-foreground" href={stoaContactInfo.homepageUrl}>
        {t('footer.backToHomepage')}
      </a>
    </nav>
  )
}

