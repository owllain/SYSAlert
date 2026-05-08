'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore, type NavTab } from '@/lib/store'
import {
  Search,
  Home,
  Users,
  Bell,
  Clock,
  Calendar,
  Plus,
  Building2,
  ScrollText,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Moon,
  Sun,
  Shield,
} from 'lucide-react'
import { useTheme } from 'next-themes'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  iconColor?: string
  action: () => void
  category: 'navigation' | 'actions' | 'theme'
}

interface CommandAlert {
  id: string
  personName: string
  personId: string
  profile: string
  status: string
  financialEntity: { name: string; code: string }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentAlerts, setRecentAlerts] = useState<CommandAlert[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { setActiveTab, setCreateAlertOpen, currentUser } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()

  const isViewer = currentUser?.role === 'viewer'

  // Toggle with Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        e.stopPropagation()
        setOpen(prev => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  // Fetch recent alerts for search
  useEffect(() => {
    if (!open) return
    fetch('/api/alerts?month=true')
      .then(r => r.json())
      .then(data => {
        setRecentAlerts(Array.isArray(data) ? data.slice(0, 20) : [])
      })
      .catch(() => {})
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const navigationItems: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Resumen general del sistema', icon: Home, iconColor: 'text-[#181d26] dark:text-[#e8eaf0]', action: () => setActiveTab('dashboard'), category: 'navigation' },
    { id: 'nav-entities', label: 'Entidades', description: 'Información de entidades financieras', icon: Building2, iconColor: 'text-[#0a2e0e] dark:text-[#1a5c2a]', action: () => setActiveTab('entities'), category: 'navigation' },
    { id: 'nav-users', label: 'Usuarios y Permisos', description: 'Gestionar usuarios del sistema', icon: Users, iconColor: 'text-[#181d26] dark:text-[#e8eaf0]', action: () => setActiveTab('users'), category: 'navigation' },
    ...(isViewer ? [] : [{ id: 'nav-audit', label: 'Registro de Actividad', description: 'Auditoría de acciones', icon: ScrollText, iconColor: 'text-[#41454d] dark:text-[#9ea3b0]', action: () => setActiveTab('audit-log' as NavTab), category: 'navigation' as const }]),
    { id: 'nav-my-alerts', label: 'Mis Alertas', description: 'Alertas creadas por mí', icon: Bell, iconColor: 'text-[#aa2d00] dark:text-[#e0522a]', action: () => setActiveTab('my-alerts'), category: 'navigation' },
    { id: 'nav-latest', label: 'Últimas Alertas', description: 'Alertas del día de hoy', icon: Clock, iconColor: 'text-[#0a2e0e] dark:text-[#1a5c2a]', action: () => setActiveTab('latest-alerts'), category: 'navigation' },
    { id: 'nav-history', label: 'Historial Alertas', description: 'Historial completo de alertas', icon: Calendar, iconColor: 'text-[#41454d] dark:text-[#9ea3b0]', action: () => setActiveTab('alert-history'), category: 'navigation' },
  ]

  const actionItems: CommandItem[] = [
    ...(isViewer ? [] : [{ id: 'action-new-alert', label: 'Nueva Alerta', description: 'Crear una nueva alerta interbancaria', icon: Plus, iconColor: 'text-[#aa2d00] dark:text-[#e0522a]', action: () => setCreateAlertOpen(true), category: 'actions' as const }]),
    { id: 'action-export-csv', label: 'Exportar CSV', description: 'Descargar alertas en formato CSV', icon: FileText, iconColor: 'text-[#41454d] dark:text-[#9ea3b0]', action: () => setActiveTab('alert-history'), category: 'actions' },
    { id: 'action-export-xlsx', label: 'Exportar Excel', description: 'Descargar alertas en formato Excel', icon: FileSpreadsheet, iconColor: 'text-[#0a2e0e] dark:text-[#1a5c2a]', action: () => setActiveTab('alert-history'), category: 'actions' },
  ]

  const themeItems: CommandItem[] = [
    { id: 'theme-toggle', label: resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro', description: resolvedTheme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro', icon: resolvedTheme === 'dark' ? Sun : Moon, iconColor: 'text-[#aa2d00] dark:text-[#e0522a]', action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'), category: 'theme' },
  ]

  const allItems = [...navigationItems, ...actionItems, ...themeItems]

  // Filter items and alerts by query
  const filteredItems = query
    ? allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems

  const filteredAlerts = query && query.length >= 2
    ? recentAlerts.filter(alert =>
        alert.personName.toLowerCase().includes(query.toLowerCase()) ||
        alert.personId.includes(query) ||
        alert.financialEntity?.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : []

  const totalItems = filteredItems.length + filteredAlerts.length

  // Reset selection when query changes - use event handler instead of effect
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
    setSelectedIndex(0)
  }, [])

  const executeItem = useCallback((index: number) => {
    if (index < filteredItems.length) {
      filteredItems[index].action()
    } else {
      const alertIndex = index - filteredItems.length
      if (alertIndex < filteredAlerts.length) {
        setActiveTab('my-alerts')
      }
    }
    setOpen(false)
    setQuery('')
  }, [filteredItems, filteredAlerts, setActiveTab])

  // Keyboard navigation inside palette
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(totalItems, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + totalItems) % Math.max(totalItems, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (totalItems > 0) executeItem(selectedIndex)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery('')
    }
  }, [totalItems, selectedIndex, executeItem])

  // Scroll selected item into view
  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]')
      if (selected) selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={() => { setOpen(false); setQuery('') }}
      />

      {/* Palette */}
      <div className="relative mx-auto mt-[15vh] w-full max-w-[560px] px-4">
        <div className="bg-white dark:bg-[#1a1d27] rounded-[14px] border border-[#dddddd] dark:border-[#2d3140] shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-[#dddddd] dark:border-[#2d3140]">
            <Search size={18} className="text-[#41454d] dark:text-[#9ea3b0] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar navegación, acciones, alertas..."
              className="flex-1 py-4 bg-transparent text-[#181d26] dark:text-[#e8eaf0] placeholder:text-[#9297a0] dark:placeholder:text-[#6b7080] text-sm outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] bg-[#f8fafc] dark:bg-[#242835] border border-[#dddddd] dark:border-[#2d3140] text-[10px] text-[#41454d] dark:text-[#9ea3b0] font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto custom-scrollbar py-2">
            {totalItems === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search size={24} className="text-[#dddddd] dark:text-[#2d3140] mx-auto mb-2" />
                <p className="text-sm text-[#41454d] dark:text-[#9ea3b0]">Sin resultados para &quot;{query}&quot;</p>
                <p className="text-xs text-[#9297a0] dark:text-[#6b7080] mt-1">Intenta con otro término</p>
              </div>
            ) : (
              <>
                {/* Navigation group */}
                {filteredItems.filter(i => i.category === 'navigation').length > 0 && (
                  <>
                    <div className="px-4 py-1.5">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9297a0] dark:text-[#6b7080]">Navegación</p>
                    </div>
                    {filteredItems.filter(i => i.category === 'navigation').map(item => {
                      const globalIndex = filteredItems.indexOf(item)
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          data-selected={selectedIndex === globalIndex}
                          onClick={() => executeItem(globalIndex)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === globalIndex
                              ? 'bg-[#f8fafc] dark:bg-[#242835]'
                              : 'hover:bg-[#f8fafc]/60 dark:hover:bg-[#242835]/60'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-[6px] bg-[#f8fafc] dark:bg-[#242835] flex items-center justify-center shrink-0">
                            <Icon size={16} className={item.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#181d26] dark:text-[#e8eaf0] truncate">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-[#41454d] dark:text-[#9ea3b0] truncate">{item.description}</p>
                            )}
                          </div>
                          <ArrowRight size={14} className={`shrink-0 transition-opacity ${selectedIndex === globalIndex ? 'opacity-100 text-[#aa2d00] dark:text-[#e0522a]' : 'opacity-0'}`} />
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Actions group */}
                {filteredItems.filter(i => i.category === 'actions').length > 0 && (
                  <>
                    <div className="px-4 py-1.5 mt-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9297a0] dark:text-[#6b7080]">Acciones</p>
                    </div>
                    {filteredItems.filter(i => i.category === 'actions').map(item => {
                      const globalIndex = filteredItems.indexOf(item)
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          data-selected={selectedIndex === globalIndex}
                          onClick={() => executeItem(globalIndex)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === globalIndex
                              ? 'bg-[#f8fafc] dark:bg-[#242835]'
                              : 'hover:bg-[#f8fafc]/60 dark:hover:bg-[#242835]/60'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-[6px] bg-[#f8fafc] dark:bg-[#242835] flex items-center justify-center shrink-0">
                            <Icon size={16} className={item.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#181d26] dark:text-[#e8eaf0] truncate">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-[#41454d] dark:text-[#9ea3b0] truncate">{item.description}</p>
                            )}
                          </div>
                          <ArrowRight size={14} className={`shrink-0 transition-opacity ${selectedIndex === globalIndex ? 'opacity-100 text-[#aa2d00] dark:text-[#e0522a]' : 'opacity-0'}`} />
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Theme group */}
                {filteredItems.filter(i => i.category === 'theme').length > 0 && (
                  <>
                    <div className="px-4 py-1.5 mt-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9297a0] dark:text-[#6b7080]">Apariencia</p>
                    </div>
                    {filteredItems.filter(i => i.category === 'theme').map(item => {
                      const globalIndex = filteredItems.indexOf(item)
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          data-selected={selectedIndex === globalIndex}
                          onClick={() => executeItem(globalIndex)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === globalIndex
                              ? 'bg-[#f8fafc] dark:bg-[#242835]'
                              : 'hover:bg-[#f8fafc]/60 dark:hover:bg-[#242835]/60'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-[6px] bg-[#f8fafc] dark:bg-[#242835] flex items-center justify-center shrink-0">
                            <Icon size={16} className={item.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#181d26] dark:text-[#e8eaf0] truncate">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-[#41454d] dark:text-[#9ea3b0] truncate">{item.description}</p>
                            )}
                          </div>
                          <ArrowRight size={14} className={`shrink-0 transition-opacity ${selectedIndex === globalIndex ? 'opacity-100 text-[#aa2d00] dark:text-[#e0522a]' : 'opacity-0'}`} />
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Alert search results */}
                {filteredAlerts.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 mt-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9297a0] dark:text-[#6b7080]">Alertas</p>
                    </div>
                    {filteredAlerts.map((alert, idx) => {
                      const globalIndex = filteredItems.length + idx
                      return (
                        <button
                          key={alert.id}
                          data-selected={selectedIndex === globalIndex}
                          onClick={() => executeItem(globalIndex)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === globalIndex
                              ? 'bg-[#f8fafc] dark:bg-[#242835]'
                              : 'hover:bg-[#f8fafc]/60 dark:hover:bg-[#242835]/60'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-[6px] bg-[#f8fafc] dark:bg-[#242835] flex items-center justify-center shrink-0">
                            <Shield size={16} className={alert.profile === 'victima' ? 'text-[#aa2d00] dark:text-[#e0522a]' : 'text-[#0a2e0e] dark:text-[#1a5c2a]'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#181d26] dark:text-[#e8eaf0] truncate">{alert.personName}</p>
                            <p className="text-xs text-[#41454d] dark:text-[#9ea3b0] truncate">{alert.personId} · {alert.financialEntity?.name}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] shrink-0 ${
                            alert.profile === 'victima' ? 'bg-[#aa2d00]/10 dark:bg-[#e0522a]/15 text-[#aa2d00] dark:text-[#e0522a]' : 'bg-[#0a2e0e]/10 dark:bg-[#1a5c2a]/15 text-[#0a2e0e] dark:text-[#1a5c2a]'
                          }`}>
                            {alert.profile === 'victima' ? 'Víctima' : 'Receptor'}
                          </span>
                        </button>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#dddddd] dark:border-[#2d3140] bg-[#f8fafc]/50 dark:bg-[#0f1117]/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-[#9297a0] dark:text-[#6b7080]">
                <kbd className="px-1 py-0.5 rounded-[3px] bg-white dark:bg-[#1a1d27] border border-[#dddddd] dark:border-[#2d3140] text-[9px] font-mono">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#9297a0] dark:text-[#6b7080]">
                <kbd className="px-1 py-0.5 rounded-[3px] bg-white dark:bg-[#1a1d27] border border-[#dddddd] dark:border-[#2d3140] text-[9px] font-mono">↵</kbd>
                seleccionar
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#9297a0] dark:text-[#6b7080]">
                <kbd className="px-1 py-0.5 rounded-[3px] bg-white dark:bg-[#1a1d27] border border-[#dddddd] dark:border-[#2d3140] text-[9px] font-mono">esc</kbd>
                cerrar
              </span>
            </div>
            <span className="text-[10px] text-[#9297a0] dark:text-[#6b7080] flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded-[3px] bg-white dark:bg-[#1a1d27] border border-[#dddddd] dark:border-[#2d3140] text-[9px] font-mono">Ctrl+K</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
