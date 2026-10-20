import { trackEvent } from '@/services/analytics/analyticsClient'

export type UTMParams = {
  source?: string
  medium?: string
  campaign?: string
  content?: string
}

const UTM_STORAGE_KEY = 'stoa_utm'
const REFERRAL_STORAGE_KEY = 'stoa_referral_code'

function cleanParam(value: string | null) {
  return value?.trim().slice(0, 120) || undefined
}

export function captureAttributionFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const utm: UTMParams = {
    source: cleanParam(params.get('utm_source')),
    medium: cleanParam(params.get('utm_medium')),
    campaign: cleanParam(params.get('utm_campaign')),
    content: cleanParam(params.get('utm_content')),
  }
  const referralCode = cleanParam(params.get('ref'))
  const hasUTM = Object.values(utm).some(Boolean)

  if (hasUTM) {
    remember(UTM_STORAGE_KEY, JSON.stringify(utm))
    trackEvent('utm_captured', utm)
  }

  if (referralCode) {
    remember(REFERRAL_STORAGE_KEY, referralCode)
  }
}

// Runs before the app mounts, so a browser that blocks storage must not make
// it throw (#345). Attribution is best effort; losing it is fine.
function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked or full.
  }
}
