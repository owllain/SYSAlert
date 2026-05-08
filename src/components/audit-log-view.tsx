'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ScrollText,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  UserPlus,
  UserCog,
  UserX,
  AlertCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  details: string
  userId: string
  user: { id: string; name: string; username: string }
  createdAt: string
}

const PAGE_SIZE = 10

const actionLabels: Record<string, string> = {
  create_alert: 'Creó alerta',
  update_alert: 'Actualizó alerta',
  delete_alert: 'Eliminó alerta',
  status_change: 'Cambió estado',
  create_user: 'Creó usuario',
  update_user: 'Actualizó usuario',
  delete_user: 'Eliminó usuario',
}

const actionColors: Record<string, { bg: string; text: string }> = {
  create_alert: { bg: 'bg-[#0a2e0e]/10', text: 'text-[#0a2e0e]' },
  create_user: { bg: 'bg-[#0a2e0e]/10', text: 'text-[#0a2e0e]' },
  update_alert: { bg: 'bg-[#181d26]/10', text: 'text-[#181d26]' },
  update_user: { bg: 'bg-[#181d26]/10', text: 'text-[#181d26]' },
  status_change: { bg: 'bg-[#181d26]/10', text: 'text-[#181d26]' },
  delete_alert: { bg: 'bg-[#aa2d00]/10', text: 'text-[#aa2d00]' },
  delete_user: { bg: 'bg-[#aa2d00]/10', text: 'text-[#aa2d00]' },
}

const actionIcons: Record<string, React.ElementType> = {
  create_alert: Plus,
  update_alert: Edit3,
  delete_alert: Trash2,
  status_change: RefreshCw,
  create_user: UserPlus,
  update_user: UserCog,
  delete_user: UserX,
}

const entityTypeLabels: Record<string, string> = {
  alert: 'Alerta',
  user: 'Usuario',
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
}

function formatAbsoluteDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDetail(action: string, detailsStr: string): string {
  try {
    const details = JSON.parse(detailsStr)
    switch (action) {
      case 'create_alert':
        return `Alerta para ${details.personName || '—'}`
      case 'update_alert':
        return `Campos: ${(details.updatedFields || []).join(', ') || '—'}`
      case 'delete_alert':
        return `Alerta de ${details.personName || '—'} eliminada`
      case 'status_change': {
        const fromLabel = { active: 'Activa', resolved: 'Resuelta', dismissed: 'Descartada' }[details.from] || details.from
        const toLabel = { active: 'Activa', resolved: 'Resuelta', dismissed: 'Descartada' }[details.to] || details.to
        return `${fromLabel} → ${toLabel}${details.personName ? ` (${details.personName})` : ''}${details.bulk ? ' [Masivo]' : ''}`
      }
      case 'create_user':
        return `Usuario ${details.name || '—'} (${details.role || '—'})`
      case 'update_user':
        return `Campos: ${(details.updatedFields || []).join(', ') || '—'}`
      case 'delete_user':
        return `Usuario ${details.name || '—'} eliminado`
      default:
        return detailsStr
    }
  } catch {
    return detailsStr
  }
}

