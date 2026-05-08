'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Menu, ChevronDown, Shield, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export function AppHeader() {
  const { currentUser, sidebarOpen, setSidebarOpen, setCurrentUser } = useAppStore()
  const [users, setUsers] = useState<UserOption[]>([])

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

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
