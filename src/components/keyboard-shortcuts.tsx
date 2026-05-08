'use client'

import { useEffect } from 'react'
import { useAppStore, type NavTab } from '@/lib/store'
import { toast } from 'sonner'

const tabMap: Record<string, NavTab> = {
  '1': 'dashboard',
  '2': 'users',
  '3': 'audit-log',
  '4': 'my-alerts',
  '5': 'latest-alerts',
  '6': 'alert-history',
}

const tabLabels: Record<string, string> = {
  '1': 'Dashboard',
  '2': 'Usuarios',
  '3': 'Registro de Actividad',
  '4': 'Mis Alertas',
  '5': 'Últimas Alertas',
  '6': 'Historial',
}

export function KeyboardShortcuts() {
  const { setCreateAlertOpen, setActiveTab, setSearchFocused, currentUser } = useAppStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in input/textarea/contentEditable
      const target = e.target as HTMLElement
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Ctrl+N / Cmd+N: Open create alert dialog (only for non-viewers)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        if (currentUser?.role === 'viewer') {
          toast.info('Su rol solo permite consulta', { duration: 2000 })
          return
        }
        setCreateAlertOpen(true)
        toast.info('Atajo: Nueva Alerta', { duration: 2000 })
        return
      }

      // Ctrl+K / Cmd+K: Now handled by CommandPalette component
      // This shortcut is intercepted by the CommandPalette, so we don't need to handle it here

      // Alt+1-6: Switch tabs (only when not in an input)
      if (e.altKey && !e.ctrlKey && !e.metaKey && tabMap[e.key]) {
        e.preventDefault()
        const tab = tabMap[e.key]

        // Viewers can't access audit log
        if (tab === 'audit-log' && currentUser?.role === 'viewer') {
          toast.info('Acceso no permitido para su rol', { duration: 2000 })
          return
        }

        setActiveTab(tab)
        const label = tabLabels[e.key]
        if (!isInputFocused) {
          toast.info(`Atajo: ${label}`, { duration: 2000 })
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setCreateAlertOpen, setActiveTab, setSearchFocused, currentUser])

  return null
}
