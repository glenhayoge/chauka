import { create } from 'zustand'
import type { Result } from '../api/types'

interface FilterState {
  dateFrom: string
  dateTo: string
  leadId: number | null
}

interface UIState {
  activeTab: 'overview' | 'design' | 'monitor'
  setActiveTab: (tab: 'overview' | 'design' | 'monitor') => void
  expandedResults: Set<number>
  toggleResult: (id: number) => void
  initExpandedResults: (results: Result[], openLevel: number) => void
  expandedActivities: Set<number>
  toggleActivity: (id: number) => void
  filters: FilterState
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  clearFilters: () => void
}

const defaultFilters: FilterState = { dateFrom: '', dateTo: '', leadId: null }

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
  expandedResults: new Set(),
  toggleResult: (id) =>
    set((s) => {
      const next = new Set(s.expandedResults)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { expandedResults: next }
    }),
  initExpandedResults: (results, openLevel) => {
    // Only initialize once (don't reset user's manual toggles)
    if (get().expandedResults.size > 0) return
    const expanded = new Set<number>()
    for (const r of results) {
      if (r.level !== null && r.level <= openLevel) {
        expanded.add(r.id)
      }
    }
    set({ expandedResults: expanded })
  },
  expandedActivities: new Set(),
  toggleActivity: (id) =>
    set((s) => {
      const next = new Set(s.expandedActivities)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { expandedActivities: next }
    }),
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  clearFilters: () => set({ filters: { ...defaultFilters } }),
}))
