import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SegmentedNav, type SegmentedNavItem } from '@/components/base/Segmented'
import { TOP_BAR, TOP_BAR_PHONE } from '@/components/base/sizes'
import { StoaLogo } from '@/components/common/StoaLogo'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { AccountMenu } from '@/components/shell/AccountMenu'

/*
 * The one top bar (Sizes: 56 high; logo 30, bell 36, avatar 30, gap 6, side
 * padding 20. Placement, phone: 44 below the safe area, 16 / 8 from the edges,
 * logo 26, avatar 28). Surface at 86% under a blur, a separator underneath.
 * The logo is the home button; there is no separate Home (canvas rule 6).
 */
export function TopBar({
  homePath,
  wide,
  segments,
  activeIndex,
  signedIn,
}: {
  homePath: string
  wide: boolean
  /** A teacher's or parent's pages; below the bar on a phone. */
  segments?: readonly SegmentedNavItem[]
  activeIndex: number
  signedIn: boolean
}) {
  const { t } = useTranslation('common')
  const bar = wide ? TOP_BAR : TOP_BAR_PHONE
  const segmented = segments && segments.length > 0 && (
    <SegmentedNav items={segments} activeIndex={activeIndex} label={t('navigation.primary')} fullWidth={!wide} />
  )

  return (
    <header
      data-top-bar
      className="sticky top-0 z-30 border-b border-separator"
      style={{
        background: 'var(--bar)',
        backdropFilter: 'blur(var(--bar-blur))',
        WebkitBackdropFilter: 'blur(var(--bar-blur))',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        data-top-bar-row
        className="grid items-center"
        style={{
          height: bar.height,
          gridTemplateColumns: '1fr auto 1fr',
          paddingLeft: wide ? TOP_BAR.paddingX : TOP_BAR_PHONE.paddingLeft,
          paddingRight: wide ? TOP_BAR.paddingX : TOP_BAR_PHONE.paddingRight,
        }}
      >
        <Link to={homePath} aria-label={t('navigation.logoHome')} className="flex items-center justify-self-start">
          <StoaLogo height={bar.logo} />
        </Link>
        <div className="justify-self-center">{wide && segmented}</div>
        <div className="flex items-center justify-self-end" style={{ gap: bar.gap }}>
          {signedIn && <NotificationCenter />}
          <AccountMenu avatarSize={bar.avatar} />
        </div>
      </div>
      {!wide && segmented && <div className="px-4 pb-2">{segmented}</div>}
    </header>
  )
}
