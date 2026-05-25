import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminAnalyticsOverview } from '@/types/adminAnalytics'

const labels: Record<keyof AdminAnalyticsOverview, string> = {
  activeUsers: 'Active users',
  weeklyActiveStudents: 'Weekly active students',
  newRegistrations: 'New registrations',
  messagesSent: 'Messages sent',
  filesUploaded: 'Files uploaded',
  teacherHelpRequests: 'Teacher help requests',
  parentReportViews: 'Parent report views',
  checkoutStarted: 'Checkout started',
  checkoutCompleted: 'Checkout completed',
  cancelledSubscriptions: 'Cancelled subscriptions',
}

export function AdminAnalyticsCards({ overview }: { overview: AdminAnalyticsOverview }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {(Object.keys(labels) as Array<keyof AdminAnalyticsOverview>).map((key) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{labels[key]}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{overview[key]}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
