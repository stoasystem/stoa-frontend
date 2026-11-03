import { useEffect, useState } from 'react'

type Drawn = { path: string; modules: number }

/** The QR's modules as one SVG path, with the four-module margin the standard asks for. */
async function draw(value: string): Promise<Drawn> {
  // Loaded when a QR is first shown: Ask is on the star map, and only this needs it.
  const { encode } = await import('uqr')
  const { data, size } = encode(value, { ecc: 'M', border: 4 })
  let path = ''
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) path += `M${x} ${y}h1v1h-1z`
    }),
  )
  return { path, modules: size }
}

/**
 * A QR code (#514). Black on white whatever the theme: a phone's camera reads
 * dark modules on a light ground, and a QR drawn in a dark theme's colours is
 * one many cameras do not read. The white margin is part of the drawing, so it
 * scans on any background.
 */
export function QrCode({
  value,
  label,
  size,
  failed,
}: {
  value: string
  label: string
  size: number
  /** Said in its place when the encoder could not be loaded. */
  failed: string
}) {
  const [drawn, setDrawn] = useState<{ value: string; result: Drawn | 'failed' } | null>(null)
  useEffect(() => {
    let current = true
    draw(value).then(
      (result) => current && setDrawn({ value, result }),
      () => current && setDrawn({ value, result: 'failed' }),
    )
    return () => {
      current = false
    }
  }, [value])

  const result = drawn?.value === value ? drawn.result : null
  if (result === 'failed') {
    return (
      <p role="alert" className="m-0 shrink-0 text-[13px] text-red" style={{ width: size }}>
        {failed}
      </p>
    )
  }
  if (!result) return <div aria-hidden="true" className="shrink-0 rounded-[8px] bg-fill" style={{ width: size, height: size }} />
  return (
    <svg
      role="img"
      aria-label={label}
      data-qr
      viewBox={`0 0 ${result.modules} ${result.modules}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="shrink-0 rounded-[8px]"
    >
      <rect width={result.modules} height={result.modules} fill="#ffffff" />
      <path d={result.path} fill="#000000" />
    </svg>
  )
}
