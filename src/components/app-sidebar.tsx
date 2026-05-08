'use client'

import { useAppStore, type NavTab } from '@/lib/store'
import { Home, Users, Bell, Clock, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const navItems: { id: NavTab; label: string; icon: React.ElementType; section?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'users', label: 'Usuarios y Permisos', icon: Users },
  { id: 'my-alerts', label: 'Mis Alertas', icon: Bell, section: 'alerts' },
  { id: 'latest-alerts', label: 'Últimas Alertas', icon: Clock, section: 'alerts' },
  { id: 'alert-history', label: 'Historial Alertas', icon: Calendar, section: 'alerts' },
]

export function AppSidebar() {
  const { activeTab, setActiveTab, sidebarOpen } = useAppStore()
  const [alertsOpen, setAlertsOpen] = useState(true)

  if (!sidebarOpen) return null

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-[#dddddd] z-40 flex flex-col lg:relative lg:z-auto">
      {/* Logo area */}
      <div className="h-[64px] flex items-center px-6 border-b border-[#dddddd]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#181d26] flex items-center justify-center">
            <span className="text-white text-sm font-medium">SA</span>
          </div>
          <div>
            <p className="text-[#181d26] font-medium text-sm leading-tight">Sistema de Alertas</p>
            <p className="text-[#41454d] text-xs leading-tight">Interbancario CR</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
        {/* Main items */}
        <div className="space-y-1">
          {navItems.filter(item => !item.section).map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm transition-colors ${
                  isActive
                    ? 'bg-[#181d26] text-white font-medium'
                    : 'text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26]'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Alerts section */}
        <div className="mt-6">
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 text-[#41454d] text-xs font-medium uppercase tracking-wider hover:text-[#181d26] transition-colors"
          >
            {alertsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Alertas</span>
          </button>

          {alertsOpen && (
            <div className="space-y-1 mt-1">
              {navItems.filter(item => item.section === 'alerts').map(item => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm transition-colors pl-8 ${
                      isActive
                        ? 'bg-[#181d26] text-white font-medium'
                        : 'text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26]'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#dddddd]">
        <p className="text-[10px] text-[#41454d] text-center">© 2024 Sistema de Alertas Interbancario</p>
      </div>
    </aside>
  )
}
