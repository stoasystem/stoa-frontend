import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Stat = { key: string; value: ReactNode; label: ReactNode }

/*
 * Teacher board: a row of figures under the page title, no cards. The value
 * is 28 / 600 (tracking -0.5), its label 13 in the secondary colour under it;
 * 48 between figures.
 */
export function Stats({ items, className }: { items: readonly Stat[]; className?: string }) {
  return (
    <dl className={cn('m-0 flex flex-wrap gap-x-12 gap-y-4 py-1', className)}>
      {items.map((item) => (
        // The label is the term; it is drawn under its figure.
        <div key={item.key} className="flex flex-col-reverse gap-0.5">
          <dt className="text-[13px] leading-[1.3] text-caption">{item.label}</dt>
          <dd className="m-0 text-[28px] leading-[1.1] font-semibold tracking-[-0.5px] text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
