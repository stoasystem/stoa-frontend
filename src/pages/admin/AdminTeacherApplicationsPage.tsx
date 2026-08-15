import { useState } from 'react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  useReissueTeacherInvitationMutation,
  useReviewTeacherApplicationMutation,
  useTeacherApplicationDetailQuery,
  useTeacherApplicationsQuery,
} from '@/hooks/teacher/useTeacherApplication'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { toUserFacingError } from '@/lib/userFacingText'
import type { TeacherApplicationListItem, TeacherReviewState } from '@/services/teacher/teacherApplicationApi'

const states: TeacherReviewState[] = ['pending_review', 'approved', 'rejected']

export function AdminTeacherApplicationsPage() {
  const [reviewState, setReviewState] = useState<TeacherReviewState>('pending_review')
  const [selected, setSelected] = useState<TeacherApplicationListItem | null>(null)
  const [reason, setReason] = useState('Reviewed against teacher onboarding criteria.')
  const [message, setMessage] = useState<string | null>(null)
  const listQuery = useTeacherApplicationsQuery(reviewState)
  const detailQuery = useTeacherApplicationDetailQuery(selected?.applicationId ?? null, selected?.version ?? null)
  const reviewMutation = useReviewTeacherApplicationMutation()
  const reissueMutation = useReissueTeacherInvitationMutation()
  const rows = listQuery.data?.items ?? []
  const detail = detailQuery.data

  function decide(decision: 'approved' | 'rejected') {
    if (!selected) return
    setMessage(null)
    reviewMutation.mutate(
      {
        applicationId: selected.applicationId,
        version: selected.version,
        decision,
        reason: reason.trim(),
      },
      {
        onSuccess: (result) => {
          if (decision === 'approved') {
            setMessage(
              result.invitationDelivered
                ? 'Approved. Invitation email was sent.'
                : 'Approved, but the invitation email was not delivered. Use resend.',
            )
          } else {
            setMessage('Application rejected.')
          }
        },
        onError: (error) => setMessage(toUserFacingError(error, 'Review failed.')),
      },
    )
  }

  function resend() {
    if (!selected) return
    setMessage(null)
    reissueMutation.mutate(
      { applicationId: selected.applicationId, version: selected.version },
      {
        onSuccess: (result) => {
          setMessage(result.invitationDelivered ? 'Invitation resent.' : 'Invitation created, but email was not delivered.')
        },
        onError: (error) => setMessage(toUserFacingError(error, 'Could not resend the invitation.')),
      },
    )
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Teacher onboarding"
          title="Teacher applications"
          description="Review applications, approve to send an invitation, or reject with a reason."
          actions={<Badge variant="secondary">{listQuery.data?.count ?? 0} in this queue</Badge>}
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {states.map((state) => (
            <Button
              key={state}
              type="button"
              size="sm"
              variant={reviewState === state ? 'default' : 'outline'}
              onClick={() => {
                setReviewState(state)
                setSelected(null)
                setMessage(null)
              }}
            >
              {state.replace('_', ' ')}
            </Button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {listQuery.isError && (
                <p className="text-sm text-destructive">
                  {toUserFacingError(listQuery.error, 'Could not load applications. Reviewer access is required.')}
                </p>
              )}
              {rows.length === 0 && !listQuery.isLoading && (
                <p className="text-sm text-muted-foreground">No applications in this state.</p>
              )}
              {rows.map((row) => (
                <button
                  key={`${row.applicationId}-${row.version}`}
                  type="button"
                  className="flex w-full flex-col rounded-lg border bg-background/70 p-3 text-left hover:border-primary/40"
                  onClick={() => setSelected(row)}
                >
                  <span className="font-medium text-foreground">{row.fullName || row.applicationId}</span>
                  <span className="text-sm text-muted-foreground">{row.verifiedEmail}</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {(row.subjects ?? []).join(', ') || 'No subjects'} · v{row.version}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!selected && <p className="text-muted-foreground">Select an application to review.</p>}
              {selected && (
                <>
                  <p><span className="font-medium">Name:</span> {detail?.fullName || selected.fullName}</p>
                  <p><span className="font-medium">Email:</span> {selected.verifiedEmail}</p>
                  <p><span className="font-medium">Subjects:</span> {(detail?.subjects || selected.subjects || []).join(', ')}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{detail?.statement || 'Loading statement…'}</p>
                  <Textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-24" />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={reviewMutation.isPending || !reason.trim()}
                      onClick={() => decide('approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={reviewMutation.isPending || !reason.trim()}
                      onClick={() => decide('rejected')}
                    >
                      Reject
                    </Button>
                    {reviewState === 'approved' && (
                      <Button type="button" variant="secondary" disabled={reissueMutation.isPending} onClick={resend}>
                        Resend invitation
                      </Button>
                    )}
                  </div>
                </>
              )}
              {message && <p className="text-muted-foreground">{message}</p>}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  )
}
