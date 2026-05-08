'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Menu, ChevronDown, Shield, Building2, Bell, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface UserOption {
  id: string
  name: string
  username: string
  email: string
  role: string
  financialEntityId: string
  financialEntity: { name: string; code: string }
}

interface NotificationAlert {
  id: string
  profile: string
  personName: string
  financialEntity: { id: string; name: string; code: string }
  creator: { id: string; name: string; username: string; financialEntity: { name: string } }
  createdAt: string
}

const entityColors: Record<string, string> = {
  BP: '#aa2d00',
  BCR: '#0a2e0e',
  BNC: '#181d26',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  analyst: 'Analista',
  viewer: 'Consultor',
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
}

export function AppHeader() {
  const { currentUser, sidebarOpen, setSidebarOpen, setCurrentUser, setActiveTab, activeTab } = useAppStore()
  const [users, setUsers] = useState<UserOption[]>([])
  const [recentAlerts, setRecentAlerts] = useState<NotificationAlert[]>([])
  const [todayOtherCount, setTodayOtherCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUser) return

    let mounted = true

    async function loadAlerts() {
      try {
        const params = new URLSearchParams({ today: 'true' })
        const res = await fetch(`/api/alerts?${params}`)
        const data = await res.json()
        if (mounted && Array.isArray(data)) {
          const otherAlerts = data.filter(
            (a: NotificationAlert) => a.financialEntity?.id !== currentUser.financialEntityId
          )
          setTodayOtherCount(otherAlerts.length)
          setRecentAlerts(otherAlerts.slice(0, 5))
        }
      } catch {
        // silently fail
      }
    }

    loadAlerts()
    const interval = setInterval(loadAlerts, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [currentUser])

  const handleSwitchUser = (user: UserOption) => {
    setCurrentUser({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      financialEntityId: user.financialEntityId,
      financialEntityName: user.financialEntity?.name || '',
    })
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="h-[64px] bg-white dark:bg-[#1a1d27] border-b border-[#dddddd] dark:border-[#2d3140] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-[#41454d] dark:text-[#9ea3b0]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={20} />
        </Button>
        <div>
          <h1 className="text-base sm:text-lg font-medium text-[#181d26] dark:text-[#e8eaf0] leading-tight">
            Sistema de Alertas Interbancario
          </h1>
          <p className="text-xs text-[#41454d] dark:text-[#9ea3b0] leading-tight hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#aa2d00] dark:bg-[#e0522a]" />
            Plataforma de gestión de alertas entre entidades financieras
            <span className="text-[#dddddd] dark:text-[#2d3140]">·</span>
            <span className="text-[#181d26] dark:text-[#e8eaf0] font-medium">
              {activeTab === 'dashboard' ? 'Dashboard' :
               activeTab === 'users' ? 'Usuarios y Permisos' :
               activeTab === 'audit-log' ? 'Registro de Actividad' :
               activeTab === 'my-alerts' ? 'Mis Alertas' :
               activeTab === 'latest-alerts' ? 'Últimas Alertas' :
               'Historial Alertas'}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-[#f8fafc] dark:bg-[#242835] border border-[#dddddd] dark:border-[#2d3140] hover:bg-white dark:hover:bg-[#2d3140] flex items-center justify-center transition-all duration-300 relative overflow-hidden"
              aria-label="Cambiar tema"
            >
              <Sun
                size={18}
                className={`text-[#41454d] dark:text-[#9ea3b0] absolute transition-all duration-300 ${
                  resolvedTheme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`}
              />
              <Moon
                size={18}
                className={`text-[#41454d] dark:text-[#9ea3b0] absolute transition-all duration-300 ${
                  resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                }`}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </TooltipContent>
        </Tooltip>

        {/* Notification Bell */}
        {currentUser && (
          <Popover open={bellOpen} onOpenChange={setBellOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-10 h-10 rounded-full bg-[#f8fafc] dark:bg-[#242835] border border-[#dddddd] dark:border-[#2d3140] hover:bg-white dark:hover:bg-[#2d3140] flex items-center justify-center transition-colors relative"
                aria-label="Notificaciones"
              >
                <Bell size={18} className="text-[#41454d] dark:text-[#9ea3b0]" />
                {todayOtherCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#aa2d00] dark:bg-[#e0522a] text-white text-[10px] font-medium flex items-center justify-center">
                    {todayOtherCount > 9 ? '9+' : todayOtherCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[360px] rounded-[12px] border border-[#dddddd] dark:border-[#2d3140] shadow-lg p-0 bg-white dark:bg-[#1a1d27]"
            >
              <div className="px-4 py-3 border-b border-[#dddddd] dark:border-[#2d3140]">
                <h3 className="text-sm font-medium text-[#181d26] dark:text-[#e8eaf0]">Alertas Recientes</h3>
                <p className="text-xs text-[#41454d] dark:text-[#9ea3b0] mt-0.5">De otras entidades financieras</p>
              </div>
              {recentAlerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f8fafc] dark:bg-[#242835] border border-[#dddddd] dark:border-[#2d3140] flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-[#41454d]/40 dark:text-[#9ea3b0]/40" />
                  </div>
                  <p className="text-sm text-[#41454d] dark:text-[#9ea3b0]">No hay alertas nuevas</p>
                  <p className="text-xs text-[#41454d]/60 dark:text-[#6b7080] mt-1">Las alertas de otras entidades aparecerán aquí</p>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 border-b border-[#dddddd] dark:border-[#2d3140] last:border-0 hover:bg-[#f8fafc]/50 dark:hover:bg-[#242835]/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setBellOpen(false)
                        setActiveTab('latest-alerts')
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#181d26] dark:text-[#e8eaf0]">
                          {alert.financialEntity?.name || '—'}
                        </span>
                        <span className="text-[11px] text-[#41454d] dark:text-[#9ea3b0]">{timeAgo(alert.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`rounded-[4px] text-[10px] px-1.5 py-0 font-normal ${
                            alert.profile === 'victima'
                              ? 'bg-[#aa2d00] dark:bg-[#e0522a] text-white'
                              : 'bg-[#0a2e0e] dark:bg-[#1a5c2a] text-white'
                          }`}
                        >
                          {alert.profile === 'victima' ? 'Víctima' : 'Receptor'}
                        </Badge>
                        <span className="text-xs text-[#333840] dark:text-[#c0c4ce]">{alert.personName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {recentAlerts.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[#dddddd] dark:border-[#2d3140]">
                  <button
                    className="text-xs font-medium text-[#aa2d00] dark:text-[#e0522a] hover:text-[#8c2500] dark:hover:text-[#e0522a]/80 transition-colors"
                    onClick={() => {
                      setBellOpen(false)
                      setActiveTab('latest-alerts')
                    }}
                  >
                    Ver todas
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-[#f8fafc] dark:hover:bg-[#242835]">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-[#181d26] dark:text-[#e8eaf0] leading-tight">{currentUser.name}</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0a2e0e] dark:bg-[#1a5c2a]" />
                    <p className="text-xs text-[#41454d] dark:text-[#9ea3b0] leading-tight">{currentUser.financialEntityName}</p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#181d26] dark:bg-[#2d3140] flex items-center justify-center relative">
                  <span className="text-white text-sm font-medium">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={14} className="text-[#41454d] dark:text-[#9ea3b0]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] rounded-[12px] p-2 bg-white dark:bg-[#1a1d27] border-[#dddddd] dark:border-[#2d3140]">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs text-[#41454d] dark:text-[#9ea3b0] uppercase tracking-wider font-medium">Cambiar Usuario</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#dddddd] dark:bg-[#2d3140]" />
              {users.map(user => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleSwitchUser(user)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] cursor-pointer ${
                    currentUser.id === user.id ? 'bg-[#f8fafc] dark:bg-[#242835]' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: entityColors[user.financialEntity?.code] || '#181d26' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#181d26] dark:text-[#e8eaf0] truncate">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Building2 size={10} className="text-[#41454d] dark:text-[#9ea3b0]" />
                        <span className="text-xs text-[#41454d] dark:text-[#9ea3b0]">{user.financialEntity?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`rounded-[4px] text-[10px] px-1.5 py-0 font-normal ${
                      user.role === 'admin' ? 'bg-[#181d26] dark:bg-[#2d3140] text-white' :
                      user.role === 'analyst' ? 'bg-[#0a2e0e] dark:bg-[#1a5c2a] text-white' :
                      'bg-[#f8fafc] dark:bg-[#242835] text-[#41454d] dark:text-[#9ea3b0] border border-[#dddddd] dark:border-[#2d3140]'
                    }`}>
                      {roleLabels[user.role]}
                    </Badge>
                    {currentUser.id === user.id && (
                      <Shield size={12} className="text-[#0a2e0e] dark:text-[#1a5c2a]" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-[#dddddd] dark:bg-[#2d3140]" />
              <div className="px-3 py-2">
                <p className="text-[10px] text-[#41454d] dark:text-[#9ea3b0]">
                  Seleccione un usuario para cambiar la sesión activa
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
