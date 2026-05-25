import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSubmitPartnershipInterestMutation } from '@/hooks/partnership/useSubmitPartnershipInterestMutation'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { PartnershipInterestPayload } from '@/types/partnership'

export function PartnershipInterestForm() {
  const [payload, setPayload] = useState<PartnershipInterestPayload>({
    organizationName: 'Zurich Learning Center',
    organizationType: 'tutoring_center',
    studentCount: 120,
    subjects: ['Mathematics', 'Physics'],
    contactName: 'Michael Keller',
    contactEmail: 'michael@example.com',
    message: 'We are interested in a pilot.',
  })
  const mutation = useSubmitPartnershipInterestMutation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Submit pilot interest</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate(payload, {
              onSuccess: (response) => {
                trackEvent('partnership_interest_submitted', {
                  organizationType: payload.organizationType,
                  studentCount: payload.studentCount,
                })
                toast.success(`Interest submitted: ${response.interestId}`)
              },
            })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization name</Label>
            <Input
              id="organizationName"
              value={payload.organizationName}
              onChange={(event) => setPayload({ ...payload, organizationName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationType">Organization type</Label>
            <select
              id="organizationType"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={payload.organizationType}
              onChange={(event) => {
                setPayload({
                  ...payload,
                  organizationType: event.target.value as PartnershipInterestPayload['organizationType'],
                })
              }}
            >
              <option value="tutoring_center">Tutoring center</option>
              <option value="school">School</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentCount">Student count</Label>
            <Input
              id="studentCount"
              type="number"
              value={payload.studentCount}
              onChange={(event) => setPayload({ ...payload, studentCount: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjects">Subjects</Label>
            <Input
              id="subjects"
              value={payload.subjects.join(', ')}
              onChange={(event) => {
                setPayload({
                  ...payload,
                  subjects: event.target.value.split(',').map((subject) => subject.trim()).filter(Boolean),
                })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input
              id="contactName"
              value={payload.contactName}
              onChange={(event) => setPayload({ ...payload, contactName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={payload.contactEmail}
              onChange={(event) => setPayload({ ...payload, contactEmail: event.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={payload.message}
              onChange={(event) => setPayload({ ...payload, message: event.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit interest'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
