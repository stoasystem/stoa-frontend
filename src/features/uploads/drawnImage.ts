import { useEffect, useState } from 'react'

/**
 * What the browser is asked to draw: the two types the backend takes as a
 * picture. An attachment's `mediaType` is what the upload claimed; this is what
 * came back, checked before it gets an address (#510). The teacher's view of a
 * student's picture and the student's view of a teacher's (#513) both read it.
 */
const DRAWN_TYPES = new Set(['image/png', 'image/jpeg'])

export function drawnType(blob: Blob) {
  return DRAWN_TYPES.has(blob.type.split(';')[0].trim().toLowerCase())
}

/** An address for the blob while it is on screen, released when it leaves. */
export function useObjectUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return undefined
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => {
      URL.revokeObjectURL(next)
      setUrl(undefined)
    }
  }, [blob])
  return url
}
