'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertFormDialog } from '@/components/alert-form-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { AlertDetailDialog } from '@/components/alert-detail-dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  DollarSign,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

interface Alert {
  id: string
  profile: string
  economicAffectation: boolean
  personName: string
  personId: string
  personIdType: string
  description: string
  status: string
  createdBy: string
  financialEntityId: string
  financialEntity: { id: string; name: string; code: string }
  creator: { id: string; name: string; username: string; financialEntity: { name: string } }
  createdAt: string
  updatedAt: string
}

const idTypeLabels: Record<string, string> = {
  cedula: 'Cédula',
  dimex: 'DIMEX',
  pasaporte: 'Pasaporte',
}

const statusLabels: Record<string, string> = {
  active: 'Activa',
  resolved: 'Resuelta',
  dismissed: 'Descartada',
}

export function MyAlertsView() {
  const { currentUser, createAlertOpen, setCreateAlertOpen, searchFocused, setSearchFocused } = useAppStore()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editAlert, setEditAlert] = useState<Alert | null>(null)
  const [deleteAlert, setDeleteAlert] = useState<Alert | null>(null)
  const [detailAlert, setDetailAlert] = useState<Alert | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [changingStatus, setChangingStatus] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchAlerts = useCallback(async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/alerts?userId=${currentUser.id}`)
      const data = await res.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Open create alert dialog when createAlertOpen is triggered
  useEffect(() => {
    if (createAlertOpen) {
      setEditAlert(null)
      setFormOpen(true)
      setCreateAlertOpen(false)
    }
  }, [createAlertOpen, setCreateAlertOpen])

  // Focus search input when searchFocused is triggered
  useEffect(() => {
    if (searchFocused) {
      searchInputRef.current?.focus()
      setSearchFocused(false)
    }
  }, [searchFocused, setSearchFocused])

  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) return alerts
    const q = searchQuery.toLowerCase().trim()
    return alerts.filter(
      (a) =>
        a.personName.toLowerCase().includes(q) ||
        a.personId.toLowerCase().includes(q)
    )
  }, [alerts, searchQuery])

  const handleDelete = async () => {
    if (!deleteAlert) return
    try {
      const res = await fetch(`/api/alerts?id=${deleteAlert.id}&deletedBy=${currentUser?.id || ''}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Alerta eliminada correctamente')
        fetchAlerts()
      } else {
        toast.error('Error al eliminar alerta')
      }
    } catch {
      toast.error('Error al eliminar alerta')
    } finally {
      setDeleteAlert(null)
    }
  }

  const handleStatusChange = async (alertId: string, newStatus: 'resolved' | 'dismissed' | 'active') => {
    setChangingStatus(alertId)
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, status: newStatus, updatedBy: currentUser?.id }),
      })
      if (res.ok) {
        toast.success(`Alerta cambiada a "${statusLabels[newStatus]}"`)
        fetchAlerts()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al cambiar estado')
      }
    } catch {
      toast.error('Error al cambiar estado')
    } finally {
      setChangingStatus(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const truncate = (str: string, len: number) =>
    str.length > len ? str.substring(0, len) + '...' : str

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium text-[#181d26]">Mis Alertas</h2>
          <p className="text-[#41454d] mt-1">Gestión de alertas creadas por usted</p>
          {currentUser?.role === 'viewer' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#aa2d00] bg-[#aa2d00]/5 px-3 py-2 rounded-[8px] border border-[#aa2d00]/10 w-fit">
              <ShieldAlert size={12} />
              Su rol solo permite consulta
            </div>
          )}
        </div>
        {currentUser?.role !== 'viewer' && (
          <Button
            onClick={() => { setEditAlert(null); setFormOpen(true) }}
            className="bg-[#181d26] text-white rounded-[12px] px-6 py-4 h-auto text-base font-medium hover:bg-[#181d26]/90 active:scale-[0.98] transition-transform"
          >
            <Plus size={18} className="mr-2" />
            Crear Alerta
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#41454d]" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o identificación..."
            className="pl-9 h-10 rounded-[8px] border-[#dddddd] bg-white focus:border-[#181d26] focus:ring-[#181d26]/10 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#dddddd] bg-[#f8fafc]/80">
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Perfil</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Persona</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider hidden md:table-cell">Identificación</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Afectación</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider hidden xl:table-cell">Descripción</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Fecha</TableHead>
              {currentUser?.role !== 'viewer' && (
                <TableHead className="text-[#41454d] font-medium text-xs uppercase tracking-wider text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className={`border-l-2 border-l-transparent ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={currentUser?.role !== 'viewer' ? 8 : 7} className="text-center py-20 text-[#41454d]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center">
                      <ShieldAlert size={28} className="text-[#41454d]/40" />
                    </div>
                    <div>
                      <p className="font-medium text-[#181d26]">
                        {searchQuery ? 'No se encontraron alertas' : 'No tiene alertas registradas'}
                      </p>
                      <p className="text-sm text-[#41454d] mt-1">
                        {searchQuery
                          ? 'Intente con otro término de búsqueda'
                          : 'Cree su primera alerta usando el botón superior'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert, idx) => (
                <TableRow
                  key={alert.id}
                  className={`border-b border-[#dddddd] last:border-0 cursor-pointer hover:bg-[#f8fafc]/60 transition-colors border-l-2 border-l-transparent hover:border-l-[#aa2d00]/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}
                  onClick={() => setDetailAlert(alert)}
                >
                  <TableCell>
                    <Badge
                      className={`rounded-[6px] font-normal text-xs ${
                        alert.profile === 'victima'
                          ? 'bg-[#aa2d00] text-white'
                          : 'bg-[#0a2e0e] text-white'
                      }`}
                    >
                      {alert.profile === 'victima' ? 'Víctima' : 'Receptor'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-[#181d26]">{alert.personName}</TableCell>
                  <TableCell className="text-[#41454d] hidden md:table-cell">
                    <span className="font-mono text-xs">{alert.personId}</span>
                    <span className="text-[10px] text-[#41454d] ml-1.5 bg-[#f8fafc] px-1.5 py-0.5 rounded-[4px] border border-[#dddddd]">
                      {idTypeLabels[alert.personIdType]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {alert.economicAffectation ? (
                      <Badge className="rounded-[6px] text-xs font-normal bg-[#f5e9d4] text-[#181d26] border border-[#e8d5b8]">
                        <DollarSign size={11} className="mr-0.5" />
                        Sí
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#41454d]">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[#41454d] hidden xl:table-cell text-sm max-w-[200px]">
                    {truncate(alert.description, 50)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`rounded-[6px] font-normal text-xs ${
                        alert.status === 'active'
                          ? 'bg-[#0a2e0e]/10 text-[#0a2e0e] border border-[#0a2e0e]/20'
                          : alert.status === 'resolved'
                          ? 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]'
                          : 'bg-[#f5e9d4] text-[#181d26] border border-[#e8d5b8]'
                      }`}
                    >
                      {statusLabels[alert.status] || alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#41454d] text-sm hidden sm:table-cell whitespace-nowrap">
                    {formatDate(alert.createdAt)}
                  </TableCell>
                  {currentUser?.role !== 'viewer' && (
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#41454d] hover:text-[#181d26]"
                          onClick={() => { setEditAlert(alert); setFormOpen(true) }}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#aa2d00] hover:text-[#aa2d00]/80"
                          onClick={() => setDeleteAlert(alert)}
                        >
                          <Trash2 size={14} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#41454d] hover:text-[#181d26]"
                              disabled={changingStatus === alert.id}
                            >
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-[8px]">
                            {alert.status === 'active' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(alert.id, 'resolved')}
                                  className="text-sm cursor-pointer"
                                >
                                  <CheckCircle2 size={14} className="mr-2 text-[#0a2e0e]" />
                                  Marcar como Resuelta
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(alert.id, 'dismissed')}
                                  className="text-sm cursor-pointer"
                                >
                                  <XCircle size={14} className="mr-2 text-[#aa2d00]" />
                                  Descartar Alerta
                                </DropdownMenuItem>
                              </>
                            )}
                            {alert.status === 'resolved' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(alert.id, 'active')}
                                className="text-sm cursor-pointer"
                              >
                                <ArrowRight size={14} className="mr-2 text-[#0a2e0e]" />
                                Reactivar Alerta
                              </DropdownMenuItem>
                            )}
                            {alert.status === 'dismissed' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(alert.id, 'active')}
                                className="text-sm cursor-pointer"
                              >
                                <ArrowRight size={14} className="mr-2 text-[#0a2e0e]" />
                                Reactivar Alerta
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDetailAlert(alert)}
                              className="text-sm cursor-pointer"
                            >
                              Ver Detalle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Result count */}
      {searchQuery && filteredAlerts.length > 0 && (
        <p className="text-xs text-[#41454d] mt-3">
          {filteredAlerts.length} resultado{filteredAlerts.length !== 1 ? 's' : ''} para &quot;{searchQuery}&quot;
        </p>
      )}

      {currentUser && (
        <AlertFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          editAlert={editAlert}
          financialEntityId={currentUser.financialEntityId}
          userId={currentUser.id}
          onSaved={fetchAlerts}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteAlert}
        onOpenChange={(open) => !open && setDeleteAlert(null)}
        onConfirm={handleDelete}
        title="Eliminar Alerta"
        description={`¿Está seguro de que desea eliminar la alerta para "${deleteAlert?.personName}"? Esta acción no se puede deshacer.`}
      />

      <AlertDetailDialog
        open={!!detailAlert}
        onOpenChange={(open) => !open && setDetailAlert(null)}
        alert={detailAlert}
        onStatusChange={fetchAlerts}
      />
    </div>
  )
}
