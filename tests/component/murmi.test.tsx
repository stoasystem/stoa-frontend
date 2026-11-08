import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Murmi, MURMI_MOODS, type MurmiMood } from '@/components/brand/Murmi'

// Murmi is decorative: everything it is used to say is in text beside it, so a
// reader who never sees the figure misses nothing. These tests hold that, and
// hold the figure to the token rule — none of its colours is written into it.

const MOODS: readonly MurmiMood[] = MURMI_MOODS

// Every name in the union is in the list: a mood added to the type and not to
// MURMI_MOODS would never be rendered by these tests or the gallery.
const EVERY_MOOD: Record<MurmiMood, true> = {
  calm: true,
  watching: true,
  delighted: true,
  thinking: true,
  waving: true,
  pointing: true,
  cheering: true,
  reading: true,
  sleeping: true,
  curious: true,
  calling: true,
}

describe('Murmi', () => {
  it('is hidden from the accessibility tree in every mood', () => {
    for (const mood of MOODS) {
      const { container } = render(<Murmi mood={mood} />)
      const svg = container.querySelector('svg')!

      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.getAttribute('focusable')).toBe('false')
      // Nothing inside may be reachable either.
      expect(svg.querySelector('title, [role="img"]')).toBeNull()
    }
  })

  it('takes every colour from a token', () => {
    for (const mood of MOODS) {
      const { container } = render(<Murmi mood={mood} />)

      const fills = [...container.querySelectorAll('[fill], [stroke]')].flatMap((node) => [
        node.getAttribute('fill'),
        node.getAttribute('stroke'),
      ])
      for (const value of fills) {
        if (!value || value === 'none' || value === '#fff') continue
        expect(value, `${mood}: a colour that is not a token: ${value}`).toMatch(/^var\(--/)
      }
    }
  })

  it('looks up from the telescope only when there is something to look at', () => {
    // At the telescope is "a lesson is waiting" and "it just lit". Calm and
    // thinking are the quiet moments; a telescope there would say nothing.
    const scopes = (mood: MurmiMood) => {
      const { container } = render(<Murmi mood={mood} />)
      return container.querySelectorAll('rect').length
    }

    expect(scopes('watching')).toBe(1)
    expect(scopes('delighted')).toBe(1)
    for (const mood of MOODS.filter((name) => name !== 'watching' && name !== 'delighted')) {
      expect(scopes(mood), mood).toBe(0)
    }
  })

  it('closes its eyes only in the one big moment', () => {
    const eyes = (mood: MurmiMood) => {
      const { container } = render(<Murmi mood={mood} />)
      return container.querySelectorAll('circle[r="3.1"]').length
    }

    expect(eyes('calm')).toBe(2)
    expect(eyes('watching')).toBe(2)
    expect(eyes('thinking')).toBe(2)
    expect(eyes('delighted')).toBe(0)
    // The new poses: closed only to celebrate or to sleep.
    for (const mood of ['waving', 'pointing', 'reading', 'curious', 'calling'] as const) expect(eyes(mood), mood).toBe(2)
    expect(eyes('cheering')).toBe(0)
    expect(eyes('sleeping')).toBe(0)
  })

  it('never frowns: a wrong answer is looking again, not disappointment', () => {
    const { container } = render(<Murmi mood="thinking" />)

    const mouths = [...container.querySelectorAll('path')].map((node) => node.getAttribute('d') ?? '')
    // A frown would curve the other way (a negative control for the shape).
    expect(mouths.some((d) => d.includes('q4 2'))).toBe(true)
  })

  it('is the size it is asked for', () => {
    const { container } = render(<Murmi size={40} />)
    const svg = container.querySelector('svg')!

    expect(svg.getAttribute('width')).toBe('40')
    expect(svg.getAttribute('height')).toBe('40')
  })

  it('lists every mood, and renders each with its name and hidden', () => {
    expect([...MOODS].sort()).toEqual(Object.keys(EVERY_MOOD).sort())
    for (const mood of MOODS) {
      const { container } = render(<Murmi mood={mood} />)
      const svg = container.querySelector('svg')!

      expect(svg.getAttribute('data-murmi')).toBe(mood)
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('stands still unless asked to move', () => {
    for (const mood of MOODS) {
      const still = render(<Murmi mood={mood} />).container.querySelector('svg')!
      expect(still).not.toHaveClass('murmi--animated')
      expect(still.hasAttribute('data-murmi-animated')).toBe(false)

      const moving = render(<Murmi mood={mood} animated />).container.querySelector('svg')!
      expect(moving).toHaveClass('murmi--animated')
      expect(moving.hasAttribute('data-murmi-animated')).toBe(true)
      // Something in every pose has a part to move.
      expect(moving.querySelector('.murmi-part')).not.toBeNull()
    }
  })

  it('turns round on an inner group, keeping its box, its name and its size (#592)', () => {
    for (const mood of MOODS) {
      const right = render(<Murmi mood={mood} size={32} />).container.querySelector('svg')!
      expect(right).toHaveAttribute('data-murmi-facing', 'right')
      expect(right.querySelector(':scope > g')!.hasAttribute('transform')).toBe(false)

      const left = render(<Murmi mood={mood} size={32} facing="left" />).container.querySelector('svg')!
      expect(left).toHaveAttribute('data-murmi-facing', 'left')
      expect(left).toHaveAttribute('data-murmi', mood)
      expect(left).toHaveAttribute('aria-hidden', 'true')
      expect(left.getAttribute('viewBox')).toBe(right.getAttribute('viewBox'))
      expect(left.getAttribute('width')).toBe('32')
      // A mirror across the 76-wide box, on a group of its own: the pose's CSS transforms stay inside it.
      const mirror = left.querySelector(':scope > g')!
      expect(mirror.getAttribute('transform')).toBe('matrix(-1 0 0 1 76 0)')
      expect(mirror.classList.contains('murmi-part')).toBe(false)
    }
  })

  it('leaves the hair-thin parts out below 40px, and at the inline token', () => {
    const teeth = (size: number | string) =>
      render(<Murmi mood="calm" size={size} />).container.querySelectorAll('path[fill="var(--murmi-tooth)"]').length

    expect(teeth(72)).toBe(2)
    expect(teeth(56)).toBe(2)
    expect(teeth('var(--murmi-state)')).toBe(2)
    expect(teeth(28)).toBe(0)
    expect(teeth(22)).toBe(0)
    expect(teeth('var(--murmi-inline)')).toBe(0)
  })
})
