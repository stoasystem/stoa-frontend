import { FormEvent, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSubmitSupportRequestMutation } from '@/hooks/support/useSubmitSupportRequestMutation'
import { useAuthStore } from '@/store/authStore'
import type {
  SupportRequestCategory,
  SupportRequestSeverity,
} from '@/services/support/supportApi'

const categories: Array<{ value: SupportRequestCategory; label: string }> = [
  { value: 'account_access', label: 'Account access' },
  { value: 'bug', label: 'Bug or broken page' },
  { value: 'teacher_help_question', label: 'Teacher-help question' },
  { value: 'parent_report', label: 'Parent report' },
  { value: 'pilot_feedback', label: 'Pilot feedback' },
  { value: 'other', label: 'Other' },
]

const severities: Array<{ value: SupportRequestSeverity; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function SupportRequestForm() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const submitSupportRequest = useSubmitSupportRequestMutation()
  const [category, setCategory] = useState<SupportRequestCategory>('bug')
  const [severity, setSeverity] = useState<SupportRequestSeverity>('normal')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState(user?.email ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitSupportRequest.isPending) return
    const trimmedSubject = subject.trim()
    const trimmedMessage = message.trim()
    const trimmedContactEmail = contactEmail.trim()

    if (!trimmedSubject || !trimmedMessage) {
      setError('Subject and message are required.')
      return
    }

    setError(null)
    submitSupportRequest.mutate(
      {
        category,
        severity,
        subject: trimmedSubject,
        message: trimmedMessage,
        contactEmail: trimmedContactEmail || undefined,
        page: location.pathname,
        userRole: user?.role,
        createdAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setCategory('bug')
          setSeverity('normal')
          setSubject('')
          setMessage('')
          setContactEmail(user?.email ?? '')
        },
      },
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="support-category">Category</Label>
          <select
            id="support-category"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={category}
            onChange={(event) => setCategory(event.target.value as SupportRequestCategory)}
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-severity">Severity</Label>
          <select
            id="support-severity"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as SupportRequestSeverity)}
          >
            {severities.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-email">Contact email</Label>
        <Input
          id="support-email"
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-subject">Subject</Label>
        <Input
          id="support-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Briefly describe the issue"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-message">Message</Label>
        <Textarea
          id="support-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What happened, who was affected, and what did you expect?"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Button type="submit" disabled={submitSupportRequest.isPending}>
        {submitSupportRequest.isPending ? 'Sending...' : 'Send support request'}
      </Button>
      {submitSupportRequest.isError && (
        <p className="text-sm text-destructive">We could not send your support request right now. Please try again.</p>
      )}
    </form>
  )
}
