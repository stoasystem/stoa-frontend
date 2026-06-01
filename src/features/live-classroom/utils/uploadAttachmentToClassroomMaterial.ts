import type { UploadAttachment } from '@/features/uploads/types/uploads'
import type { ClassroomMaterial } from '@/features/live-classroom/types/liveClassroom'

export function uploadAttachmentToClassroomMaterial(attachment: UploadAttachment): ClassroomMaterial {
  return {
    id: attachment.id,
    title: attachment.fileName,
    type: attachment.kind === 'image' ? 'image' : attachment.kind === 'pdf' ? 'pdf' : 'document',
    url: attachment.uploadedUrl,
    previewUrl: attachment.previewUrl,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    uploadedByRole: 'student',
    createdAt: attachment.createdAt,
  }
}
