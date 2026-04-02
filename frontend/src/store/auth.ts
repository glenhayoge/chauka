import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  userId: number | null
  username: string | null
  isStaff: boolean
  /** The user's effective role on the current logframe (from bootstrap). */
  currentRole: 'admin' | 'lead' | 'collector' | 'viewer' | null
  login: (token: string, userId: number, username: string, isStaff: boolean) => void
  logout: () => void
  setCurrentRole: (role: 'admin' | 'lead' | 'collector' | 'viewer' | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      username: null,
      isStaff: false,
      currentRole: null,
      login: (token, userId, username, isStaff) =>
        set({ token, userId, username, isStaff }),
      logout: () => set({ token: null, userId: null, username: null, isStaff: false, currentRole: null }),
      setCurrentRole: (role) => set({ currentRole: role }),
    }),
    { name: 'kashana-auth' }
  )
)
