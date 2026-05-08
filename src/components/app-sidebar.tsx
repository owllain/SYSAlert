'use client'

import { useAppStore, type NavTab } from '@/lib/store'
import { Home, Users, Bell, Clock, Calendar, ChevronDown, ChevronRight, Shield, LogOut, ScrollText, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const entityDotColors: Record<string, string> = {
  BP: '#aa2d00',
  BCR: '#0a2e0e',
  BNC: '#181d26',
}

const entityBadgeColors: Record<string, { bg: string; text: string; dot: string }> = {
  BP: { bg: 'bg-[#aa2d00]/10', text: 'text-[#aa2d00]', dot: 'bg-[#aa2d00]' },
  BCR: { bg: 'bg-[#0a2e0e]/10', text: 'text-[#0a2e0e]', dot: 'bg-[#0a2e0e]' },
  BNC: { bg: 'bg-[#181d26]/10', text: 'text-[#181d26]', dot: 'bg-[#181d26]' },
}

interface AlertCount {
  myAlerts: number
  latestAlerts: number
  total: number
}

export function AppSidebar() {
  const { activeTab, setActiveTab, sidebarOpen, currentUser, setCurrentUser } = useAppStore()
  const [alertsOpen, setAlertsOpen] = useState(true)
  const [alertCount, setAlertCount] = useState<AlertCount>({ myAlerts: 0, latestAlerts: 0, total: 0 })

  useEffect(() => {
    async function fetchAlertCounts() {
      try {
        const [allRes, todayRes] = await Promise.all([
          currentUser ? fetch(`/api/alerts?userId=${currentUser.id}`) : null,
          fetch('/api/alerts?today=true'),
        ])
        const myAlerts = allRes ? await allRes.json() : []
        const today = await todayRes.json()
        setAlertCount({
          myAlerts: Array.isArray(myAlerts) ? myAlerts.length : 0,
          latestAlerts: Array.isArray(today) ? today.length : 0,
          total: Array.isArray(myAlerts) ? myAlerts.length : 0,
        })
      } catch {
        // silently fail
      }
    }
    fetchAlertCounts()
  }, [currentUser])

  // Determine entity code for current user
  const entityCode = currentUser?.financialEntityName?.includes('Popular') ? 'BP'
    : currentUser?.financialEntityName?.includes('Costa Rica') ? 'BCR'
    : currentUser?.financialEntityName?.includes('Nacional') ? 'BNC' : ''
  const entityColor = entityDotColors[entityCode] || '#41454d'
  const entityBadge = entityBadgeColors[entityCode] || entityBadgeColors['BNC']

  const isViewer = currentUser?.role === 'viewer'

  const navItems: { id: NavTab; label: string; icon: React.ElementType; section?: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'entities', label: 'Entidades', icon: Building2 },
    { id: 'users', label: 'Usuarios y Permisos', icon: Users },
    ...(isViewer ? [] : [{ id: 'audit-log' as NavTab, label: 'Registro de Actividad', icon: ScrollText }]),
    { id: 'my-alerts', label: 'Mis Alertas', icon: Bell, section: 'alerts', badge: alertCount.myAlerts },
    { id: 'latest-alerts', label: 'Últimas Alertas', icon: Clock, section: 'alerts', badge: alertCount.latestAlerts },
    { id: 'alert-history', label: 'Historial Alertas', icon: Calendar, section: 'alerts' },
  ]

  return (
    <aside className={`fixed left-0 top-0 bottom-0 w-[256px] bg-white border-r border-[#dddddd] z-40 flex flex-col lg:relative lg:z-auto transform transition-transform duration-300 ease-in-out ${!sidebarOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
      {/* Logo area */}
      <div className="h-[64px] flex items-center px-5 border-b border-[#dddddd] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#181d26] flex items-center justify-center relative">
            <Shield size={18} className="text-white" />
            {/* Entity color dot */}
            {entityCode && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: entityColor }}
              />
            )}
          </div>
          <div>
            <p className="text-[#181d26] font-medium text-sm leading-tight">Sistema de Alertas</p>
            <p className="text-[#41454d] text-[11px] leading-tight">Interbancario CR</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 overflow-y-auto custom-scrollbar">
        {/* Section label */}
        <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#41454d]/60">General</p>

        {/* Main items */}
        <div className="space-y-0.5">
          {navItems.filter(item => !item.section).map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-[#f8fafc] text-[#181d26] font-medium'
                    : 'text-[#41454d] hover:bg-[#f8fafc]/60 hover:text-[#181d26]'
                }`}
              >
                {/* Left border indicator for active state */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#aa2d00] transition-all duration-200" />
                )}
                <Icon size={17} className={isActive ? 'text-[#aa2d00]' : 'text-[#41454d]/70 group-hover:text-[#181d26]'} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="my-4 mx-3 h-px bg-[#dddddd]/70" />

        {/* Alerts section */}
        <div>
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 text-[#41454d]/60 text-[10px] font-medium uppercase tracking-[0.08em] hover:text-[#181d26] transition-colors"
          >
            {alertsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>Alertas</span>
            {alertCount.myAlerts > 0 && (
              <span className="ml-auto bg-[#aa2d00] text-white text-[9px] font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {alertCount.myAlerts}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div className="space-y-0.5 mt-1">
              {navItems.filter(item => item.section === 'alerts').map(item => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm transition-all duration-200 pl-7 relative group ${
                      isActive
                        ? 'bg-[#f8fafc] text-[#181d26] font-medium'
                        : 'text-[#41454d] hover:bg-[#f8fafc]/60 hover:text-[#181d26]'
                    }`}
                  >
                    {/* Left border indicator for active state */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#aa2d00] transition-all duration-200" />
                    )}
                    <Icon size={16} className={isActive ? 'text-[#aa2d00]' : 'text-[#41454d]/70 group-hover:text-[#181d26]'} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {/* Badge for alert counts */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-medium rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 ${
                        isActive ? 'bg-[#aa2d00]/15 text-[#aa2d00]' : 'bg-[#f8fafc] text-[#41454d]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-[#dddddd] p-4 shrink-0">
        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#181d26] flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Entity color dot on avatar */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: entityColor }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#181d26] truncate leading-tight">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[9px] font-medium ${entityBadge.bg} ${entityBadge.text}`}>
                  <span className={`w-1 h-1 rounded-full ${entityBadge.dot}`} />
                  {currentUser.financialEntityName}
                </span>
              </div>
            </div>
            <button
              className="text-[#41454d]/50 hover:text-[#aa2d00] transition-colors p-1"
              onClick={() => {
                localStorage.removeItem('currentUserId')
                setCurrentUser(null)
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f8fafc] flex items-center justify-center">
              <span className="text-[#41454d] text-sm">?</span>
            </div>
            <div>
              <p className="text-sm text-[#41454d]">Sin sesión</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
