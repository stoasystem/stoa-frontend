import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { ASK_RISE } from '@/features/ask/askLayout'

/** The whole box shown: where full screen ends, and where leaving it starts. */
const WHOLE = 'inset(0px 0px 0px 0px round 0px)'

/** The sheet's timing (`--motion-sheet`, `--ease-standard`), read from the tokens. */
function timing(): KeyframeAnimationOptions {
  const tokens = getComputedStyle(document.documentElement)
  const duration = Number.parseFloat(tokens.getPropertyValue('--motion-sheet'))
  const easing = tokens.getPropertyValue('--ease-standard').trim()
  return { duration: Number.isFinite(duration) ? duration : 320, easing: easing || 'ease' }
}

/**
 * Where risen Ask stands (`ASK_RISE`), as a clip of the whole window: centred
 * in its host, the composer's width at most, from `top` under the host's top
 * to the composer's line.
 */
function risenClip(surface: HTMLElement): string | null {
  const host = surface.parentElement?.getBoundingClientRect()
  if (!host || host.width === 0) return null
  const width = Math.min(ASK_RISE.width, host.width - 2 * ASK_RISE.inset)
  const left = host.left + (host.width - width) / 2
  const right = window.innerWidth - (left + width)
  const top = host.top + ASK_RISE.top
  const bottom = window.innerHeight - (host.bottom - ASK_RISE.bottom)
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${ASK_RISE.radius}px)`
}

/**
 * Ask given the whole screen (#676): the button in its header, risen over the
 * map on a wide screen or as the sheet on a phone.
 *
 * Nothing is stored: `reset` (Ask closed, or moved beside the map) ends it, so
 * the next open rises at the normal size.
 *
 * Wide, full screen is the whole window: risen Ask is held in its host, under
 * the top bar, so it cannot grow out of it; full screen stands over
 * everything instead, and the size it grows from or back to is drawn as a
 * clip of that box, which keeps what is in it as it is rather than squashed.
 * Leaving waits for the clip to reach the risen size, then puts Ask back there.
 * The phone's sheet eases its own height (`AskHost`). Under reduced motion
 * either way is a step.
 */
export function useAskFullScreen({
  surface,
  reset,
  wide,
  reducedMotion,
}: {
  surface: RefObject<HTMLElement | null>
  reset: boolean
  wide: boolean
  reducedMotion: boolean
}) {
  const [full, setFull] = useState(false)
  if (reset && full) setFull(false)
  const animation = useRef<Animation | null>(null)
  const entering = useRef(false)
  const leaving = useRef(false)

  const stop = useCallback(() => {
    animation.current?.cancel()
    animation.current = null
    leaving.current = false
  }, [])
  useEffect(() => {
    if (reset) stop()
  }, [reset, stop])
  useEffect(() => stop, [stop])

  // Entered: grown from where risen Ask stood to the whole window.
  useLayoutEffect(() => {
    if (!full || !entering.current) return
    entering.current = false
    const element = surface.current
    const from = element && risenClip(element)
    if (!element?.animate || !from) return
    stop()
    animation.current = element.animate([{ clipPath: from }, { clipPath: WHOLE }], timing())
  }, [full, surface, stop])

  const leave = useCallback(() => {
    const element = surface.current
    const to = element && risenClip(element)
    if (!wide || reducedMotion || !element?.animate || !to) {
      stop()
      setFull(false)
      return
    }
    if (leaving.current) return
    stop()
    leaving.current = true
    const shrinking = element.animate([{ clipPath: WHOLE }, { clipPath: to }], { ...timing(), fill: 'forwards' })
    animation.current = shrinking
    shrinking.onfinish = () => {
      if (animation.current !== shrinking) return
      // Back at the risen size before the clip goes, so no frame shows it whole.
      flushSync(() => setFull(false))
      stop()
    }
  }, [surface, wide, reducedMotion, stop])

  const toggle = useCallback(() => {
    if (full) {
      leave()
      return
    }
    entering.current = wide && !reducedMotion
    setFull(true)
  }, [full, leave, wide, reducedMotion])

  return { full, toggle, leave }
}
