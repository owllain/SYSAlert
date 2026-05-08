'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  CreditCard,
  FileText,
  Building2,
  CalendarDays,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowRight,
  DollarSign,
} from 'lucide-react'
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

interface AlertDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert: Alert | null
  onStatusChange?: () => void
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

export function AlertDetailDialog({ open, onOpenChange, alert, onStatusChange }: AlertDetailDialogProps) {
  const [changingStatus, setChangingStatus] = useState(false)
  const { currentUser } = useAppStore()

  if (!alert) return null

  const handleStatusChange = async (newStatus: 'resolved' | 'dismissed' | 'active') => {
    setChangingStatus(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alert.id, status: newStatus, updatedBy: currentUser?.id }),
      })
      if (res.ok) {
        toast.success(`Alerta cambiada a "${statusLabels[newStatus]}" correctamente`)
        onStatusChange?.()
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al cambiar estado')
      }
    } catch {
      toast.error('Error al cambiar estado')
    } finally {
      setChangingStatus(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[12px] p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="text-xl font-medium text-[#181d26]">
            Detalle de Alerta
          </DialogTitle>
          <DialogDescription className="text-sm text-[#41454d] mt-1">
            Información completa de la alerta registrada
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* Profile & Status Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              className={`rounded-[8px] px-3 py-1 text-sm font-medium ${
                alert.profile === 'victima'
                  ? 'bg-[#aa2d00] text-white'
                  : 'bg-[#0a2e0e] text-white'
              }`}
            >
              {alert.profile === 'victima' ? 'Víctima' : 'Receptor'}
            </Badge>

            {alert.economicAffectation && (
              <Badge className="rounded-[8px] px-3 py-1 text-sm font-medium bg-[#f5e9d4] text-[#181d26] border border-[#e8d5b8]">
                <DollarSign size={14} className="mr-1" />
                Afectación Económica
              </Badge>
            )}

            <Badge
              variant="secondary"
              className={`rounded-[8px] px-3 py-1 text-sm font-medium ${
                alert.status === 'active'
                  ? 'bg-[#0a2e0e]/10 text-[#0a2e0e] border border-[#0a2e0e]/20'
                  : alert.status === 'resolved'
                  ? 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]'
                  : 'bg-[#f5e9d4] text-[#181d26] border border-[#e8d5b8]'
              }`}
            >
              {alert.status === 'active' && <ShieldAlert size={14} className="mr-1.5" />}
              {alert.status === 'resolved' && <CheckCircle2 size={14} className="mr-1.5" />}
              {alert.status === 'dismissed' && <XCircle size={14} className="mr-1.5" />}
              {statusLabels[alert.status] || alert.status}
            </Badge>
          </div>

          <Separator className="bg-[#dddddd]" />

          {/* Person Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={16} className="text-[#41454d]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium mb-1">Persona</p>
                <p className="text-[#181d26] font-medium text-base">{alert.personName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard size={16} className="text-[#41454d]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium mb-1">Identificación</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#181d26] text-base">{alert.personId}</span>
                  <Badge className="rounded-[6px] text-xs font-normal bg-[#f8fafc] text-[#41454d] border border-[#dddddd]">
                    {idTypeLabels[alert.personIdType] || alert.personIdType}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-[#dddddd]" />

          {/* Description */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText size={16} className="text-[#41454d]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium mb-1.5">Descripción</p>
              <p className="text-[#333840] text-sm leading-relaxed whitespace-pre-wrap">{alert.description}</p>
            </div>
          </div>

          <Separator className="bg-[#dddddd]" />

          {/* Entity & Creator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 size={16} className="text-[#41454d]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium mb-1">Entidad</p>
                <p className="text-[#181d26] text-sm font-medium">{alert.financialEntity?.name || '—'}</p>
                <p className="text-xs text-[#41454d]">Código: {alert.financialEntity?.code || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={16} className="text-[#41454d]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium mb-1">Creada por</p>
                <p className="text-[#181d26] text-sm font-medium">{alert.creator?.name || '—'}</p>
                <p className="text-xs text-[#41454d]">{alert.creator?.financialEntity?.name || ''}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-[#dddddd]" />

          {/* Dates */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#f8fafc] border border-[#dddddd] flex items-center justify-center flex-shrink-0 mt-0.5">
              <CalendarDays size={16} className="text-[#41454d]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium mb-1">Fechas</p>
              <div className="space-y-1">
                <p className="text-sm text-[#333840]">
                  <span className="text-[#41454d]">Creada:</span>{' '}
                  {formatDate(alert.createdAt)}
                </p>
                <p className="text-sm text-[#333840]">
                  <span className="text-[#41454d]">Actualizada:</span>{' '}
                  {formatDate(alert.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Status Change Section */}
          <Separator className="bg-[#dddddd]" />

          <div>
            <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium mb-3">Cambiar Estado</p>
            <div className="flex items-center gap-2 flex-wrap">
              {alert.status === 'active' && (
                <>
                  <Button
                    onClick={() => handleStatusChange('resolved')}
                    disabled={changingStatus}
                    className="bg-[#0a2e0e] text-white rounded-[10px] px-4 h-9 text-sm font-medium hover:bg-[#0a2e0e]/90"
                  >
                    <CheckCircle2 size={15} className="mr-1.5" />
                    Marcar Resuelta
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('dismissed')}
                    disabled={changingStatus}
                    variant="outline"
                    className="border-[#dddddd] text-[#41454d] rounded-[10px] px-4 h-9 text-sm font-medium hover:bg-[#f5e9d4]/50 hover:text-[#181d26] hover:border-[#e8d5b8]"
                  >
                    <XCircle size={15} className="mr-1.5" />
                    Descartar
                  </Button>
                </>
              )}
              {alert.status === 'resolved' && (
                <Button
                  onClick={() => handleStatusChange('active')}
                  disabled={changingStatus}
                  variant="outline"
                  className="border-[#dddddd] text-[#41454d] rounded-[10px] px-4 h-9 text-sm font-medium hover:bg-[#0a2e0e]/5 hover:text-[#0a2e0e] hover:border-[#0a2e0e]/30"
                >
                  <ArrowRight size={15} className="mr-1.5" />
                  Reactivar
                </Button>
              )}
              {alert.status === 'dismissed' && (
                <Button
                  onClick={() => handleStatusChange('active')}
                  disabled={changingStatus}
                  variant="outline"
                  className="border-[#dddddd] text-[#41454d] rounded-[10px] px-4 h-9 text-sm font-medium hover:bg-[#0a2e0e]/5 hover:text-[#0a2e0e] hover:border-[#0a2e0e]/30"
                >
                  <ArrowRight size={15} className="mr-1.5" />
                  Reactivar
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 pt-4 flex items-center justify-end border-t border-[#dddddd]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white text-[#181d26] border border-[#dddddd] rounded-[12px] px-6 py-3 h-auto"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
