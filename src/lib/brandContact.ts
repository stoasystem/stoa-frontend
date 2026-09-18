export const stoaContactInfo = {
  email: 'info@stoaedu.ch',
  phone: '+41 78 332 37 96',
  phoneHref: 'tel:+41783323796',
  locations: 'Zürich · Schindellegi (SZ) · Würenlos (AG)',
  homepageUrl: 'https://stoaedu.ch',
} as const

// 统一生成带收件人的邮件链接，避免页面里散落空 mailto
export function buildContactMailtoHref(subject?: string) {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : ''
  return `mailto:${stoaContactInfo.email}${query}`
}
