import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SegmentedNav, type SegmentedNavItem } from '@/components/base/Segmented'
import { TOP_BAR, TOP_BAR_PHONE, TOUCH_TARGET } from '@/components/base/sizes'
import { StoaLogo } from '@/components/common/StoaLogo'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { AccountMenu } from '@/components/shell/AccountMenu'

/*
 * The one top bar (Sizes: 56 high; logo 30, bell 36, avatar 30, gap 6, side
 * padding 20. Placement, phone: 44 below the safe area, 16 / 8 from the edges,
 * logo 26, avatar 28). Surface at 86% under a blur, a separator underneath.
 * The logo is the home button; there is no separate Home (canvas rule 6).
 *
 * On a phone every control is a 44 target (Sizes) while drawn at its board
 * size. The targets sit side by side with no gap, and the avatar's reaches
 * into the 8 px edge padding, so the drawn avatar stays 8 from the edge and no
 * two targets overlap.
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
  const touch = !wide
  const avatarOverhang = touch ? (TOUCH_TARGET - TOP_BAR_PHONE.avatar) / 2 : 0
  const segmented = segments && segments.length > 0 && (
    <SegmentedNav
      items={segments}
      activeIndex={activeIndex}
      label={t('navigation.primary')}
      fullWidth={touch}
      hitHeight={touch ? TOUCH_TARGET : undefined}
    />
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
          paddingRight: wide ? TOP_BAR.paddingX : Math.max(0, TOP_BAR_PHONE.paddingRight - avatarOverhang),
        }}
      >
        <Link
          to={homePath}
          aria-label={t('navigation.logoHome')}
          data-logo-link
          className="flex items-center justify-self-start"
          // The logo is narrower than 44 at 26 high, so its target is widened.
          style={{ height: bar.height, minWidth: touch ? TOUCH_TARGET : undefined }}
        >
          <StoaLogo height={bar.logo} />
        </Link>
        <div className="justify-self-center">{wide && segmented}</div>
        <div className="flex items-center justify-self-end" style={{ gap: touch ? 0 : bar.gap }}>
          {signedIn && <NotificationCenter hitSize={touch ? TOUCH_TARGET : undefined} />}
          <AccountMenu avatarSize={bar.avatar} touch={touch} />
        </div>
      </div>
      {!wide && segmented && <div className="px-4 pb-[3px]">{segmented}</div>}
    </header>
  )
}
