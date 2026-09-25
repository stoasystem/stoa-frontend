import { describe, expect, it } from 'vitest'
import { commandMessageIds } from '@/services/chat/commandMessageIds'

// Computed by the backend's own derivation (Python `uuid.uuid5`).
describe('the ids of a message', () => {
  it('are the ones the backend gives it', async () => {
    await expect(commandMessageIds('c1', 'student-1')).resolves.toEqual({
      studentMessageId: '5e396bb4-3a3f-58f6-a8a9-2ab05e7fae6c',
      assistantMessageId: '6c1f6155-d2a9-5200-9afd-6c58fbc45079',
    })
  })

  it('encode the name as UTF-8, as the backend does', async () => {
    await expect(commandMessageIds('3f2b-Konvo', 'Schlüssel.~_-9')).resolves.toEqual({
      studentMessageId: '4a3b87e1-4e1d-52c1-a618-ef4a3b9330d0',
      assistantMessageId: '375ca56e-7a0d-5563-9952-8a051123810b',
    })
  })
})
