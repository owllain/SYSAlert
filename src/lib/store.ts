import { create } from 'zustand'

export type NavTab = 'dashboard' | 'entities' | 'users' | 'audit-log' | 'my-alerts' | 'latest-alerts' | 'alert-history'

interface CurrentUser {
  id: string
  name: string
  username: string
  email: string
  role: string
  financialEntityId: string
  financialEntityName: string
}

interface AppState {
  activeTab: NavTab
  setActiveTab: (tab: NavTab) => void
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  createAlertOpen: boolean
  setCreateAlertOpen: (open: boolean) => void
  searchFocused: boolean
  setSearchFocused: (focused: boolean) => void
  selectedEntityId: string | null
  setSelectedEntityId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  currentUser: null,
  setCurrentUser: (user) => {
    set({ currentUser: user })
    if (user) {
      localStorage.setItem('currentUserId', user.id)
    } else {
      localStorage.removeItem('currentUserId')
    }
  },
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  createAlertOpen: false,
  setCreateAlertOpen: (open) => set({ createAlertOpen: open, ...(open ? { activeTab: 'my-alerts' as NavTab } : {}) }),
  searchFocused: false,
  setSearchFocused: (focused) => set({ searchFocused: focused }),
  selectedEntityId: null,
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
}))

// Helper to get saved user ID from localStorage (client only)
export function getSavedUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('currentUserId')
}
