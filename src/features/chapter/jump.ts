/*
 * The jump: a star tapped on the map opens its chapter (#50 point 5; canvas
 * boards "The jump · tap → hyperspace → practice" and "Motion and states").
 *
 *   The jump  560 ms  cubic-bezier(.3,.8,.2,1)  bloom 120 · streaks 300 · settle 140 · once
 *   Reduced motion  200 ms  linear  crossfade replaces everything above
 *
 * It plays once, drawn on a canvas over the chapter as it opens: a bloom of
 * star-gold at the star the student tapped, streaks flying out from it, then
 * the sky veil settles away and the chapter is there. No camera shake, no
 * sound. Only a jump that starts on the map plays it; a chapter opened from a
 * link simply appears.
 */
import { cubicBezier } from '@/features/starmap/motion/motionPolicy'

export const JUMP = { bloomMs: 120, streaksMs: 300, settleMs: 140 } as const
export const JUMP_MS = JUMP.bloomMs + JUMP.streaksMs + JUMP.settleMs
/** Reduced motion: a 200 ms linear crossfade (the Motion board's last row). */
export const JUMP_CROSSFADE_MS = 200

export const easeJump = cubicBezier(0.3, 0.8, 0.2, 1)

/** Where the jump starts: the star's centre in the viewport, CSS px. */
export type JumpOrigin = { x: number; y: number }

/** What `navigate` carries from the map into the chapter. */
export type JumpState = { jump: JumpOrigin }

export function jumpOriginFrom(state: unknown): JumpOrigin | null {
  if (!state || typeof state !== 'object') return null
  const jump = (state as Partial<JumpState>).jump
  if (!jump || typeof jump !== 'object') return null
  const { x, y } = jump as Partial<JumpOrigin>
  return Number.isFinite(x) && Number.isFinite(y) ? { x: x as number, y: y as number } : null
}

export type JumpFrame = {
  /** The bloom's radius as a share of the viewport's diagonal. */
  bloom: number
  /** How bright the bloom is, 0-1. */
  bloomAlpha: number
  /** How far the streaks reach, as a share of the diagonal (their tail follows at 40%). */
  streak: number
  streakAlpha: number
  /** The sky over the chapter: 1 hides it, 0 shows it. */
  veil: number
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/** The jump at `elapsedMs`: bloom, then streaks, then the veil settles away. */
export function jumpFrameAt(elapsedMs: number): JumpFrame {
  const t = Math.max(0, elapsedMs)
  const bloomT = easeJump(clamp(t / JUMP.bloomMs))
  const streakT = easeJump(clamp((t - JUMP.bloomMs) / JUMP.streaksMs))
  const settleT = easeJump(clamp((t - JUMP.bloomMs - JUMP.streaksMs) / JUMP.settleMs))
  return {
    bloom: 0.02 + 0.1 * bloomT,
    bloomAlpha: bloomT * (1 - streakT * 0.6) * (1 - settleT),
    streak: streakT,
    streakAlpha: (t < JUMP.bloomMs ? 0 : 1 - streakT * 0.3) * (1 - settleT),
    veil: 1 - settleT,
  }
}

/** Streak directions, spread evenly round the star with a fixed jitter so every jump looks the same. */
export const STREAKS = Array.from({ length: 56 }, (_, index) => {
  const jitter = Math.sin(index * 12.9898) * 0.5
  return { angle: ((index + jitter) / 56) * Math.PI * 2, reach: 0.55 + ((index * 37) % 45) / 100 }
})

export type JumpColors = { sky: string; lit: string; core: string }

/** Draw one frame of the jump on a 2D context sized `width` x `height` CSS px. */
export function drawJumpFrame(
  context: CanvasRenderingContext2D,
  frame: JumpFrame,
  origin: JumpOrigin,
  size: { width: number; height: number },
  colors: JumpColors,
) {
  const { width, height } = size
  const diagonal = Math.hypot(width, height)
  context.clearRect(0, 0, width, height)

  if (frame.veil > 0) {
    context.globalAlpha = frame.veil
    context.fillStyle = colors.sky
    context.fillRect(0, 0, width, height)
  }

  if (frame.streakAlpha > 0 && frame.streak > 0) {
    context.globalAlpha = frame.streakAlpha
    context.strokeStyle = colors.lit
    context.lineCap = 'round'
    for (const streak of STREAKS) {
      const head = frame.streak * streak.reach * diagonal
      const tail = head * 0.4
      const cos = Math.cos(streak.angle)
      const sin = Math.sin(streak.angle)
      context.lineWidth = 1 + streak.reach
      context.beginPath()
      context.moveTo(origin.x + cos * tail, origin.y + sin * tail)
      context.lineTo(origin.x + cos * head, origin.y + sin * head)
      context.stroke()
    }
  }

  if (frame.bloomAlpha > 0) {
    const radius = frame.bloom * diagonal
    const glow = context.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, radius)
    glow.addColorStop(0, colors.core)
    glow.addColorStop(0.35, colors.lit)
    glow.addColorStop(1, 'rgba(242, 197, 114, 0)')
    context.globalAlpha = frame.bloomAlpha
    context.fillStyle = glow
    context.beginPath()
    context.arc(origin.x, origin.y, radius, 0, Math.PI * 2)
    context.fill()
  }
  context.globalAlpha = 1
}
