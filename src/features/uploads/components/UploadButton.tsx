import { useRef } from 'react'
import { Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getAcceptedUploadInputValue } from '@/features/uploads/utils/uploadLimits'

type UploadButtonProps = {
  label?: string
  accept?: string
  multiple?: boolean
  capture?: boolean | 'user' | 'environment'
  disabled?: boolean
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  iconOnly?: boolean
  onFilesSelected: (files: File[]) => void
}

export function UploadButton({
  label,
  accept = getAcceptedUploadInputValue(),
  multiple = true,
  capture,
  disabled = false,
  variant = 'outline',
  size,
  iconOnly = false,
  onFilesSelected,
}: UploadButtonProps) {
  const { t } = useTranslation('uploads')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const resolvedLabel = label ?? t('actions.attachFile', 'Attach file')
  const captureValue = capture === true ? 'environment' : capture || undefined

  return (
    <>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={accept}
        multiple={multiple}
        capture={captureValue}
        disabled={disabled}
        aria-label={resolvedLabel}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          if (files.length > 0) onFilesSelected(files)
        }}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        aria-label={resolvedLabel}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="h-4 w-4" aria-hidden="true" />
        {!iconOnly && <span>{resolvedLabel}</span>}
      </Button>
    </>
  )
}
