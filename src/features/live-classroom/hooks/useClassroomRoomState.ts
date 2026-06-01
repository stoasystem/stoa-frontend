import { useState } from 'react'
import type {
  ClassroomDeviceState,
  ClassroomSidePanelTab,
} from '@/features/live-classroom/types/liveClassroom'

export function useClassroomRoomState(initialPanel: ClassroomSidePanelTab = 'chat') {
  const [activePanel, setActivePanel] = useState<ClassroomSidePanelTab>(initialPanel)
  const [deviceState, setDeviceState] = useState<ClassroomDeviceState>({
    microphone: 'muted',
    camera: 'off',
    speaker: 'available',
  })
  const [whiteboardOpen, setWhiteboardOpen] = useState(true)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  function toggleMicrophone() {
    setDeviceState((current) => ({
      ...current,
      microphone: current.microphone === 'muted' ? 'unmuted' : 'muted',
    }))
  }

  function toggleCamera() {
    setDeviceState((current) => ({
      ...current,
      camera: current.camera === 'on' ? 'off' : 'on',
    }))
  }

  function toggleWhiteboard() {
    setWhiteboardOpen((current) => !current)
  }

  return {
    activePanel,
    deviceState,
    microphoneMuted: deviceState.microphone === 'muted',
    cameraEnabled: deviceState.camera === 'on',
    whiteboardOpen,
    leaveDialogOpen,
    setActivePanel,
    setLeaveDialogOpen,
    toggleMicrophone,
    toggleCamera,
    toggleWhiteboard,
  }
}
