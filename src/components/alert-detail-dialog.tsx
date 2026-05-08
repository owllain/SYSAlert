'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
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
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'

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

interface Note {
  id: string
  content: string
  alertId: string
  userId: string
  user: { id: string; name: string; username: string; financialEntity: { name: string } }
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

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

export function AlertDetailDialog({ open, onOpenChange, alert, onStatusChange }: AlertDetailDialogProps) {
  const [changingStatus, setChangingStatus] = useState(false)
  const { currentUser } = useAppStore()

  // Notes state
  const [notes, setNotes] = useState<Note[]>([])
  const [noteContent, setNoteContent] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [submittingNote, setSubmittingNote] = useState(false)

  const fetchNotes = useCallback(async (alertId: string) => {
    setLoadingNotes(true)
    try {
      const res = await fetch(`/api/notes?alertId=${alertId}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }, [])

  useEffect(() => {
    if (open && alert?.id) {
      fetchNotes(alert.id)
      setNoteContent('')
    }
    if (!open) {
      setNotes([])
      setNoteContent('')
    }
  }, [open, alert?.id, fetchNotes])

  const handleAddNote = async () => {
    if (!noteContent.trim() || !alert?.id || !currentUser?.id) return
    setSubmittingNote(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent.trim(),
          alertId: alert.id,
          userId: currentUser.id,
        }),
      })
      if (res.ok) {
        const newNote = await res.json()
        setNotes(prev => [newNote, ...prev])
        setNoteContent('')
        toast.success('Nota agregada correctamente')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al agregar nota')
      }
    } catch {
      toast.error('Error al agregar nota')
    } finally {
      setSubmittingNote(false)
    }
  }

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

  if (!alert) return null

  const canAddNote = currentUser?.role === 'admin' || currentUser?.role === 'analyst'

  // Severity logic
  const severity = alert.profile === 'victima' && alert.economicAffectation
    ? 'high'
    : alert.profile === 'victima' || alert.economicAffectation
    ? 'medium'
    : 'low'

  const severityConfig = {
    high: { label: 'Alta', dot: 'bg-[#aa2d00]', bg: 'bg-[#aa2d00]/10', text: 'text-[#aa2d00]' },
    medium: { label: 'Media', dot: 'bg-[#f5e9d4]', bg: 'bg-[#f5e9d4]/60', text: 'text-[#181d26]' },
    low: { label: 'Baja', dot: 'bg-[#0a2e0e]', bg: 'bg-[#0a2e0e]/10', text: 'text-[#0a2e0e]' },
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar"
        >
          {/* Profile & Status Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Severity Badge */}
            <Badge className={`rounded-[8px] px-3 py-1 text-sm font-medium ${severityConfig[severity].bg} ${severityConfig[severity].text} border border-current/10`}>
              <span className={`w-2 h-2 rounded-full ${severityConfig[severity].dot} mr-1.5 inline-block`} />
              Severidad: {severityConfig[severity].label}
            </Badge>

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
          {currentUser?.role !== 'viewer' && (
            <>
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
            </>
          )}

          {/* Notes Section */}
          <Separator className="bg-[#dddddd]" />

          <div className="bg-[#f5e9d4]/30 border border-[#e8d5b8] rounded-[10px] p-4 -mx-1">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-[#41454d]" />
              <p className="text-xs text-[#41454d] uppercase tracking-wider font-medium">Notas</p>
              {!loadingNotes && notes.length > 0 && (
                <span className="text-[10px] bg-[#f5e9d4] text-[#181d26] px-1.5 py-0.5 rounded-[4px] font-medium">
                  {notes.length}
                </span>
              )}
            </div>

            {/* Notes list */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar mb-3">
              {loadingNotes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="text-[#41454d] animate-spin" />
                  <span className="ml-2 text-xs text-[#41454d]">Cargando notas...</span>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-4">
                  <MessageSquare size={20} className="text-[#dddddd] mx-auto mb-1.5" />
                  <p className="text-xs text-[#41454d]">No hay notas para esta alerta</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white rounded-[8px] p-3 shadow-sm border border-[#dddddd]/60"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#181d26] text-white flex items-center justify-center flex-shrink-0 text-[10px] font-medium">
                        {getInitials(note.user?.name || 'U')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-[#181d26]">{note.user?.name || 'Usuario'}</span>
                          <span className="text-[10px] text-[#9297a0]">·</span>
                          <span className="text-[10px] text-[#9297a0]" title={new Date(note.createdAt).toLocaleString('es-CR')}>
                            {formatRelativeTime(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[#333840] leading-relaxed whitespace-pre-wrap break-words">
                          {note.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add note input */}
            {canAddNote && (
              <div className="flex items-end gap-2">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Escribir una nota..."
                  className="min-h-[60px] max-h-[120px] bg-white rounded-[8px] border-[#dddddd] text-sm resize-none focus:border-[#181d26] focus:ring-[#181d26]/10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleAddNote()
                    }
                  }}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || submittingNote}
                  className="bg-[#181d26] text-white rounded-[8px] px-3 h-[60px] hover:bg-[#181d26]/90 shrink-0"
                >
                  {submittingNote ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>
            )}
          </div>
        </motion.div>

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
