import { demoVisibility } from '@/lib/demoVisibility'
import { apiBaseUrl } from '@/lib/env'

export function InternalDebugPanel() {
  if (!demoVisibility.showInternalDebug) return null

  return (
    <aside className="fixed right-4 bottom-20 z-50 max-w-xs rounded-md border bg-background p-3 text-xs text-muted-foreground shadow-lg">
      <p className="font-medium text-foreground">Internal debug</p>
      <dl className="mt-2 space-y-1">
        <div className="flex justify-between gap-3">
          <dt>App env</dt>
          <dd>{demoVisibility.appEnv}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>API mode</dt>
          <dd>{demoVisibility.apiMode}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>API base</dt>
          <dd className="truncate">{apiBaseUrl}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Demo accounts</dt>
          <dd>{demoVisibility.showDemoAccounts ? 'on' : 'off'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Checkout preview</dt>
          <dd>{demoVisibility.showCheckoutPreview ? 'on' : 'off'}</dd>
        </div>
      </dl>
    </aside>
  )
}
