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
    <div className="sticky bottom-0 z-10 border-t bg-background/95 px-3 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 overflow-x-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-w-10 px-2 sm:px-3"
          onClick={onToggleMicrophone}
          aria-label={deviceState.microphone === 'muted' ? 'Unmute microphone' : 'Mute microphone'}
          title={deviceState.microphone === 'muted' ? 'Unmute' : 'Mute'}
        >
          {deviceState.microphone === 'muted' ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">{deviceState.microphone === 'muted' ? 'Unmute' : 'Mute'}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-w-10 px-2 sm:px-3"
          onClick={onToggleCamera}
          aria-label={deviceState.camera === 'on' ? 'Stop video' : 'Start video'}
          title={deviceState.camera === 'on' ? 'Stop Video' : 'Start Video'}
        >
          {deviceState.camera === 'on' ? <CameraOff className="h-4 w-4" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">{deviceState.camera === 'on' ? 'Stop Video' : 'Start Video'}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-w-10 px-2 sm:px-3"
          onClick={() => onPanelChange('materials')}
          aria-label="Open classroom materials"
          title="Materials"
        >
          <FileUp className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Materials</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-w-10 px-2 sm:px-3"
          onClick={onToggleWhiteboard}
          aria-label="Toggle whiteboard"
          title="Whiteboard"
        >
          <PenTool className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Board</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-w-10 px-2 sm:px-3"
          onClick={() => onPanelChange('chat')}
          aria-label="Open classroom chat"
          title="Chat"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Chat</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-w-10 px-2 sm:px-3"
          onClick={() => onPanelChange('participants')}
          aria-label="Open participants"
          title="Participants"
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">People</span>
        </Button>
        <Button
          type="button"
          variant={tutorMode ? 'destructive' : 'outline'}
          size="sm"
          className="h-10 min-w-10 px-2 sm:px-3"
          onClick={onLeave}
          aria-label={tutorMode ? 'End session' : 'Leave classroom'}
          title={tutorMode ? 'End Session' : 'Leave'}
        >
          <DoorOpen className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{tutorMode ? 'End Session' : 'Leave'}</span>
        </Button>
      </div>
    </div>
  )
}
