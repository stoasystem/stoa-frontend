import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function HomeV2Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        node.classList.add('is-visible')
        observer.unobserve(node)
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.16 },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn('home-v2-reveal', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
