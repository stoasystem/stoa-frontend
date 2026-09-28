import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  drawJumpFrame,
  jumpFrameAt,
  jumpOriginFrom,
  JUMP_MS,
  type JumpColors,
  type JumpOrigin,
} from '@/features/chapter/jump'
import { usePrefersReducedMotion } from '@/features/starmap/motion/usePrefersReducedMotion'
import '@/features/chapter/chapter.css'

const FALLBACK_COLORS: JumpColors = { sky: '#0A1020', lit: '#F2C572', core: '#FFF8EA' }

function colorsFrom(element: Element): JumpColors {
  const style = getComputedStyle(element)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    sky: read('--sky', FALLBACK_COLORS.sky),
    lit: read('--lit', FALLBACK_COLORS.lit),
    core: read('--lit-core', FALLBACK_COLORS.core),
  }
}

/**
 * The way into a chapter from a star (see `jump.ts`). The map hands over where
 * the star was in the navigation state; the chapter plays the jump from there
 * once, on a canvas over itself, and then drops that state so going back or
 * reloading does not play it again. Under reduced motion the chapter
 * crossfades in instead, and nothing is drawn.
 */
export function JumpTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const reducedMotion = usePrefersReducedMotion()
  const [origin] = useState<JumpOrigin | null>(() => jumpOriginFrom(location.state))
  const [playing, setPlaying] = useState(origin !== null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const dropped = useRef(false)

  useEffect(() => {
    if (!origin || dropped.current) return
    dropped.current = true
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null })
  }, [origin, navigate, location.pathname, location.search])

  useEffect(() => {
    if (!playing || reducedMotion || !origin) return
    const element = canvas.current
    const context = element?.getContext?.('2d') ?? null
    if (!element || !context) {
      setPlaying(false)
      return
    }
    const width = window.innerWidth
    const height = window.innerHeight
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    element.width = Math.round(width * ratio)
    element.height = Math.round(height * ratio)
    context.scale(ratio, ratio)
    const colors = colorsFrom(element)
    let frame = 0
    let start: number | null = null
    const step = (now: number) => {
      start ??= now
      const elapsed = now - start
      drawJumpFrame(context, jumpFrameAt(elapsed), origin, { width, height }, colors)
      if (elapsed >= JUMP_MS) {
        setPlaying(false)
        return
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    // A tab in the background runs no frames: the jump is over by then anyway.
    const done = window.setTimeout(() => setPlaying(false), JUMP_MS + 250)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(done)
    }
  }, [playing, reducedMotion, origin])

  if (origin && reducedMotion) {
    return (
      <div data-jump="crossfade" data-chapter-motion="crossfade" className="flex min-h-0 flex-1 flex-col">
        {children}
      </div>
    )
  }

  return (
    <div data-jump={playing ? 'canvas' : undefined} className="flex min-h-0 flex-1 flex-col">
      {children}
      {playing && (
        <canvas
          ref={canvas}
          aria-hidden="true"
          data-jump-canvas
          className="pointer-events-none fixed inset-0 z-50 h-full w-full"
        />
      )}
    </div>
  )
}
