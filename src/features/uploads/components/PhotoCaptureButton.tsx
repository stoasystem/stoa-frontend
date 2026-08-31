import { Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UploadButton } from '@/features/uploads/components/UploadButton'

type PhotoCaptureButtonProps = {
  label?: string
  disabled?: boolean
  variant?: React.ComponentProps<typeof UploadButton>['variant']
  size?: React.ComponentProps<typeof UploadButton>['size']
  iconOnly?: boolean
  onPhotoSelected: (file: File) => void
}

export function PhotoCaptureButton({
  label,
  disabled = false,
  variant = 'outline',
  size,
  iconOnly = false,
  onPhotoSelected,
}: PhotoCaptureButtonProps) {
  const { t } = useTranslation('uploads')
  const resolvedLabel = label ?? t('actions.takePhoto', 'Take Photo')

  return (
    <UploadButton
      label={resolvedLabel}
      accept="image/*"
      capture="environment"
      multiple={false}
      disabled={disabled}
      variant={variant}
      size={size}
      iconOnly={iconOnly}
      icon={Camera}
      onFilesSelected={(files) => {
        const file = files[0]
        if (file) onPhotoSelected(file)
      }}
    />
  )
}
