import { type FormEvent, useState } from 'react'
import { Send, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type ChatInputProps = {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = value.trim()
    if (!trimmed || disabled) return

    onSendMessage(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-3xl gap-3">
        <Button type="button" variant="outline" size="icon" aria-label="Upload file">
          <Upload className="h-4 w-4" />
        </Button>
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask a homework question..."
          className="min-h-12 resize-none"
          disabled={disabled}
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={disabled}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
