import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/layouts/AppLayout'

export function ForbiddenPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Forbidden</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Your current role does not have permission to access this page.
        </p>
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </AppLayout>
  )
}
