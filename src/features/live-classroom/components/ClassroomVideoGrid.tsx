import { ClassroomVideoTile } from '@/features/live-classroom/components/ClassroomVideoTile'
import type { ClassroomParticipant } from '@/features/live-classroom/types/liveClassroom'

export function ClassroomVideoGrid({ participants }: { participants: ClassroomParticipant[] }) {
  return (
    <section aria-label="Classroom participants" className="grid gap-3 md:grid-cols-2">
      {participants.map((participant) => (
        <ClassroomVideoTile key={participant.id} participant={participant} />
      ))}
    </section>
  )
}
