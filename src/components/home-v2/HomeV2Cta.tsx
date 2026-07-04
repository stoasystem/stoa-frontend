import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function HomeV2Cta({
  children,
  className,
  to,
  tone = 'dark',
}: {
  children: ReactNode
  className?: string
  to: string
  tone?: 'dark' | 'light' | 'ghost'
}) {
  const toneClassName = {
    dark: 'bg-[hsl(var(--home-v2-ink))] text-[hsl(var(--home-v2-paper))] shadow-[0_22px_52px_hsl(var(--home-v2-ink)/0.22)]',
    light: 'bg-[hsl(var(--home-v2-porcelain))] text-[hsl(var(--home-v2-ink))] ring-1 ring-[hsl(var(--home-v2-line)/0.5)] shadow-[0_20px_50px_hsl(var(--home-v2-ink)/0.1)]',
    ghost: 'bg-[hsl(var(--home-v2-paper)/0.56)] text-[hsl(var(--home-v2-ink))] ring-1 ring-[hsl(var(--home-v2-line)/0.55)]',
  }[tone]

  const iconClassName = {
    dark: 'bg-[hsl(var(--home-v2-paper)/0.12)] text-[hsl(var(--home-v2-paper))]',
    light: 'bg-[hsl(var(--home-v2-ink)/0.07)] text-[hsl(var(--home-v2-ink))]',
    ghost: 'bg-[hsl(var(--home-v2-burgundy)/0.08)] text-[hsl(var(--home-v2-burgundy))]',
  }[tone]
  const textColor = tone === 'dark' ? 'hsl(var(--home-v2-paper))' : 'hsl(var(--home-v2-ink))'

  return (
    <Link
      to={to}
      style={{ color: textColor }}
      className={cn(
        'home-v2-magnetic group inline-flex min-h-14 min-w-40 items-center justify-between gap-4 rounded-full py-2 pl-6 pr-2 text-sm font-semibold',
        toneClassName,
        className,
      )}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full text-base transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105',
          iconClassName,
        )}
      >
        ↗
      </span>
    </Link>
  )
}
