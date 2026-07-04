import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLogo } from '@/components/common/AppLogo'
import { cn } from '@/lib/utils'
import { HomeV2Cta } from '@/components/home-v2/HomeV2Cta'

const navItems = [
  { key: 'navigation.howItWorks', to: '/how-it-works' },
  { key: 'navigation.parents', to: '/for-parents' },
  { key: 'navigation.tutors', to: '/teacher-support' },
  { key: 'navigation.pricing', to: '/pricing' },
]

export function HomeV2PremiumHeader({ learningHref }: { learningHref: string }) {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-5 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full bg-[hsl(var(--home-v2-porcelain)/0.82)] p-1.5 shadow-[0_18px_54px_hsl(var(--home-v2-ink)/0.12)] ring-1 ring-[hsl(var(--home-v2-line)/0.48)] backdrop-blur-xl">
          <Link to="/" className="ml-3 min-w-0">
            <AppLogo />
          </Link>
          <nav className="hidden items-center gap-7 px-3 text-[13px] font-medium text-[hsl(var(--home-v2-ink)/0.62)] lg:flex">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="home-v2-nav-link whitespace-nowrap">
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:block">
            <HomeV2Cta to={learningHref} tone="dark" className="min-h-11 py-1 pl-5 text-[13px]">
              {t('navigation.startLearning')}
            </HomeV2Cta>
          </div>
          <button
            type="button"
            className="relative mr-1 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--home-v2-ink))] text-[hsl(var(--home-v2-paper))] lg:hidden"
            aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            <span
              className={cn(
                'absolute h-px w-5 bg-current transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
                isOpen ? 'translate-y-0 rotate-45' : '-translate-y-1.5 rotate-0',
              )}
            />
            <span
              className={cn(
                'absolute h-px w-5 bg-current transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
                isOpen ? 'translate-y-0 -rotate-45' : 'translate-y-1.5 rotate-0',
              )}
            />
          </button>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-30 bg-[hsl(var(--home-v2-ink)/0.86)] px-5 pt-28 text-[hsl(var(--home-v2-paper))] backdrop-blur-3xl transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="mx-auto grid max-w-sm gap-5">
          {navItems.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'home-v2-display text-4xl transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
                isOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0',
              )}
              style={{ transitionDelay: isOpen ? `${120 + index * 60}ms` : '0ms' }}
              onClick={() => setIsOpen(false)}
            >
              {t(item.key)}
            </Link>
          ))}
          <HomeV2Cta to={learningHref} tone="light" className="mt-4 w-max" >
            {t('navigation.startLearning')}
          </HomeV2Cta>
        </div>
      </div>
    </>
  )
}
