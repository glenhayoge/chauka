import { create } from 'zustand'
import type { BootstrapData } from '../api/types'

interface LogframeState {
  data: BootstrapData | null
  setData: (data: BootstrapData) => void
  clear: () => void
}

export const useLogframeStore = create<LogframeState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  clear: () => set({ data: null }),
}))
