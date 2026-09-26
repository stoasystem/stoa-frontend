import { describe, expect, it } from 'vitest'
import { conversationGrade } from '@/lib/conversationGrade'

describe('conversationGrade', () => {
  it('keeps a profile grade, trimmed', () => {
    expect(conversationGrade(' Grade 6 ')).toBe('Grade 6')
  })

  it.each([undefined, null, '', '   '])('is empty for %j', (grade) => {
    expect(conversationGrade(grade)).toBe('')
  })
})
