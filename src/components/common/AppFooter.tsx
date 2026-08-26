import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FooterContactInfo } from '@/components/common/FooterContactInfo'
import { FooterLegalLinks } from '@/components/common/FooterLegalLinks'
import { StoaLogo } from '@/components/common/StoaLogo'
import { cn } from '@/lib/utils'

export function AppFooter({
  className,
  style,
  bottomClassName,
  bottomStyle,
}: {
  className?: string
  style?: CSSProperties
  bottomClassName?: string
  bottomStyle?: CSSProperties
}) {
  const { t } = useTranslation('common')

  return (
    <footer
      className={cn(
        'border-t border-[hsl(var(--border)/0.95)] bg-[hsl(35_25%_90%)] shadow-[inset_0_1px_0_hsl(42_35%_98%/0.7)]',
        className,
      )}
      style={style}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 md:grid-cols-[1.15fr_1fr_1fr]">
        <div className="min-w-0 space-y-4">
          <Link to="/" className="inline-flex">
            <StoaLogo size="md" />
          </Link>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            {t('footer.description')}
          </p>
        </div>

        <div className="min-w-0">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
            {t('footer.contactInfo')}
          </h2>
          <FooterContactInfo />
        </div>

        <div className="min-w-0 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
            {t('footer.platform')}
          </h2>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" to="/support">
              {t('navigation.support')}
            </Link>
            <a className="hover:text-foreground" href="https://stoaedu.ch">
              {t('navigation.about')}
            </a>
          </div>
        </div>
      </div>

      <div
        className={cn('border-t border-[hsl(var(--border)/0.9)] bg-[hsl(35_22%_86%)]', bottomClassName)}
        style={bottomStyle}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 text-xs text-muted-foreground sm:px-6">
          <span>{t('footer.copyright')}</span>
          <FooterLegalLinks />
        </div>
      </div>
    </footer>
  )
}
