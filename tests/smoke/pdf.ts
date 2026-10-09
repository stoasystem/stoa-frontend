/**
 * The audit's malformed PDF (E08/E09, stoasystem/stoa-backend#6): one object
 * whose number is millions of digits long.
 *
 * Built byte for byte the way `_long_object_header` in the backend's
 * tests/test_pdf_validation_isolation.py builds it, at run time, so no 4 MiB
 * binary lives in the repository. `offline/fixtures.spec.ts` pins its size and
 * SHA-256 to what the Python produces.
 */
export function longObjectHeaderPdf(headerLength = 4 * 1024 * 1024): Buffer {
  const header = Buffer.from('%PDF-1.7\n', 'latin1')
  const obj = Buffer.concat([
    Buffer.alloc(headerLength, '9'),
    Buffer.from(' 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n', 'latin1'),
  ])
  const pages = Buffer.from('2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n', 'latin1')
  const offset = header.length + obj.length + pages.length
  const pad = (value: number) => String(value).padStart(10, '0')
  const xref = Buffer.from(
    `xref\n0 3\n0000000000 65535 f \n${pad(header.length)} 00000 n \n` +
      `${pad(header.length + obj.length)} 00000 n \n` +
      `trailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`,
    'latin1',
  )
  return Buffer.concat([header, obj, pages, xref])
}
