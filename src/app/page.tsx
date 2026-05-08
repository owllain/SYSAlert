'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type NavTab } from '@/lib/store'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { DashboardView } from '@/components/dashboard-view'
import { UsersView } from '@/components/users-view'
import { MyAlertsView } from '@/components/my-alerts-view'
import { LatestAlertsView } from '@/components/latest-alerts-view'
import { AlertHistoryView } from '@/components/alert-history-view'
import { AuditLogView } from '@/components/audit-log-view'
import { EntitiesView } from '@/components/entities-view'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { LoginView } from '@/components/login-view'
import { AnimatePresence, motion } from 'framer-motion'

export default function Home() {
  const { activeTab, currentUser, setCurrentUser, sidebarOpen, setSidebarOpen } = useAppStore()
  const [initialized, setInitialized] = useState(false)

  // Initialize: seed data and restore saved user
  useEffect(() => {
    async function init() {
      try {
        // Seed data
        await fetch('/api/seed')

        // Check localStorage for saved user
        const savedUserId = localStorage.getItem('currentUserId')

        if (savedUserId) {
          const usersRes = await fetch('/api/users')
          const users = await usersRes.json()
          const savedUser = Array.isArray(users) ? users.find((u: { id: string }) => u.id === savedUserId) : null
          if (savedUser) {
            setCurrentUser({
              id: savedUser.id,
              name: savedUser.name,
              username: savedUser.username,
              email: savedUser.email,
              role: savedUser.role,
              financialEntityId: savedUser.financialEntityId,
              financialEntityName: savedUser.financialEntity?.name || '',
            })
          }
        }
      } catch (error) {
        console.error('Initialization error:', error)
      } finally {
        setInitialized(true)
      }
    }

    init()
  }, [setCurrentUser])

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />
      case 'entities':
        return <EntitiesView />
      case 'users':
        return <UsersView />
      case 'my-alerts':
        return <MyAlertsView />
      case 'latest-alerts':
        return <LatestAlertsView />
      case 'alert-history':
        return <AlertHistoryView />
      case 'audit-log':
        return <AuditLogView />
      default:
        return <DashboardView />
    }
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-[10px] bg-[#181d26] flex items-center justify-center animate-pulse">
            <span className="text-white text-lg font-medium">SA</span>
          </div>
          <p className="text-[#41454d] text-sm">Cargando sistema...</p>
        </div>
      </div>
    )
  }

  // Show login page when no user is authenticated
  if (!currentUser) {
    return <LoginView />
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <KeyboardShortcuts />
      <div className="flex flex-1">
        {/* Sidebar overlay for mobile */}
        <div
          className={`fixed inset-0 bg-black/30 z-30 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />

        <AppSidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#dddddd] bg-[#f8fafc] py-4 px-6 mt-auto">
        <div className="flex items-center justify-between max-w-[1280px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-[4px] bg-[#181d26] flex items-center justify-center">
              <span className="text-white text-[8px] font-medium">SA</span>
            </div>
            <span className="text-xs text-[#41454d]">
              Sistema de Alertas Interbancario v2.0
            </span>
            <span className="text-[#dddddd]">|</span>
            <span className="text-xs text-[#41454d] hidden sm:inline">
              {currentUser?.financialEntityName || ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9297a0]">
              © {new Date().getFullYear()} Costa Rica
            </span>
            <span className="text-[#dddddd] hidden sm:inline">|</span>
            <span className="text-xs text-[#9297a0] hidden sm:inline">
              {currentUser?.role !== 'viewer' ? 'Ctrl+N Nueva Alerta · ' : ''}Ctrl+K Buscar
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
