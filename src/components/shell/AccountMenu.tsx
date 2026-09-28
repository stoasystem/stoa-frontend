import * as Menu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, CircleHelp, CreditCard, Globe, KeyRound, LogOut, UserRound, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { navAreaForRole } from '@/app/router/routeManifest'
import { Avatar, type AvatarSize } from '@/components/base/Avatar'
import { ACCOUNT_MENU, ICON } from '@/components/base/sizes'
import { accountMenuFor } from '@/components/shell/accountMenuTargets'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { languageNameKeys, useChangeLanguage } from '@/hooks/i18n/useChangeLanguage'
import { supportedLanguages } from '@/i18n/languages'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

/*
 * Components board, "Account menu": language, password, support and sign-out
 * live behind the avatar. Radix gives it the menu keyboard model: Enter, Space
 * or the arrow keys open it, the arrows move, Escape closes it and focus goes
 * back to the avatar. It works the same at every width (#2, #20).
 */

const PANEL =
  'z-50 flex flex-col border border-[color:var(--float-border)] bg-[rgba(255,255,255,0.96)] p-1.5 text-ink shadow-[var(--shadow-float)] backdrop-blur-[20px] outline-none'
const ITEM =
  'flex w-full cursor-pointer select-none items-center gap-2.5 border-0 bg-transparent px-2.5 text-left text-[14px] text-ink no-underline outline-none data-[highlighted]:bg-fill data-[disabled]:cursor-default data-[disabled]:opacity-40'

function ItemBody({ icon: Icon, children, tone }: { icon: LucideIcon; children: ReactNode; tone?: 'red' }) {
  return (
    <>
      <Icon
        aria-hidden="true"
        size={ACCOUNT_MENU.glyph}
        strokeWidth={ICON.stroke}
        className={cn('shrink-0', tone === 'red' ? 'text-red' : 'text-caption')}
      />
      <span className="flex-1">{children}</span>
    </>
  )
}

const itemStyle = { height: ACCOUNT_MENU.item, borderRadius: ACCOUNT_MENU.itemRadius }

function LinkItem({ to, icon, children }: { to: string | null; icon: LucideIcon; children: ReactNode }) {
  if (!to) {
    return (
      <Menu.Item disabled className={ITEM} style={itemStyle}>
        <ItemBody icon={icon}>{children}</ItemBody>
      </Menu.Item>
    )
  }
  return (
    <Menu.Item asChild className={ITEM} style={itemStyle}>
      <Link to={to}>
        <ItemBody icon={icon}>{children}</ItemBody>
      </Link>
    </Menu.Item>
  )
}

const extraIcons: Record<string, LucideIcon> = { billing: CreditCard }

export function AccountMenu({ avatarSize = 30 }: { avatarSize?: AvatarSize }) {
  const { t } = useTranslation('common')
  const user = useAuthStore((state) => state.user)
  const { signOut, isSigningOut } = useSignOut()
  const { current, changeLanguage } = useChangeLanguage()

  if (!user) return null

  const targets = accountMenuFor(navAreaForRole(user.role))

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button
          type="button"
          aria-label={t('accountMenu.open')}
          title={t('accountMenu.open')}
          data-account-trigger
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0"
        >
          <Avatar name={user.name} size={avatarSize} />
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={8}
          collisionPadding={8}
          aria-label={t('accountMenu.open')}
          className={PANEL}
          style={{ width: ACCOUNT_MENU.width, maxWidth: 'calc(100vw - 16px)', borderRadius: 12 }}
        >
          <div className="mb-1.5 flex items-center gap-2.5 border-b border-hairline px-2.5 pt-1.5 pb-2.5">
            <Avatar name={user.name} size={36} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] leading-[1.3] font-semibold">{user.name}</span>
              <span className="truncate text-[12px] leading-[1.3] text-caption">{t(`roles.${user.role}`)}</span>
            </div>
          </div>

          <LinkItem to={targets.profile} icon={UserRound}>
            {t('navigation.profile')}
          </LinkItem>

          <Menu.Sub>
            <Menu.SubTrigger className={ITEM} style={itemStyle}>
              <ItemBody icon={Globe}>{t('language.label')}</ItemBody>
              <span className="text-[13px] text-caption">{t(languageNameKeys[current])}</span>
              <ChevronRight aria-hidden="true" size={14} strokeWidth={2} className="shrink-0 text-tertiary" />
            </Menu.SubTrigger>
            <Menu.Portal>
              <Menu.SubContent
                sideOffset={6}
                collisionPadding={8}
                className={PANEL}
                style={{ minWidth: 180, borderRadius: 12 }}
              >
                <Menu.RadioGroup value={current}>
                  {supportedLanguages.map((code) => (
                    <Menu.RadioItem
                      key={code}
                      value={code}
                      lang={code}
                      onSelect={() => changeLanguage(code)}
                      className={ITEM}
                      style={itemStyle}
                    >
                      <span className="flex-1">{t(languageNameKeys[code])}</span>
                      <Menu.ItemIndicator>
                        <Check aria-hidden="true" size={16} strokeWidth={ICON.stroke} className="text-accent" />
                      </Menu.ItemIndicator>
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu.SubContent>
            </Menu.Portal>
          </Menu.Sub>

          <LinkItem to={targets.password} icon={KeyRound}>
            {t('actions.changePassword')}
          </LinkItem>
          <LinkItem to={targets.help} icon={CircleHelp}>
            {t('accountMenu.help')}
          </LinkItem>
          {targets.extras.map((extra) => (
            <LinkItem key={extra.key} to={extra.to} icon={extraIcons[extra.key] ?? CircleHelp}>
              {t(extra.labelKey)}
            </LinkItem>
          ))}

          <Menu.Separator className="mx-0 my-1.5 h-px bg-hairline" />
          <Menu.Item
            className={cn(ITEM, 'text-red')}
            style={itemStyle}
            disabled={isSigningOut}
            onSelect={() => void signOut()}
          >
            <ItemBody icon={LogOut} tone="red">
              {t('actions.logOut')}
            </ItemBody>
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
