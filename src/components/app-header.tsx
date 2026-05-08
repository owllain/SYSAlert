'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Menu, ChevronDown, Shield, Building2, Bell } from 'lucide-react'
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
  const { currentUser, sidebarOpen, setSidebarOpen, setCurrentUser, setActiveTab } = useAppStore()
  const [users, setUsers] = useState<UserOption[]>([])
  const [recentAlerts, setRecentAlerts] = useState<NotificationAlert[]>([])
  const [todayOtherCount, setTodayOtherCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)

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

  const entityColor = currentUser ? (entityColors[currentUser.financialEntityId === users.find(u => u.id === currentUser.id)?.financialEntity?.code ? '' : ''] || '#181d26') : '#181d26'

  return (
    <header className="h-[64px] bg-white border-b border-[#dddddd] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-[#41454d]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={20} />
        </Button>
        <div>
          <h1 className="text-lg font-medium text-[#181d26] leading-tight">
            Sistema de Alertas Interbancario
          </h1>
          <p className="text-xs text-[#41454d] leading-tight hidden sm:block">
            Plataforma de gestión de alertas entre entidades financieras
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        {currentUser && (
          <Popover open={bellOpen} onOpenChange={setBellOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-10 h-10 rounded-full bg-[#f8fafc] border border-[#dddddd] hover:bg-white flex items-center justify-center transition-colors relative"
                aria-label="Notificaciones"
              >
                <Bell size={18} className="text-[#41454d]" />
                {todayOtherCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#aa2d00] text-white text-[10px] font-medium flex items-center justify-center">
                    {todayOtherCount > 9 ? '9+' : todayOtherCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[360px] rounded-[12px] border border-[#dddddd] shadow-lg p-0"
            >
              <div className="px-4 py-3 border-b border-[#dddddd]">
                <h3 className="text-sm font-medium text-[#181d26]">Alertas Recientes</h3>
                <p className="text-xs text-[#41454d] mt-0.5">De otras entidades financieras</p>
              </div>
              {recentAlerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-[#41454d]/40" />
                  </div>
                  <p className="text-sm text-[#41454d]">No hay alertas nuevas</p>
                  <p className="text-xs text-[#41454d]/60 mt-1">Las alertas de otras entidades aparecerán aquí</p>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 border-b border-[#dddddd] last:border-0 hover:bg-[#f8fafc]/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setBellOpen(false)
                        setActiveTab('latest-alerts')
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#181d26]">
                          {alert.financialEntity?.name || '—'}
                        </span>
                        <span className="text-[11px] text-[#41454d]">{timeAgo(alert.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`rounded-[4px] text-[10px] px-1.5 py-0 font-normal ${
                            alert.profile === 'victima'
                              ? 'bg-[#aa2d00] text-white'
                              : 'bg-[#0a2e0e] text-white'
                          }`}
                        >
                          {alert.profile === 'victima' ? 'Víctima' : 'Receptor'}
                        </Badge>
                        <span className="text-xs text-[#333840]">{alert.personName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {recentAlerts.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[#dddddd]">
                  <button
                    className="text-xs font-medium text-[#aa2d00] hover:text-[#8c2500] transition-colors"
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
              <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-[#f8fafc]">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-[#181d26] leading-tight">{currentUser.name}</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0a2e0e]" />
                    <p className="text-xs text-[#41454d] leading-tight">{currentUser.financialEntityName}</p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#181d26] flex items-center justify-center relative">
                  <span className="text-white text-sm font-medium">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={14} className="text-[#41454d]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] rounded-[12px] p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium">Cambiar Usuario</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#dddddd]" />
              {users.map(user => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleSwitchUser(user)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] cursor-pointer ${
                    currentUser.id === user.id ? 'bg-[#f8fafc]' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: entityColors[user.financialEntity?.code] || '#181d26' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#181d26] truncate">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Building2 size={10} className="text-[#41454d]" />
                        <span className="text-xs text-[#41454d]">{user.financialEntity?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`rounded-[4px] text-[10px] px-1.5 py-0 font-normal ${
                      user.role === 'admin' ? 'bg-[#181d26] text-white' :
                      user.role === 'analyst' ? 'bg-[#0a2e0e] text-white' :
                      'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]'
                    }`}>
                      {roleLabels[user.role]}
                    </Badge>
                    {currentUser.id === user.id && (
                      <Shield size={12} className="text-[#0a2e0e]" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-[#dddddd]" />
              <div className="px-3 py-2">
                <p className="text-[10px] text-[#41454d]">
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
