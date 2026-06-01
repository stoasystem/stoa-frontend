import { Camera, CameraOff, DoorOpen, FileUp, MessageCircle, Mic, MicOff, PenTool, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClassroomDeviceState, ClassroomSidePanelTab } from '@/features/live-classroom/types/liveClassroom'

export function ClassroomControlBar({
  deviceState,
  tutorMode = false,
  onToggleMicrophone,
  onToggleCamera,
  onToggleWhiteboard,
  onPanelChange,
  onLeave,
}: {
  deviceState: ClassroomDeviceState
  tutorMode?: boolean
  onToggleMicrophone: () => void
  onToggleCamera: () => void
  onToggleWhiteboard: () => void
  onPanelChange: (panel: ClassroomSidePanelTab) => void
  onLeave: () => void
}) {
  return (
    <div className="sticky bottom-0 z-10 border-t bg-background/95 px-3 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onToggleMicrophone}>
          {deviceState.microphone === 'muted' ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
          {deviceState.microphone === 'muted' ? 'Unmute' : 'Mute'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onToggleCamera}>
          {deviceState.camera === 'on' ? <CameraOff className="h-4 w-4" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
          {deviceState.camera === 'on' ? 'Stop Video' : 'Start Video'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onPanelChange('materials')}>
          <FileUp className="h-4 w-4" aria-hidden="true" />
          Share Material
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onToggleWhiteboard}>
          <PenTool className="h-4 w-4" aria-hidden="true" />
          Whiteboard
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onPanelChange('chat')}>
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Chat
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onPanelChange('participants')}>
          <Users className="h-4 w-4" aria-hidden="true" />
          Participants
        </Button>
        <Button type="button" variant={tutorMode ? 'destructive' : 'outline'} size="sm" onClick={onLeave}>
          <DoorOpen className="h-4 w-4" aria-hidden="true" />
          {tutorMode ? 'End Session' : 'Leave'}
        </Button>
      </div>
    </div>
  )
}
