import { cn } from '@/lib/utils'

export function RoadmapConnector({ align = 'center' }: { align?: 'left' | 'center' | 'right' }) {
  return (
    <div
      className={cn(
        'h-10 w-px bg-gradient-to-b from-primary/25 via-primary/15 to-transparent',
        align === 'left' && 'ml-12',
        align === 'center' && 'mx-auto',
        align === 'right' && 'ml-auto mr-12',
      )}
      aria-hidden="true"
    />
  )
}
