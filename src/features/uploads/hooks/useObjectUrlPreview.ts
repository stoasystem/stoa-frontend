import { useCallback, useEffect, useRef } from 'react'
import { isPreviewableImage } from '@/features/uploads/utils/fileType'

export function useObjectUrlPreview() {
  const previewUrlsRef = useRef<Set<string>>(new Set())

  const createPreviewUrl = useCallback((file: File) => {
    if (!isPreviewableImage(file.type)) return undefined
    const previewUrl = URL.createObjectURL(file)
    previewUrlsRef.current.add(previewUrl)
    return previewUrl
  }, [])

  const revokePreviewUrl = useCallback((previewUrl?: string) => {
    if (!previewUrl || !previewUrlsRef.current.has(previewUrl)) return
    URL.revokeObjectURL(previewUrl)
    previewUrlsRef.current.delete(previewUrl)
  }, [])

  const revokeAllPreviewUrls = useCallback(() => {
    previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    previewUrlsRef.current.clear()
  }, [])

  useEffect(() => revokeAllPreviewUrls, [revokeAllPreviewUrls])

  return {
    createPreviewUrl,
    revokePreviewUrl,
    revokeAllPreviewUrls,
  }
}
