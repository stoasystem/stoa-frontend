import { useLayoutEffect, useRef, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '@/components/auth/LoginForm'
import { TOP_BAR, TOP_BAR_PHONE } from '@/components/base/sizes'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { StoaLogo } from '@/components/common/StoaLogo'
import { useMediaQuery } from '@/hooks/layout/useMediaQuery'
import { stoaContactInfo } from '@/lib/brandContact'
import { LoginNebula } from '@/pages/login/LoginNebula'

/*
 * The sign-in page (#53): candidate 04, "the night observatory", redrawn with
 * the canvas tokens. The whole page is a sky surface (#13 §7, #18), so the
 * sky tokens exist everywhere inside it: #0A1020 ground, white text at the
 * canvas's four strengths, the white button, a star-gold focus ring, nothing
 * burgundy (the logo is drawn white) and nothing red.
 *
 * Desktop: the form flush left, a small nebula on the right where the
 * candidate drew its orbit diagram (#72: the star map replaced the planet),
 * with the caption under a hairline. Phone: the form first, the nebula
 * small beside the caption below it.
 *
 * Signing in itself is LoginForm's, unchanged; this page only places it.
 */

// A quiet link (the footer) is caption white and turns white on hover.
const linkClass =
  'inline-flex min-h-11 items-center text-[color:var(--on-sky-text-caption)] hover:text-on-sky md:min-h-0'

/** The layout's own breakpoint (Tailwind `md`); the bar and logo follow it. */
const WIDE_LOGIN_QUERY = '(min-width: 768px)'

/*
 * While the page is up, the document behind it is the sky too, so an iOS
 * overscroll or a short window never shows the light ground at the edges.
 * The colour is read from the surface itself: --sky exists only inside it.
 */
function usePaintDocumentWithSky(surface: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = surface.current
    if (!element) return
    const sky = getComputedStyle(element).getPropertyValue('--sky').trim()
    if (!sky) return
    const targets = [document.documentElement, document.body]
    const before = targets.map((target) => target.style.backgroundColor)
    targets.forEach((target) => {
      target.style.backgroundColor = sky
    })
    return () => {
      targets.forEach((target, index) => {
        target.style.backgroundColor = before[index]
      })
    }
  }, [surface])
}

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common'])
  const bar = useMediaQuery(WIDE_LOGIN_QUERY) ? TOP_BAR : TOP_BAR_PHONE
  const surface = useRef<HTMLDivElement>(null)
  usePaintDocumentWithSky(surface)

  return (
    <div
      ref={surface}
      data-surface="sky"
      className="flex min-h-dvh flex-col bg-sky text-[color:var(--on-sky-text)]"
      style={{ fontFamily: 'var(--font-system)' }}
    >
      {/* Placement, top bar: 56 high with 20 at the sides; phone 44, 16 / 8. */}
      <header
        className="flex items-center gap-4 border-b border-[color:var(--sky-glass-border)] pr-2 pl-4 md:px-5"
        style={{ height: bar.height }}
      >
        <Link to="/" className="inline-flex min-h-11 shrink-0 items-center">
          <StoaLogo variant="light" height={bar.logo} />
        </Link>
        <p className="m-0 hidden flex-1 text-center text-[13px] leading-[1.3] text-[color:var(--on-sky-text-caption)] md:block">
          {t('auth:login.audience')}
        </p>
        <LanguageSwitcher variant="sky" className="ml-auto md:ml-0" />
      </header>

      <main className="mx-auto grid w-full max-w-[1120px] flex-1 content-start gap-10 px-4 pt-8 pb-10 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:content-center md:items-center md:gap-[clamp(48px,8vw,120px)] md:px-12 md:py-9">
        <section aria-labelledby="login-title" className="w-full max-w-[420px] md:max-w-none">
          <p className="m-0 text-[13px] leading-[1.3] font-medium tracking-[0.4px] text-[color:var(--on-sky-text-caption)] uppercase">
            {t('auth:login.eyebrow')}
          </p>
          <h1
            id="login-title"
            className="mt-3 mb-0 text-[color:var(--on-sky-text)]"
            style={{ font: 'var(--t-large)', letterSpacing: 'var(--t-large-tracking)' }}
          >
            {t('auth:login.title')}
          </h1>
          <p className="mt-3 mb-0 text-[17px] leading-[1.45] text-[color:var(--on-sky-text-body)]">
            {t('auth:login.subtitle')}
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </section>

        <div className="flex max-w-[420px] items-center gap-5 border-t border-[color:var(--sky-glass-border)] pt-6 md:max-w-none md:flex-col md:items-stretch md:gap-0 md:border-t-0 md:pt-0">
          <LoginNebula className="w-[104px] shrink-0 md:mx-auto md:w-[min(360px,100%)]" />
          <p
            className="m-0 border-[color:var(--sky-glass-border)] text-[17px] leading-[1.3] font-semibold tracking-[-0.2px] text-[color:var(--on-sky-text-body)] md:mt-8 md:border-t md:pt-6 md:text-[22px] md:leading-[1.25] md:tracking-[-0.3px]"
          >
            {t('auth:login.skyCaption')}
          </p>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-[12px] leading-[1.3] text-[color:var(--on-sky-text-caption)] md:px-5 md:py-4">
        <span className="py-2 md:py-0">{t('common:footer.copyright')}</span>
        <nav aria-label={t('common:footer.legal')} className="flex flex-wrap gap-x-4 gap-y-0">
          <Link className={linkClass} to="/support">
            {t('common:accountMenu.help')}
          </Link>
          <Link className={linkClass} to="/privacy">
            {t('common:navigation.privacy')}
          </Link>
          <Link className={linkClass} to="/terms">
            {t('common:navigation.terms')}
          </Link>
          <a className={linkClass} href={stoaContactInfo.homepageUrl}>
            {t('common:footer.backToHomepage')}
          </a>
        </nav>
      </footer>
    </div>
  )
}
