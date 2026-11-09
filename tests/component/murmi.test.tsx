import { readFileSync } from 'node:fs'
import path from 'node:path'
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
  clapping: true,
  reading: true,
  sleeping: true,
  curious: true,
  calling: true,
  steps: true,
  offering: true,
  storytelling: true,
  hourglass: true,
  letter: true,
}

const MURMI_CSS = readFileSync(path.resolve(__dirname, '../../src/components/brand/murmi.css'), 'utf8')

/** Every `selector { … }` rule in murmi.css whose selector mentions `needle`, outside @keyframes. */
function rulesFor(needle: string) {
  const rules: { selector: string; body: string }[] = []
  const withoutKeyframes = MURMI_CSS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
  for (const match of withoutKeyframes.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim()
    if (selector.includes(needle)) rules.push({ selector, body: match[2] })
  }
  return rules
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
    // Clapping keeps them open: well done, not the big one (#592).
    for (const mood of ['waving', 'pointing', 'reading', 'curious', 'calling', 'clapping'] as const) expect(eyes(mood), mood).toBe(2)
    expect(eyes('cheering')).toBe(0)
    expect(eyes('sleeping')).toBe(0)
    // The answer styles (#597): concise and vivid look at you; encouraging smiles its eyes shut.
    expect(eyes('steps')).toBe(2)
    expect(eyes('storytelling')).toBe(2)
    expect(eyes('offering')).toBe(0)
    // The usage period (#616): attentive and friendly, eyes open.
    expect(eyes('hourglass')).toBe(2)
    expect(eyes('letter')).toBe(2)
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

  it('claps from the shoulders with its paws meeting at the chest, the marks in the mark colour (#592)', () => {
    const svg = render(<Murmi mood="clapping" size={72} />).container.querySelector('svg')!
    expect(svg.querySelectorAll('.murmi-clap')).toHaveLength(2)
    expect(svg.querySelector('.murmi-clap-l')).not.toBeNull()
    expect(svg.querySelector('.murmi-clap-r')).not.toBeNull()
    const marks = svg.querySelectorAll('.murmi-clap-mark')
    expect(marks).toHaveLength(2)
    for (const mark of marks) expect(mark.getAttribute('stroke')).toBe('var(--murmi-mark)')
    // Not cheering's confetti or bounce: the smaller moment.
    expect(svg.querySelector('.murmi-bounce')).toBeNull()
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

  describe('the answer-style poses (#597)', () => {
    const svg = (mood: MurmiMood, size: number | string = 56, animated = false) =>
      render(<Murmi mood={mood} size={size} animated={animated} />).container.querySelector('svg')!
    const scopeStroked = (node: Element) => node.querySelectorAll('circle[stroke="var(--murmi-scope)"]').length

    it('steps: round glasses and a slate of three step marks, the marks only at full detail', () => {
      const full = svg('steps', 56)
      expect(full).toHaveAttribute('data-murmi-detail', 'full')
      expect(scopeStroked(full)).toBe(2)
      const slate = full.querySelector('.murmi-tap')!
      expect(slate).not.toBeNull()
      expect(slate.querySelectorAll('path[stroke="var(--murmi-page)"]')).toHaveLength(1)
      expect(slate.querySelectorAll('circle[fill="var(--murmi-page)"]')).toHaveLength(2)
      // Still smiling: the concise one is focused, not cold.
      expect([...full.querySelectorAll('path')].some((p) => (p.getAttribute('d') ?? '').includes('q2.1 1.9 4.2 0.5'))).toBe(true)

      const simple = svg('steps', 32)
      expect(simple).toHaveAttribute('data-murmi-detail', 'simple')
      // The glasses and the slate stay; the marks and the rims' highlights go.
      expect(scopeStroked(simple)).toBe(2)
      expect(simple.querySelector('.murmi-tap')).not.toBeNull()
      expect(simple.querySelectorAll('[stroke="var(--murmi-page)"], [fill="var(--murmi-page)"]')).toHaveLength(0)
      expect(simple.querySelectorAll('[stroke="#fff"]')).toHaveLength(0)
    })

    it('offering: a star with its glow in both paws, warmer cheeks, sparkles only at full detail', () => {
      const full = svg('offering', 56)
      expect(full.querySelector('.murmi-glow')).not.toBeNull()
      // The star is outlined, so the bright glow colour holds on paper as well as on the sky.
      const star = full.querySelectorAll('path[fill="var(--murmi-glow)"]')
      expect(star).toHaveLength(1)
      expect(star[0].getAttribute('stroke')).toBe('var(--murmi-crown)')
      expect(full.querySelectorAll('path[fill="var(--lit, var(--star))"]')).toHaveLength(2)
      const blush = [...full.querySelectorAll('ellipse[fill="var(--murmi-blush)"]')].map((e) => Number(e.getAttribute('opacity')))
      expect(blush.filter((o) => o > 0.9)).toHaveLength(2)

      const simple = svg('offering', 32)
      expect(simple.querySelector('.murmi-glow')).not.toBeNull()
      expect(simple.querySelectorAll('path[fill="var(--murmi-glow)"]')).toHaveLength(1)
      expect(simple.querySelectorAll('path[fill="var(--lit, var(--star))"]')).toHaveLength(0)
    })

    it('storytelling: an apple, a ringed planet and a bulb; leaf and rays only at full detail', () => {
      const full = svg('storytelling', 56)
      expect(full.querySelector('[fill="var(--murmi-apple)"]')).not.toBeNull()
      expect(full.querySelector('[fill="var(--murmi-leaf)"]')).not.toBeNull()
      expect(full.querySelector('.murmi-bulb')).not.toBeNull()
      expect(full.querySelectorAll('[stroke="var(--murmi-mark)"]').length).toBe(3)

      const simple = svg('storytelling', 32)
      expect(simple.querySelector('[fill="var(--murmi-apple)"]')).not.toBeNull()
      expect(simple.querySelector('circle[fill="var(--murmi-scope)"]')).not.toBeNull()
      expect(simple.querySelector('.murmi-bulb')).not.toBeNull()
      expect(simple.querySelector('[fill="var(--murmi-leaf)"]')).toBeNull()
      // Ring behind and in front stay; the bulb's rays go.
      expect(simple.querySelectorAll('[stroke="var(--murmi-mark)"]').length).toBe(2)
    })

    it('each moves only when animated', () => {
      const parts = { steps: '.murmi-tap', offering: '.murmi-glow', storytelling: '.murmi-bulb' } as const
      for (const [mood, part] of Object.entries(parts) as [MurmiMood, string][]) {
        expect(svg(mood)).not.toHaveClass('murmi--animated')
        const moving = svg(mood, 56, true)
        expect(moving).toHaveClass('murmi--animated')
        expect(moving.querySelector(part)).toHaveClass('murmi-part')
      }
    })
  })

  describe('the usage period poses (#616)', () => {
    const svg = (mood: MurmiMood, size: number | string = 56, props: { animated?: boolean; entrance?: boolean } = {}) =>
      render(<Murmi mood={mood} size={size} {...props} />).container.querySelector('svg')!
    const smiles = (node: Element) =>
      [...node.querySelectorAll('path')].some((p) => (p.getAttribute('d') ?? '').includes('q2.1 1.9 4.2 0.5'))

    it('hourglass: a frame that turns, sand in both bulbs; posts, stream and glint only at full detail', () => {
      const full = svg('hourglass', 56)
      expect(full).toHaveAttribute('data-murmi-detail', 'full')
      const turn = full.querySelector('.murmi-turn')!
      expect(turn).not.toBeNull()
      expect(turn.querySelectorAll('[fill="var(--murmi-scope)"]')).toHaveLength(2) // the caps
      expect(turn.querySelector('[fill="var(--murmi-page)"]')).not.toBeNull() // the glass
      // The sand is its own group, not inside the turning frame.
      const sand = full.querySelector('.murmi-sand')!
      expect(turn.contains(sand)).toBe(false)
      expect(sand.querySelector('.murmi-sand-top')).toHaveAttribute('fill', 'var(--murmi-mark)')
      expect(sand.querySelector('.murmi-sand-bottom')).toHaveAttribute('fill', 'var(--murmi-mark)')
      expect(full.querySelector('.murmi-stream')).not.toBeNull()
      expect(full.querySelectorAll('[stroke="#fff"]').length).toBeGreaterThan(0)
      // Attentive, not worried: the usual smile, no worried brows.
      expect(smiles(full)).toBe(true)
      expect(full.querySelectorAll('path[stroke="var(--murmi-crown)"]')).toHaveLength(0)

      const simple = svg('hourglass', 32)
      expect(simple).toHaveAttribute('data-murmi-detail', 'simple')
      // The silhouette and both sands stay; the stream, the posts and the glints go.
      expect(simple.querySelector('.murmi-turn [fill="var(--murmi-page)"]')).not.toBeNull()
      expect(simple.querySelectorAll('.murmi-turn [fill="var(--murmi-scope)"]')).toHaveLength(2)
      expect(simple.querySelector('.murmi-sand-top')).not.toBeNull()
      expect(simple.querySelector('.murmi-sand-bottom')).not.toBeNull()
      expect(simple.querySelector('.murmi-stream')).toBeNull()
      expect(simple.querySelectorAll('.murmi-turn path[stroke="var(--murmi-scope)"][fill="none"]')).toHaveLength(0)
      expect(simple.querySelectorAll('[stroke="#fff"]')).toHaveLength(0)
    })

    it('letter: a sealed letter held out with the paws, flap and seal at every size, folds and glint at full', () => {
      const full = svg('letter', 56)
      expect(smiles(full)).toBe(true)
      const hands = full.querySelectorAll('.murmi-hand')
      // The letter and the paws under it lift together.
      expect(hands).toHaveLength(2)
      expect([...hands].some((hand) => hand.querySelector('[fill="var(--murmi-paw)"]'))).toBe(true)
      expect(full.querySelector('.murmi-hand path[fill="var(--murmi-page)"]')).toHaveAttribute('stroke', 'var(--murmi-crown)')
      expect(full.querySelector('.murmi-hand circle[fill="var(--murmi-apple)"]')).not.toBeNull()
      expect(full.querySelectorAll('.murmi-hand path[stroke="var(--murmi-crown)"][fill="none"]')).toHaveLength(2)
      expect(full.querySelector('.murmi-glint')).not.toBeNull()

      const simple = svg('letter', 32)
      expect(simple.querySelector('.murmi-hand path[fill="var(--murmi-page)"]')).not.toBeNull()
      expect(simple.querySelector('.murmi-hand circle[fill="var(--murmi-apple)"]')).not.toBeNull()
      // The flap stays, the lower folds and the glint go.
      expect(simple.querySelectorAll('.murmi-hand path[stroke="var(--murmi-crown)"][fill="none"]')).toHaveLength(1)
      expect(simple.querySelector('.murmi-glint')).toBeNull()
    })

    it('entrance: a class and an attribute, a rise group inside the mirror, only when asked', () => {
      for (const mood of MOODS) {
        const still = svg(mood, 40)
        expect(still).not.toHaveClass('murmi--entrance')
        expect(still.hasAttribute('data-murmi-entrance')).toBe(false)
        expect(still.querySelector('.murmi-rise')).toBeNull()

        const entering = svg(mood, 40, { entrance: true })
        expect(entering).toHaveClass('murmi--entrance')
        expect(entering).not.toHaveClass('murmi--animated')
        expect(entering.hasAttribute('data-murmi-entrance')).toBe(true)
        const mirror = entering.querySelector(':scope > g')!
        expect(mirror.querySelector(':scope > .murmi-rise')).not.toBeNull()
      }
      // Facing left still mirrors on the outer group, around the rise.
      const left = svg('letter', 40, { entrance: true })
      expect(left.querySelector(':scope > g > g')).toHaveClass('murmi-rise')
      const mirrored = render(<Murmi mood="letter" size={40} entrance facing="left" />).container.querySelector('svg')!
      expect(mirrored.querySelector(':scope > g')!.getAttribute('transform')).toBe('matrix(-1 0 0 1 76 0)')
    })

    it('entrance runs once: every entrance animation has an iteration count of 1 and fills both ways', () => {
      const animated = rulesFor('.murmi--entrance').filter((rule) => /animation\s*:/.test(rule.body) && !rule.body.includes('none'))
      // The rise, plus each one-shot part of both poses.
      for (const part of ['rise', 'turn', 'sand', 'sand-top', 'sand-bottom', 'stream', 'hand', 'glint']) {
        expect(animated.some((rule) => rule.selector.endsWith(`.murmi-${part}`)), part).toBe(true)
      }
      for (const rule of animated) {
        expect(rule.body, rule.selector).not.toMatch(/infinite/)
        expect(rule.body, rule.selector).toMatch(/\s1 both;/)
      }
    })

    it('holds still under reduced motion, in its resting pose, for the loop and the entrance alike', () => {
      const reduced = MURMI_CSS.slice(MURMI_CSS.indexOf('@media (prefers-reduced-motion: reduce)'))
      expect(reduced).toMatch(/\.murmi--animated \.murmi-part/)
      expect(reduced).toMatch(/\.murmi--entrance \.murmi-part/)
      expect(reduced).toMatch(/animation:\s*none/)
      // Every part that moves carries murmi-part, so the rule above reaches it.
      for (const mood of ['hourglass', 'letter'] as const) {
        const entering = svg(mood, 56, { entrance: true })
        for (const part of entering.querySelectorAll('[class*="murmi-"]')) {
          expect(part, part.getAttribute('class') ?? '').toHaveClass('murmi-part')
        }
      }
    })

    it('each moves when animated too, with a quiet loop', () => {
      expect(svg('hourglass', 56, { animated: true }).querySelector('.murmi-turn')).toHaveClass('murmi-part')
      expect(svg('letter', 56, { animated: true }).querySelector('.murmi-hand')).toHaveClass('murmi-part')
      for (const part of ['turn', 'sand-top', 'hand']) {
        expect(rulesFor(`.murmi--animated .murmi-${part}`).some((rule) => rule.body.includes('infinite')), part).toBe(true)
      }
    })
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
