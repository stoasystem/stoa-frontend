import { CameraOff, Mic, MicOff } from 'lucide-react'
import type { ClassroomParticipant } from '@/features/live-classroom/types/liveClassroom'

export function ClassroomVideoTile({ participant }: { participant: ClassroomParticipant }) {
  return (
    <div className="flex min-h-44 flex-col justify-between rounded-lg border bg-[hsl(var(--platform-surface-app))] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{participant.displayName}</p>
          <p className="text-sm capitalize text-muted-foreground">{participant.role.replace('_', ' ')}</p>
        </div>
        <span className="rounded-full border bg-background px-2 py-1 text-xs">
          {participant.connectionStatus}
        </span>
      </div>
      <div className="grid flex-1 place-items-center py-6 text-center">
        {participant.cameraStatus === 'on' ? (
          <div>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              {participant.displayName.slice(0, 1)}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Mock video placeholder</p>
          </div>
        ) : (
          <div>
            <CameraOff className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">Camera is off</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {participant.microphoneStatus === 'muted' ? (
          <MicOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Mic className="h-4 w-4" aria-hidden="true" />
        )}
        {participant.microphoneStatus === 'muted' ? 'Muted' : 'Unmuted'}
      </div>
    </div>
  )
}
