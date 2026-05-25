import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { ReferralSummary } from '@/types/referral'

export function InviteLinkCard({ referral }: { referral: ReferralSummary }) {
  async function copyInviteLink() {
    await navigator.clipboard.writeText(referral.inviteUrl)
    trackEvent('referral_link_copied', { code: referral.code })
    toast.success('Invite link copied')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your family invite link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/40 p-3 text-sm break-all">{referral.inviteUrl}</div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" className="gap-2" onClick={copyInviteLink}>
            <Copy className="h-4 w-4" />
            Copy invite link
          </Button>
          <span className="text-sm text-muted-foreground">
            {referral.successfulInvites} successful invites
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
