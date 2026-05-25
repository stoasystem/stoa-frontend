import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSupportTicketMutation } from '@/hooks/support/useCreateSupportTicketMutation'
import type { SupportTicketPriority } from '@/types/supportTicket'

export function SupportTicketForm() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState<SupportTicketPriority>('normal')
  const [contactEmail, setContactEmail] = useState('')
  const createMutation = useCreateSupportTicketMutation()

  return (
    <form
      className="space-y-4 rounded-lg border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        createMutation.mutate({ subject, message, category, priority, contactEmail })
        setSubject('')
        setMessage('')
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ticket-subject">Subject</Label>
          <Input id="ticket-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticket-email">Contact email</Label>
          <Input id="ticket-email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ticket-category">Category</Label>
          <select id="ticket-category" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="general">General</option>
            <option value="billing">Billing</option>
            <option value="parent_report">Parent report</option>
            <option value="file_upload">File upload</option>
            <option value="teacher_help">Teacher help</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticket-priority">Priority</Label>
          <select id="ticket-priority" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={priority} onChange={(event) => setPriority(event.target.value as SupportTicketPriority)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ticket-message">Message</Label>
        <Textarea id="ticket-message" value={message} onChange={(event) => setMessage(event.target.value)} required />
      </div>
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create ticket'}
      </Button>
    </form>
  )
}
