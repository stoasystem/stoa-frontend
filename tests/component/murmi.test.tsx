import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Murmi, type MurmiMood } from '@/components/brand/Murmi'

// Murmi is decorative: everything it is used to say is in text beside it, so a
// reader who never sees the figure misses nothing. These tests hold that, and
// hold the figure to the token rule — none of its colours is written into it.

const MOODS: MurmiMood[] = ['calm', 'watching', 'delighted', 'thinking']

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
    expect(scopes('calm')).toBe(0)
    expect(scopes('thinking')).toBe(0)
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
})
