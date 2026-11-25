import { describe, expect, it } from 'vitest'
import { sanitizeAnalyticsPayload } from '@/services/analytics/analyticsClient'

describe('an analytics payload carries no identifier (card 134 audit)', () => {
  it('drops keys that name a person or a record, keeps the rest', () => {
    expect(
      sanitizeAnalyticsPayload({ userId: 'u-1', student_id: 's', id: 'x', childId: 'c', paid: true, role: 'parent' }),
    ).toEqual({ paid: true, role: 'parent' })
  })
})
