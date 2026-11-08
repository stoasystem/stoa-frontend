import { describe, expect, it } from 'vitest'
import { answerStyleMurmiMood } from '@/components/brand/answerStyleMurmi'
import { MURMI_MOODS } from '@/components/brand/Murmi'

// Which Murmi stands on each answer style's card (#597, stoa-backend#314).
describe('answerStyleMurmiMood', () => {
  it('gives each known style its own pose', () => {
    expect(answerStyleMurmiMood('standard')).toBe('calm')
    expect(answerStyleMurmiMood('concise')).toBe('steps')
    expect(answerStyleMurmiMood('encouraging')).toBe('offering')
    expect(answerStyleMurmiMood('vivid')).toBe('storytelling')
  })

  it('falls back to the quiet default with no style, or one it has never heard of', () => {
    for (const code of [null, undefined, '', 'socratic', 'Concise', 'constructor', 'toString', '__proto__']) {
      expect(answerStyleMurmiMood(code), String(code)).toBe('calm')
    }
  })

  it('only ever names a mood Murmi can draw', () => {
    for (const code of ['standard', 'concise', 'encouraging', 'vivid', 'later']) {
      expect(MURMI_MOODS).toContain(answerStyleMurmiMood(code))
    }
  })
})
