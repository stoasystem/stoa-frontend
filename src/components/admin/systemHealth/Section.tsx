import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Section({
  title,
  children,
  actions,
  className,
}: {
  title: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <section aria-label={title} className={cn('flex min-w-0 flex-col gap-3 rounded-card border border-hairline bg-surface p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-ink" style={{ font: 'var(--t-headline)' }}>
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** The quiet line a section shows when its window holds nothing. */
export function SectionEmpty({ children }: { children: ReactNode }) {
  return (
    <p data-empty className="m-0 rounded-list bg-ground px-4 py-6 text-center text-sm text-caption">
      {children}
    </p>
  )
}

export type Column<Row> = {
  key: string
  header: string
  cell: (row: Row) => ReactNode
  numeric?: boolean
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  rowClassName,
}: {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row, index: number) => string
  rowClassName?: (row: Row) => string | undefined
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn('p-2 text-xs font-semibold whitespace-nowrap text-caption', column.numeric && 'text-right')}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className={cn('border-t border-hairline', rowClassName?.(row))}>
              {columns.map((column) => (
                <td key={column.key} className={cn('p-2 align-top', column.numeric && 'text-right whitespace-nowrap tabular-nums')}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
