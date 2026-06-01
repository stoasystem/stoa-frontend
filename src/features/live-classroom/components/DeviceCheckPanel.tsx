import { Camera, Mic, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClassroomDeviceState } from '@/features/live-classroom/types/liveClassroom'

type DeviceCheckPanelProps = {
  deviceState: ClassroomDeviceState
  onToggleCamera: () => void
  onToggleMicrophone: () => void
}

export function DeviceCheckPanel({
  deviceState,
  onToggleCamera,
  onToggleMicrophone,
}: DeviceCheckPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <p className="brand-section-kicker">Before you join</p>
      <div className="mt-4 grid gap-3">
        <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium">Camera</p>
                <p className="text-sm text-muted-foreground">
                  {deviceState.camera === 'on' ? 'Camera mock preview on' : 'Camera off'}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={onToggleCamera}>
              {deviceState.camera === 'on' ? 'Camera off' : 'Camera on'}
            </Button>
          </div>
        </div>
        <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Mic className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium">Microphone</p>
                <p className="text-sm text-muted-foreground">
                  {deviceState.microphone === 'muted' ? 'Muted' : 'Unmuted'}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={onToggleMicrophone}>
              {deviceState.microphone === 'muted' ? 'Unmute' : 'Mute'}
            </Button>
          </div>
        </div>
        <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-4">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium">Speaker</p>
              <p className="text-sm text-muted-foreground">Sound test available in the future provider integration.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
