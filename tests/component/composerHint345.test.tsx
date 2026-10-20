/**
 * Pressing send on an empty field shows why nothing went out. The line was
 * mounted together with its words, and a live region that arrives already
 * filled is not announced, so a screen reader said nothing; the field did not
 * point at it either (#345).
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Composer } from '@/components/base/Composer'

function Harness() {
  const [value, setValue] = useState('')
  return (
    <>
      <p id="ask-note">Ask is open</p>
      <Composer value={value} onChange={setValue} onSubmit={vi.fn()} label="Ask" describedBy="ask-note" />
    </>
  )
}

describe("the composer's reason for not sending", () => {
  it('is a live region in place before the reason, and the field points at it', async () => {
    render(<Harness />)
    const field = screen.getByRole('textbox', { name: 'Ask' })
    const region = screen.getByRole('status')
    expect(region).toBeEmptyDOMElement()
    expect(field).toHaveAttribute('aria-describedby', 'ask-note')

    await userEvent.click(screen.getByRole('button', { name: 'composer.send' }))
    // The same node, now holding the words: that is what gets announced.
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('composer.sendBlocked.empty')
    expect(field.getAttribute('aria-describedby')?.split(' ')).toEqual(['ask-note', region.id])
    expect(field).toHaveAccessibleDescription('Ask is open composer.sendBlocked.empty')

    await userEvent.type(field, 'x')
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toBeEmptyDOMElement()
    expect(field).toHaveAttribute('aria-describedby', 'ask-note')
  })
})