export function AuditLogView() {
  const { searchFocused, setSearchFocused } = useAppStore()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterEntityType, setFilterEntityType] = useState<string>('all')
  const [filterFrom, setFilterFrom] = useState<string>('')
  const [filterTo, setFilterTo] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String((page - 1) * PAGE_SIZE))

      if (filterAction !== 'all') params.set('action', filterAction)
      if (filterEntityType !== 'all') params.set('entityType', filterEntityType)
      if (filterFrom) params.set('from', filterFrom)
      if (filterTo) params.set('to', filterTo)

      const res = await fetch(`/api/audit-logs?${params}`)
      const data = await res.json()

      if (data.data) {
        setLogs(Array.isArray(data.data) ? data.data : [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filterAction, filterEntityType, filterFrom, filterTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Focus search input when searchFocused is triggered
  useEffect(() => {
    if (searchFocused) {
      searchInputRef.current?.focus()
      setSearchFocused(false)
    }
  }, [searchFocused, setSearchFocused])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [filterAction, filterEntityType, filterFrom, filterTo])

  // Client-side search filter
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs
    const q = searchQuery.toLowerCase().trim()
    return logs.filter(
      (log) =>
        log.user?.name?.toLowerCase().includes(q) ||
        log.user?.username?.toLowerCase().includes(q) ||
        actionLabels[log.action]?.toLowerCase().includes(q) ||
        formatDetail(log.action, log.details).toLowerCase().includes(q)
    )
  }, [logs, searchQuery])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const clearFilters = () => {
    setFilterAction('all')
    setFilterEntityType('all')
    setFilterFrom('')
    setFilterTo('')
    setSearchQuery('')
  }

  const hasActiveFilters = filterAction !== 'all' || filterEntityType !== 'all' || filterFrom || filterTo

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-medium text-[#181d26]">Registro de Actividad</h2>
        <p className="text-[#41454d] mt-1">Auditoría de acciones realizadas en el sistema</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px] rounded-[6px] border-[#dddddd] h-10 text-sm">
            <SelectValue placeholder="Tipo de acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="create_alert">Creó alerta</SelectItem>
            <SelectItem value="update_alert">Actualizó alerta</SelectItem>
            <SelectItem value="delete_alert">Eliminó alerta</SelectItem>
            <SelectItem value="status_change">Cambió estado</SelectItem>
            <SelectItem value="create_user">Creó usuario</SelectItem>
            <SelectItem value="update_user">Actualizó usuario</SelectItem>
            <SelectItem value="delete_user">Eliminó usuario</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterEntityType} onValueChange={setFilterEntityType}>
          <SelectTrigger className="w-[150px] rounded-[6px] border-[#dddddd] h-10 text-sm">
            <SelectValue placeholder="Tipo de entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="alert">Alertas</SelectItem>
            <SelectItem value="user">Usuarios</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="rounded-[6px] h-10 border border-[#dddddd] text-sm px-3 w-[160px] focus:border-[#181d26] focus:outline-none"
            placeholder="Desde"
          />
          <span className="text-[#41454d] text-sm">—</span>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="rounded-[6px] h-10 border border-[#dddddd] text-sm px-3 w-[160px] focus:border-[#181d26] focus:outline-none"
            placeholder="Hasta"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-[#aa2d00] hover:text-[#aa2d00] hover:bg-[#aa2d00]/5 text-xs h-10"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#41454d]" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por usuario, acción o detalle..."
            className="pl-9 h-10 rounded-[8px] border-[#dddddd] bg-white focus:border-[#181d26] focus:ring-[#181d26]/10 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#dddddd] bg-[#f8fafc]/80">
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Fecha</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Usuario</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Acción</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Tipo</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Detalle</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Entidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-[#41454d]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center">
                      <ScrollText size={28} className="text-[#41454d]/40" />
                    </div>
                    <div>
                      <p className="font-medium text-[#181d26]">
                        {hasActiveFilters || searchQuery ? 'No se encontraron registros' : 'No hay registros de actividad'}
                      </p>
                      <p className="text-sm text-[#41454d] mt-1">
                        {hasActiveFilters || searchQuery
                          ? 'Intente ajustar los filtros de búsqueda'
                          : 'Las acciones realizadas en el sistema aparecerán aquí'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, idx) => {
                const ActionIcon = actionIcons[log.action] || AlertCircle
                const color = actionColors[log.action] || { bg: 'bg-[#f8fafc]', text: 'text-[#41454d]' }
                const label = actionLabels[log.action] || log.action
                return (
                  <TableRow
                    key={log.id}
                    className={`border-b border-[#dddddd] last:border-0 hover:bg-[#f8fafc]/60 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}
                  >
                    <TableCell className="text-[#41454d] text-sm whitespace-nowrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">{formatTimeAgo(log.createdAt)}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {formatAbsoluteDate(log.createdAt)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-medium text-[#181d26] text-sm">
                      {log.user?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium ${color.bg} ${color.text}`}>
                        <ActionIcon size={12} />
                        {label}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#41454d] text-sm">
                      {entityTypeLabels[log.entityType] || log.entityType}
                    </TableCell>
                    <TableCell className="text-[#41454d] text-sm max-w-[300px]">
                      <span className="line-clamp-2">{formatDetail(log.action, log.details)}</span>
                    </TableCell>
                    <TableCell className="text-[#41454d] text-sm font-mono text-xs">
                      {log.entityId.substring(0, 8)}...
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Result count */}
      {searchQuery && filteredLogs.length > 0 && (
        <p className="text-xs text-[#41454d] mt-3">
          {filteredLogs.length} resultado{filteredLogs.length !== 1 ? 's' : ''} para &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-[#41454d]">
            Mostrando {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} de {total} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-[8px] border-[#dddddd]"
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                // Add ellipsis
                const prevP = arr[idx - 1]
                const showEllipsis = prevP !== undefined && p - prevP > 1
                return (
                  <span key={p} className="flex items-center gap-2">
                    {showEllipsis && <span className="text-[#41454d] text-xs px-1">...</span>}
                    <Button
                      variant={p === page ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setPage(p)}
                      className={`h-9 w-9 rounded-[8px] ${
                        p === page ? 'bg-[#181d26] text-white' : 'border-[#dddddd] text-[#41454d]'
                      }`}
                    >
                      {p}
                    </Button>
                  </span>
                )
              })}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-[8px] border-[#dddddd]"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
