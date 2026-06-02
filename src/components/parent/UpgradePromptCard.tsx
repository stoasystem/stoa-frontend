import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function UpgradePromptCard({ source }: { source: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Keep weekly insight active</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Upgrade after pilot to keep parent reports, learning history, and tutor support
          signals available for your family.
        </p>
        <Button asChild>
          <Link
            to="/pricing"
            onClick={() => trackEvent('parent_upgrade_cta_clicked', { source })}
          >
            Compare family plans
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
