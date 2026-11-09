import { create } from 'zustand'

/*
 * Usage period banners closed in this visit (#616). The issue asks for a
 * banner that can be closed for now and is there again next time, so this is
 * memory only: a reload or the next sign-in shows it again. Each entry is the
 * account and what its banner said, so a different message shows again.
 */
type UsagePeriodBannerState = {
  dismissed: Readonly<Record<string, true>>
  dismiss: (key: string) => void
}

export const useUsagePeriodBannerStore = create<UsagePeriodBannerState>((set) => ({
  dismissed: {},
  dismiss: (key) => set((state) => ({ dismissed: { ...state.dismissed, [key]: true } })),
}))
