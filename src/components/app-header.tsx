'use client'

import { useAppStore } from '@/lib/store'
import { Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AppHeader() {
  const { currentUser, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <header className="h-[64px] bg-white border-b border-[#dddddd] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={20} />
        </Button>
        <h1 className="text-lg font-medium text-[#181d26]">
          Sistema de Alertas Interbancario
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-[#181d26] leading-tight">{currentUser.name}</p>
              <p className="text-xs text-[#41454d] leading-tight">{currentUser.financialEntityName}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#181d26] flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="text-[#41454d]">
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
