'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertFormDialog } from '@/components/alert-form-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
}

const idTypeLabels: Record<string, string> = {
  cedula: 'Cédula',
  dimex: 'DIMEX',
  pasaporte: 'Pasaporte',
}

export function MyAlertsView() {
  const { currentUser } = useAppStore()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editAlert, setEditAlert] = useState<Alert | null>(null)
  const [deleteAlert, setDeleteAlert] = useState<Alert | null>(null)

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

  const handleDelete = async () => {
    if (!deleteAlert) return
    try {
      const res = await fetch(`/api/alerts?id=${deleteAlert.id}`, { method: 'DELETE' })
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const truncate = (str: string, len: number) =>
    str.length > len ? str.substring(0, len) + '...' : str

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-2xl font-medium text-[#181d26]">Mis Alertas</h2>
          <p className="text-[#41454d] mt-1">Gestión de alertas creadas por usted</p>
        </div>
        <Button
          onClick={() => { setEditAlert(null); setFormOpen(true) }}
          className="bg-[#181d26] text-white rounded-[12px] px-6 py-4 h-auto text-base font-medium hover:bg-[#181d26]/90"
        >
          <Plus size={18} className="mr-2" />
          Crear Alerta
        </Button>
      </div>

      <div className="bg-white border border-[#dddddd] rounded-[12px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#dddddd]">
              <TableHead className="text-[#41454d] font-medium">Perfil</TableHead>
              <TableHead className="text-[#41454d] font-medium">Persona</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden md:table-cell">Identificación</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden lg:table-cell">Descripción</TableHead>
              <TableHead className="text-[#41454d] font-medium">Estado</TableHead>
              <TableHead className="text-[#41454d] font-medium hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="text-[#41454d] font-medium text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[#41454d]">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-[#41454d]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#f8fafc] flex items-center justify-center">
                      <span className="text-2xl">🔔</span>
                    </div>
                    <p>No tiene alertas registradas</p>
                    <p className="text-xs text-[#41454d]">Cree su primera alerta usando el botón superior</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id} className="border-b border-[#dddddd] last:border-0">
                  <TableCell>
                    <Badge
                      className={`rounded-[6px] font-normal ${
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
                    <span className="text-xs text-[#41454d] ml-1">({idTypeLabels[alert.personIdType]})</span>
                  </TableCell>
                  <TableCell className="text-[#41454d] hidden lg:table-cell text-sm max-w-[200px]">
                    {truncate(alert.description, 60)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`rounded-[6px] font-normal ${
                        alert.status === 'active'
                          ? 'bg-[#0a2e0e] text-white'
                          : alert.status === 'resolved'
                          ? 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]'
                          : 'bg-[#f5e9d4] text-[#181d26]'
                      }`}
                    >
                      {alert.status === 'active' ? 'Activa' : alert.status === 'resolved' ? 'Resuelta' : 'Descartada'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#41454d] text-sm hidden sm:table-cell">
                    {formatDate(alert.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  )
}
